const Notification = require('../models/Notification');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

const parsePagination = (req) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
  return { page, limit, skip: (page - 1) * limit };
};

exports.getMyNotifications = asyncHandler(async (req, res, next) => {
  const { page, limit, skip } = parsePagination(req);
  const status = typeof req.query.status === 'string' ? req.query.status.toLowerCase() : 'all';

  const query = { user: req.user.id };
  if (status === 'unread') {
    query.readAt = null;
  } else if (status === 'read') {
    query.readAt = { $ne: null };
  }

  const [total, notifications] = await Promise.all([
    Notification.countDocuments(query),
    Notification.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
  ]);

  res.status(200).json({
    success: true,
    count: notifications.length,
    total,
    page,
    pages: Math.ceil(total / limit) || 1,
    data: notifications,
  });
});

exports.getUnreadCount = asyncHandler(async (req, res, next) => {
  const count = await Notification.countDocuments({ user: req.user.id, readAt: null });
  res.status(200).json({ success: true, data: { unread: count } });
});

exports.markNotificationRead = asyncHandler(async (req, res, next) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user.id },
    { $set: { readAt: new Date() } },
    { new: true }
  );

  if (!notification) {
    return next(new ErrorResponse('Notification not found', 404));
  }

  res.status(200).json({ success: true, data: notification });
});

exports.markAllRead = asyncHandler(async (req, res, next) => {
  const result = await Notification.updateMany(
    { user: req.user.id, readAt: null },
    { $set: { readAt: new Date() } }
  );

  res.status(200).json({
    success: true,
    data: {
      updated: result.modifiedCount || 0,
    },
  });
});

exports.deleteNotification = asyncHandler(async (req, res, next) => {
  const notification = await Notification.findOneAndDelete({
    _id: req.params.id,
    user: req.user.id,
  });

  if (!notification) {
    return next(new ErrorResponse('Notification not found', 404));
  }

  res.status(200).json({ success: true, data: {} });
});
