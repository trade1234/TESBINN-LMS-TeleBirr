const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");
const User = require("../models/User");
const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");
const applyFabricToken = require("../service/applyFabricTokenService");
const orderService = require("../service/requestCreateOrderService");

const createMerchantOrderId = () =>
  `ENR${Date.now()}${Math.floor(Math.random() * 10000)}`;

const isSuccessStatus = (status) =>
  ["PAY_SUCCESS", "Completed", "COMPLETED"].includes(status);

const sanitizeTitle = (value) => {
  const raw = typeof value === "string" ? value : "";
  return raw.replace(/[~`!#$%^*()\-+=|/<>?;:"\[\]{}\\&]/g, " ").replace(/\s+/g, " ").trim();
};

exports.createTelebirrOrder = asyncHandler(async (req, res, next) => {
  const { courseId } = req.body;
  if (!courseId) {
    return next(new ErrorResponse("courseId is required", 400));
  }

  const requiredEnv = [
    "TELEBIRR_BASE_URL",
    "TELEBIRR_WEB_BASE_URL",
    "TELEBIRR_FABRIC_APP_ID",
    "TELEBIRR_APP_SECRET",
    "TELEBIRR_MERCHANT_APP_ID",
    "TELEBIRR_MERCHANT_CODE",
    "TELEBIRR_PRIVATE_KEY",
  ];
  const missingEnv = requiredEnv.filter((key) => !process.env[key]);
  const fallbackCheckoutUrl = process.env.TELEBIRR_FALLBACK_CHECKOUT_URL;
  const allowFallback = Boolean(fallbackCheckoutUrl) && process.env.NODE_ENV !== "production";

  const course = await Course.findById(courseId);
  if (!course || !course.isPublished || !course.isApproved) {
    return next(new ErrorResponse("Course not available for purchase", 404));
  }

  const user = await User.findById(req.user.id).select("phone");
  const rawPhone = typeof user?.phone === "string" ? user.phone.trim() : "";
  if (!rawPhone) {
    return next(
      new ErrorResponse(
        "Phone number is required for payment. Please update your profile.",
        400
      )
    );
  }
  const payerPhone = rawPhone.replace(/\D/g, "");

  const amount = Number(course.price || 0);
  if (!Number.isFinite(amount) || amount <= 0) {
    return next(new ErrorResponse("Course is free or has invalid price", 400));
  }

  let enrollment = await Enrollment.findOne({ student: req.user.id, course: courseId });
  if (!enrollment) {
    enrollment = await Enrollment.create({
      student: req.user.id,
      course: courseId,
      approvalStatus: "pending",
      paymentStatus: "pending",
    });
  }

  if (enrollment.approvalStatus === "approved") {
    return next(new ErrorResponse("Already enrolled in this course", 400));
  }

  const merchOrderId = createMerchantOrderId();
  enrollment.merchOrderId = merchOrderId;
  enrollment.paymentStatus = "pending";
  await enrollment.save();

  if (missingEnv.length) {
    if (allowFallback) {
      return res.status(200).json({
        success: true,
        data: {
          checkoutUrl: fallbackCheckoutUrl,
          merchOrderId,
          prepayId: null,
          isFallback: true,
        },
      });
    }
    return next(
      new ErrorResponse(
        `Missing Telebirr environment variables: ${missingEnv.join(", ")}`,
        503
      )
    );
  }

  let createOrderResult;
  try {
    const tokenResult = await applyFabricToken();
    const fabricToken = tokenResult.token;
    const redirectUrl = courseId
      ? `${process.env.TELEBIRR_REDIRECT_URL}?courseId=${courseId}`
      : process.env.TELEBIRR_REDIRECT_URL;
    const sanitizedTitle = sanitizeTitle(course.title) || "Course";
    createOrderResult = await orderService.requestCreateOrder(
      fabricToken,
      sanitizedTitle,
      amount.toFixed(2),
      merchOrderId,
      redirectUrl,
      payerPhone
    );
  } catch (err) {
    const message = err?.message || "Telebirr request failed";
    if (allowFallback) {
      return res.status(200).json({
        success: true,
        data: {
          checkoutUrl: fallbackCheckoutUrl,
          merchOrderId,
          prepayId: null,
          isFallback: true,
        },
      });
    }
    return next(new ErrorResponse(message, 502));
  }

  if (createOrderResult?.result !== "SUCCESS") {
    const message = createOrderResult?.msg || "Failed to create payment order.";
    return next(new ErrorResponse(message, 400));
  }

  const prepayId = createOrderResult?.biz_content?.prepay_id;
  if (!prepayId) {
    return next(new ErrorResponse("Missing prepay id from payment provider", 400));
  }

  const checkoutUrl = orderService.createCheckoutUrl(prepayId);
  console.log(`[Telebirr] Checkout URL: ${checkoutUrl}`);
  console.log("[Telebirr] create-order response", {
    checkoutUrl,
    merchOrderId,
    prepayId,
  });

  res.status(200).json({
    success: true,
    data: {
      checkoutUrl,
      merchOrderId,
      prepayId,
      prepay_id: prepayId,
    },
  });
});

exports.telebirrNotify = asyncHandler(async (req, res) => {
  console.log("[Telebirr] notify payload", req.body);
  const {
    merch_order_id: merchOrderId,
    payment_order_id: paymentOrderId,
    trade_status: tradeStatus,
    order_status: orderStatus,
  } = req.body || {};

  if (!merchOrderId) {
    return res.status(200).json({ success: false, message: "Missing order id" });
  }

  const enrollment = await Enrollment.findOne({ merchOrderId });
  if (!enrollment) {
    return res.status(200).json({ success: false, message: "Enrollment not found" });
  }

  const status = tradeStatus || orderStatus || "";
  if (isSuccessStatus(status)) {
    const wasApproved = enrollment.approvalStatus === "approved";
    enrollment.approvalStatus = "approved";
    enrollment.paymentStatus = "paid";
    if (paymentOrderId) enrollment.paymentOrderId = paymentOrderId;
    await enrollment.save();

    if (!wasApproved) {
      const course = await Course.findById(enrollment.course);
      if (course) {
        course.totalEnrollments = (course.totalEnrollments || 0) + 1;
        await course.save({ validateBeforeSave: false });
      }
    }
  } else {
    enrollment.paymentStatus = "failed";
    await enrollment.save();
  }

  res.status(200).json({ success: true });
});
