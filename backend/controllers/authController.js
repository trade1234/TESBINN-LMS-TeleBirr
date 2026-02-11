const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');

const toPositiveInt = (value, fallback) => {
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const MAX_LOGIN_ATTEMPTS = toPositiveInt(process.env.MAX_LOGIN_ATTEMPTS, 10);
const ACCOUNT_LOCK_MINUTES = toPositiveInt(process.env.ACCOUNT_LOCK_MINUTES, 15);

const durationToSeconds = (duration) => {
  if (typeof duration === 'number') return duration;
  if (typeof duration !== 'string') return null;

  const value = duration.trim();
  if (!value) return null;

  if (/^\d+$/.test(value)) {
    return parseInt(value, 10);
  }

  const match = value.match(/^(\d+)\s*([smhd])$/i);
  if (!match) return null;

  const amount = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();

  const factors = { s: 1, m: 60, h: 3600, d: 86400 };
  return amount * factors[unit];
};

const resolveJwtExpiresIn = () => {
  const configured = process.env.JWT_EXPIRE || '1h';
  const maxSeconds = toPositiveInt(process.env.JWT_MAX_EXPIRE_SECONDS, 3600);
  const configuredSeconds = durationToSeconds(configured);

  if (!configuredSeconds) return `${maxSeconds}s`;
  return configuredSeconds > maxSeconds ? `${maxSeconds}s` : configured;
};

const clearAuthCookie = (res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production'
  });
};

const getLockRemainingSeconds = (lockUntil) => {
  if (!lockUntil) return 0;
  return Math.max(Math.ceil((new Date(lockUntil).getTime() - Date.now()) / 1000), 0);
};

const sanitizeSkills = (skills) => {
  if (Array.isArray(skills)) {
    return skills.map((skill) => (typeof skill === 'string' ? skill.trim() : '')).filter(Boolean);
  }

  if (typeof skills === 'string') {
    return skills.split(',').map((skill) => skill.trim()).filter(Boolean);
  }

  return undefined;
};

const buildUserUpdatePayload = (payload) => {
  const updates = {};
  const assignIfDefined = (path, value) => {
    if (value !== undefined) {
      updates[path] = value;
    }
  };

  assignIfDefined('name', payload.name);
  assignIfDefined('email', payload.email);
  assignIfDefined('bio', payload.bio);
  assignIfDefined('phone', payload.phone);
  assignIfDefined('location', payload.location);
  assignIfDefined('profileImage', payload.profileImage);

  const professional = payload.professional || {};
  assignIfDefined('professional.headline', professional.headline);
  assignIfDefined('professional.currentRole', professional.currentRole);
  assignIfDefined('professional.company', professional.company);
  assignIfDefined('professional.careerFocus', professional.careerFocus);
  assignIfDefined('professional.experienceLevel', professional.experienceLevel);
  assignIfDefined('professional.portfolioUrl', professional.portfolioUrl);
  assignIfDefined('professional.careerGoals', professional.careerGoals);
  assignIfDefined('professional.openToOpportunities', professional.openToOpportunities);
  assignIfDefined('professional.availableForMentorship', professional.availableForMentorship);

  const skills = sanitizeSkills(professional.skills);
  if (skills !== undefined) {
    updates['professional.skills'] = skills;
  }

  const preferences = payload.preferences || {};
  const notifications = preferences.notifications || {};
  assignIfDefined('preferences.notifications.courseReminders', notifications.courseReminders);
  assignIfDefined('preferences.notifications.mentorMessages', notifications.mentorMessages);
  assignIfDefined('preferences.notifications.productUpdates', notifications.productUpdates);

  const learning = preferences.learning || {};
  assignIfDefined('preferences.learning.weeklyStudyGoalHours', learning.weeklyStudyGoalHours);
  assignIfDefined('preferences.learning.personalizedSuggestions', learning.personalizedSuggestions);
  assignIfDefined('preferences.learning.weeklyProgressReport', learning.weeklyProgressReport);

  const security = payload.security || {};
  assignIfDefined('security.mfaEnabled', security.mfaEnabled);
  assignIfDefined('security.newDeviceAlerts', security.newDeviceAlerts);

  return updates;
};


