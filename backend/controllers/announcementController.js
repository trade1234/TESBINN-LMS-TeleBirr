const Announcement = require('../models/Announcement');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const { createNotificationsForUsers } = require('../utils/notifications');

const resolveAudienceFilter = (audience) => {
  if (audience === 'students') return { role: 'student' };
  if (audience === 'teachers') return { role: 'teacher' };
  if (audience === 'admins') return { role: 'admin' };
  return {};
};

exports.createAnnouncement = asyncHandler(async (req, res, next) => {
  const { title, message, audience, expiresAt } = req.body || {};

  if (!title || !message) {
    return next(new ErrorResponse('Title and message are required', 400));
  }

  const announcement = await Announcement.create({
    title: String(title).trim(),
    message: String(message).trim(),
    audience: audience || 'all',
    expiresAt: expiresAt ? new Date(expiresAt) : null,
    createdBy: req.user.id,
  });

  const userFilter = {
    status: 'active',
    ...resolveAudienceFilter(announcement.audience),
  };
  const users = await User.find(userFilter).select('email name preferences');

  await createNotificationsForUsers(
    users,
    {
      type: 'announcement',
      title: announcement.title,
      message: announcement.message,
      link: '/',
      meta: { announcementId: announcement._id },
    },
    {
      preferenceKey: 'adminAnnouncements',
      sendEmail: true,
      emailSubject: `Announcement: ${announcement.title}`,
    }
  );

  res.status(201).json({ success: true, data: announcement });
});

exports.getAnnouncements = asyncHandler(async (req, res, next) => {
  const now = new Date();
  const announcements = await Announcement.find({
    $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
  })
    .sort({ createdAt: -1 })
    .populate({ path: 'createdBy', select: 'name email' });

  res.status(200).json({ success: true, count: announcements.length, data: announcements });
});
