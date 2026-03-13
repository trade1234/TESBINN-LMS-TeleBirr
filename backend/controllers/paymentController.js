const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");
const User = require("../models/User");
const TelebirrCallbackLog = require("../models/TelebirrCallbackLog");
const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");
const applyFabricToken = require("../service/applyFabricTokenService");
const orderService = require("../service/requestCreateOrderService");

const createMerchantOrderId = () =>
  `ENR${Date.now()}${Math.floor(Math.random() * 10000)}`;

const isSuccessStatus = (status) =>
  ["PAY_SUCCESS", "Completed", "COMPLETED", "SUCCESS", "PAID"].includes(status);

const getNotifyValue = (source, ...keys) => {
  for (const key of keys) {
    const value = source?.[key];
    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }
  return undefined;
};

const normalizeNotifyPayload = (payload) => {
  const parsedBizContent =
    typeof payload?.biz_content === "string"
      ? parseStringPayload(payload.biz_content)
      : payload?.biz_content;
  const source = parsedBizContent && typeof parsedBizContent === "object"
    ? { ...payload, ...parsedBizContent }
    : payload;

  return {
    merchOrderId: getNotifyValue(
      source,
      "merch_order_id",
      "merchOrderId",
      "merchant_order_id",
      "merchantOrderId",
      "out_trade_no",
      "outTradeNo"
    ),
    paymentOrderId: getNotifyValue(
      source,
      "payment_order_id",
      "paymentOrderId",
      "third_party_order_id",
      "thirdPartyOrderId",
      "trans_id",
      "transId",
      "transaction_id",
      "transactionId"
    ),
    tradeStatus: getNotifyValue(source, "trade_status", "tradeStatus"),
    orderStatus: getNotifyValue(source, "order_status", "orderStatus"),
    transactionId: getNotifyValue(
      source,
      "transaction_id",
      "transactionId",
      "trans_id",
      "transId"
    ),
    thirdPartyOrderId: getNotifyValue(source, "third_party_order_id", "thirdPartyOrderId"),
    finishTime: getNotifyValue(
      source,
      "finish_time",
      "finishTime",
      "trans_end_time",
      "transEndTime"
    ),
    notifyTime: getNotifyValue(source, "notify_time", "notifyTime"),
    notifyUrl: getNotifyValue(source, "notify_url", "notifyUrl"),
    totalAmount: getNotifyValue(source, "total_amount", "totalAmount"),
    transCurrency: getNotifyValue(source, "trans_currency", "transCurrency"),
    appId: getNotifyValue(source, "appid", "appId"),
    merchCode: getNotifyValue(source, "merch_code", "merchCode"),
  };
};

const parseStringPayload = (value) => {
  const trimmed = typeof value === "string" ? value.trim() : "";
  if (!trimmed) return {};

  // Handle x-www-form-urlencoded bodies delivered as raw text.
  if (trimmed.includes("=") && !trimmed.startsWith("{")) {
    const params = new URLSearchParams(trimmed);
    const parsed = {};
    for (const [key, val] of params.entries()) {
      parsed[key] = val;
    }
    if (Object.keys(parsed).length) return parsed;
  }

  // Handle JSON payload bodies.
  try {
    const parsed = JSON.parse(trimmed);
    if (parsed && typeof parsed === "object") return parsed;
  } catch (error) {
    // Ignore JSON parse errors and return empty object.
  }

  return {};
};

const coerceNotifyPayload = (payload) => {
  if (!payload) return {};
  if (typeof payload === "string") return parseStringPayload(payload);
  if (Buffer.isBuffer(payload)) return parseStringPayload(payload.toString("utf8"));
  if (typeof payload === "object") return payload;
  return {};
};

const hasKeys = (value) =>
  Boolean(value && typeof value === "object" && Object.keys(value).length);

const parseParamsToObject = (paramsString) => {
  const params = new URLSearchParams(paramsString);
  const parsed = {};
  for (const [key, value] of params.entries()) {
    parsed[key] = value;
  }
  return parsed;
};

const parseNotifyParamsFromPath = (req) => {
  const rawUrl = req.originalUrl || req.url || "";
  const marker = "/telebirr/notify";
  const idx = rawUrl.indexOf(marker);
  if (idx === -1) return {};

  const tail = rawUrl.slice(idx + marker.length);
  if (!tail) return {};

  if (tail.startsWith("&")) {
    return parseParamsToObject(tail.slice(1));
  }
  if (tail.startsWith("?")) {
    return parseParamsToObject(tail.slice(1));
  }

  return {};
};

