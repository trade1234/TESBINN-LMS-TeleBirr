const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

exports.getUsers = asyncHandler(async (req, res, next) => {
  const query = {};
  if (req.query.role) query.role = req.query.role;
  if (req.query.status) query.status = req.query.status;

  const users = await User.find(query).select('-__v');

  res.status(200).json({
    success: true,
    count: users.length,
    data: users,
  });
});

exports.getUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id).select('-__v');

  if (!user) {
    return next(new ErrorResponse(`No user with the id of ${req.params.id}`, 404));
  }

  res.status(200).json({ success: true, data: user });
});

exports.updateUserStatus = asyncHandler(async (req, res, next) => {
  const { status } = req.body;

  const user = await User.findById(req.params.id);
  if (!user) {
    return next(new ErrorResponse(`No user with the id of ${req.params.id}`, 404));
  }

  user.status = status;
  await user.save({ validateBeforeSave: false });

  res.status(200).json({ success: true, data: user });
});

exports.approveTeacher = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new ErrorResponse(`No user with the id of ${req.params.id}`, 404));
  }

  if (user.role !== 'teacher') {
    return next(new ErrorResponse('User is not a teacher', 400));
  }

  user.status = 'active';
  await user.save({ validateBeforeSave: false });

  res.status(200).json({ success: true, data: user });
});

exports.updateUserPassword = asyncHandler(async (req, res, next) => {
  const { password } = req.body;

  if (!password || password.length < 6) {
    return next(new ErrorResponse('Password must be at least 6 characters', 400));
  }

  const user = await User.findById(req.params.id).select('+password');

  if (!user) {
    return next(new ErrorResponse(`No user with the id of ${req.params.id}`, 404));
  }

  user.password = password;
  await user.save();

  const sanitizedUser = await User.findById(req.params.id).select('-__v');

  res.status(200).json({ success: true, data: sanitizedUser });
});

exports.createAdminUser = asyncHandler(async (req, res, next) => {
  const { name, email, password, phone, location } = req.body || {};

  if (Array.isArray(req.body) || Array.isArray(req.body?.users)) {
    return next(new ErrorResponse('Batch user operations are not allowed for this endpoint', 400));
  }

  if (!name || !email || !password) {
    return next(new ErrorResponse('Name, email, and password are required', 400));
  }

  if (String(password).length < 12) {
    return next(new ErrorResponse('Admin password must be at least 12 characters', 400));
  }

  const user = await User.create({
    name: String(name).trim(),
    email: String(email).trim().toLowerCase(),
    password: String(password),
    phone: typeof phone === 'string' ? phone.trim() : undefined,
    location: typeof location === 'string' ? location.trim() : undefined,
    role: 'admin',
    status: 'active',
  });

  const sanitizedUser = await User.findById(user._id).select('-__v');

  res.status(201).json({ success: true, data: sanitizedUser });
});