// @desc    Register user
// @route   POST /api/v1/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res, next) => {
  const { name, email, password, role, phone } = req.body;
  const requestedRole = typeof role === 'string' ? role.trim().toLowerCase() : 'student';
  const normalizedName = String(name || '').trim();
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const normalizedPhone = typeof phone === 'string' ? phone.trim() : undefined;

  // Public registration is student-only to prevent role abuse.
  if (requestedRole !== 'student') {
    return next(new ErrorResponse('Only student self-registration is allowed', 403));
  }

  // Create user
  const user = await User.create({
    name: normalizedName,
    email: normalizedEmail,
    password,
    phone: normalizedPhone,
    role: 'student',
    status: 'active'
  });

  sendTokenResponse(user, 200, res);
});

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
  const password = String(req.body.password || '');
  const email = String(req.body.email || '').trim().toLowerCase();

  // Validate email & password
  if (!email || !password) {
    return next(new ErrorResponse('Please provide an email and password', 400));
  }

  // Check for user
  const user = await User.findOne({ email }).select('+password +loginAttempts +lockUntil +tokenVersion');

  if (!user) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  if (user.lockUntil && user.lockUntil.getTime() > Date.now()) {
    const retryAfter = getLockRemainingSeconds(user.lockUntil);
    res.setHeader('Retry-After', retryAfter);
    return next(new ErrorResponse('Account temporarily locked due to excessive failed login attempts', 429));
  }

  // Check if user is active
  if (user.status !== 'active') {
    return next(
      new ErrorResponse(
        'Your account is not active. Please contact support for assistance.',
        401
      )
    );
  }

  // Check if password matches
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    user.loginAttempts = (user.loginAttempts || 0) + 1;

    if (user.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
      user.lockUntil = new Date(Date.now() + ACCOUNT_LOCK_MINUTES * 60 * 1000);
      res.setHeader('Retry-After', ACCOUNT_LOCK_MINUTES * 60);
    }

    await user.save({ validateBeforeSave: false });
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  if (user.loginAttempts || user.lockUntil) {
    user.loginAttempts = 0;
    user.lockUntil = undefined;
  }

  // Update last login
  user.lastLogin = Date.now();
  await user.save({ validateBeforeSave: false });

  sendTokenResponse(user, 200, res);
});

// @desc    Get current logged in user
// @route   GET /api/v1/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Update user details
// @route   PUT /api/v1/auth/updatedetails
// @access  Private
exports.updateDetails = asyncHandler(async (req, res, next) => {
  const fieldsToUpdate = buildUserUpdatePayload(req.body);

  if (!Object.keys(fieldsToUpdate).length) {
    return next(new ErrorResponse('No valid fields to update', 400));
  }

  const user = await User.findByIdAndUpdate(
    req.user.id,
    { $set: fieldsToUpdate },
    {
      new: true,
      runValidators: true
    }
  );

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Update user settings
// @route   PUT /api/v1/auth/settings
// @access  Private
exports.updateSettings = asyncHandler(async (req, res, next) => {
  const fieldsToUpdate = buildUserUpdatePayload(req.body);

  if (!Object.keys(fieldsToUpdate).length) {
    return next(new ErrorResponse('No valid fields to update', 400));
  }

  const user = await User.findByIdAndUpdate(
    req.user.id,
    { $set: fieldsToUpdate },
    {
      new: true,
      runValidators: true
    }
  );

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Update password
// @route   PUT /api/v1/auth/updatepassword
// @access  Private
exports.updatePassword = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('+password +tokenVersion');

  // Check current password
  if (!(await user.matchPassword(req.body.currentPassword))) {
    return next(new ErrorResponse('Password is incorrect', 401));
  }

  user.password = req.body.newPassword;
  user.tokenVersion = (user.tokenVersion || 0) + 1;
  await user.save();

  sendTokenResponse(user, 200, res);
});

// @desc    Forgot password
// @route   POST /api/v1/auth/forgotpassword
// @access  Public
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new ErrorResponse('There is no user with that email', 404));
  }

  // Get reset token
  const resetToken = user.getResetPasswordToken();

  await user.save({ validateBeforeSave: false });

  // Create reset URL
  const frontendBase = process.env.FRONTEND_URL || `${req.protocol}://${req.get('host')}`;
  const resetUrl = `${frontendBase.replace(/\/$/, '')}/reset-password/${resetToken}`;

  const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Use the link below to reset it:\n\n${resetUrl}`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Password reset token',
      message
    });

    res.status(200).json({ success: true, data: 'Email sent' });
  } catch (err) {
    console.log(err);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save({ validateBeforeSave: false });

    return next(new ErrorResponse('Email could not be sent', 500));
  }
});

// @desc    Reset password
// @route   PUT /api/v1/auth/resetpassword/:resettoken
// @access  Public
exports.resetPassword = asyncHandler(async (req, res, next) => {
  // Get hashed token
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.resettoken)
    .digest('hex');

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() }
  });

  if (!user) {
    return next(new ErrorResponse('Invalid token', 400));
  }

  // Set new password
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  user.tokenVersion = (user.tokenVersion || 0) + 1;
  await user.save();

  sendTokenResponse(user, 200, res);
});

// @desc    Logout user
// @route   POST /api/v1/auth/logout
// @access  Private
exports.logout = asyncHandler(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { $inc: { tokenVersion: 1 } });
  clearAuthCookie(res);

  res.status(200).json({
    success: true,
    data: 'Logged out'
  });
});

// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  const jwtExpire = resolveJwtExpiresIn();
  const jwtExpireSeconds = durationToSeconds(jwtExpire) || 3600;

  // Create token
  const token = user.getSignedJwtToken(jwtExpire);

  const options = {
    expires: new Date(
      Date.now() + jwtExpireSeconds * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production'
  };

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      token,
      role: user.role
    });
};