const getPayloadSource = ({ bodyPayload, queryPayload, pathPayload }) => {
  if (hasKeys(bodyPayload)) return "body";
  if (hasKeys(queryPayload)) return "query";
  if (hasKeys(pathPayload)) return "path";
  return "empty";
};

const recordTelebirrCallback = async ({
  req,
  source,
  bodyPayload,
  queryPayload,
  pathPayload,
  requestPayload,
  note,
}) => {
  try {
    const normalized = normalizeNotifyPayload(requestPayload || {});
    await TelebirrCallbackLog.create({
      method: req.method,
      url: req.originalUrl || req.url || "",
      contentType: req.headers["content-type"] || "",
      merchOrderId: normalized.merchOrderId,
      paymentOrderId: normalized.paymentOrderId,
      tradeStatus: normalized.tradeStatus,
      orderStatus: normalized.orderStatus,
      source,
      rawBody: bodyPayload,
      rawQuery: queryPayload,
      rawPathParams: pathPayload,
      parsedPayload: requestPayload,
      note,
    });
  } catch (error) {
    console.warn("[Telebirr] Failed to persist callback audit log", {
      message: error.message,
    });
  }
};

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
  const bodyPayload = coerceNotifyPayload(req.body);
  const queryPayload = coerceNotifyPayload(req.query);
  const pathPayload = parseNotifyParamsFromPath(req);
  const source = getPayloadSource({ bodyPayload, queryPayload, pathPayload });
  const requestPayload = hasKeys(bodyPayload)
    ? bodyPayload
    : hasKeys(queryPayload)
      ? queryPayload
      : pathPayload;

  console.log("[Telebirr] notify request", {
    method: req.method,
    contentType: req.headers["content-type"] || null,
    hasBody: hasKeys(bodyPayload),
    hasQuery: hasKeys(queryPayload),
    hasPathParams: hasKeys(pathPayload),
  });
  console.log("[Telebirr] notify payload", requestPayload);

  await recordTelebirrCallback({
    req,
    source,
    bodyPayload,
    queryPayload,
    pathPayload,
    requestPayload,
    note: "received",
  });

  const notifyData = normalizeNotifyPayload(requestPayload);
  const { merchOrderId, paymentOrderId, tradeStatus, orderStatus } = notifyData;

  if (!merchOrderId) {
    await recordTelebirrCallback({
      req,
      source,
      bodyPayload,
      queryPayload,
      pathPayload,
      requestPayload,
      note: "missing merchant order id",
    });
    console.warn("[Telebirr] Missing merchant order id in notify payload", {
      method: req.method,
      url: req.originalUrl || req.url || null,
      contentType: req.headers["content-type"] || null,
      query: req.query || null,
      body: req.body || null,
    });
    return res.status(200).json({ success: false, message: "Missing order id" });
  }

  const enrollment = await Enrollment.findOne({ merchOrderId });
  if (!enrollment) {
    await recordTelebirrCallback({
      req,
      source,
      bodyPayload,
      queryPayload,
      pathPayload,
      requestPayload,
      note: "enrollment not found",
    });
    console.warn("[Telebirr] Enrollment not found for merchant order", { merchOrderId });
    return res.status(200).json({ success: false, message: "Enrollment not found" });
  }

  const status = tradeStatus || orderStatus || "";
  if (isSuccessStatus(status)) {
    const wasApproved = enrollment.approvalStatus === "approved";
    enrollment.approvalStatus = "approved";
    enrollment.paymentStatus = "paid";
    if (paymentOrderId) enrollment.paymentOrderId = paymentOrderId;
    await enrollment.save();

    console.log("[Telebirr] Payment confirmed", {
      merchOrderId,
      paymentOrderId: paymentOrderId || null,
      enrollmentId: enrollment._id.toString(),
      studentId: enrollment.student.toString(),
      approvalStatus: enrollment.approvalStatus,
      paymentStatus: enrollment.paymentStatus,
    });

    await recordTelebirrCallback({
      req,
      source,
      bodyPayload,
      queryPayload,
      pathPayload,
      requestPayload,
      note: "payment confirmed",
    });

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
    console.log("[Telebirr] Payment not completed", {
      merchOrderId,
      paymentOrderId: paymentOrderId || null,
      enrollmentId: enrollment._id.toString(),
      tradeStatus: tradeStatus || null,
      orderStatus: orderStatus || null,
      paymentStatus: enrollment.paymentStatus,
    });

    await recordTelebirrCallback({
      req,
      source,
      bodyPayload,
      queryPayload,
      pathPayload,
      requestPayload,
      note: "payment not completed",
    });
  }

  res.status(200).json({ success: true });
});
