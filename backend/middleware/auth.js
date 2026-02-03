const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('./async');

const getTokenFromRequest = (req) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    return req.headers.authorization.split(' ')[1];
  }

  return null;
};

exports.protect = asyncHandler(async (req, res, next) => {
  const token = getTokenFromRequest(req);

  if (!token) {
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return next(new ErrorResponse('Not authorized to access this route', 401));
    }

    if (user.status !== 'active') {
      return next(new ErrorResponse('Your account is not active', 401));
    }

    req.user = { id: user._id.toString(), role: user.role };
    next();
  } catch (err) {
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }
});

exports.optionalProtect = asyncHandler(async (req, res, next) => {
  const token = getTokenFromRequest(req);
  if (!token) return next();

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || user.status !== 'active') {
      return next();
    }

    req.user = { id: user._id.toString(), role: user.role };
    return next();
  } catch (err) {
    return next();
  }
});

exports.authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(new ErrorResponse('User role is not authorized to access this route', 403));
  }
  next();
};
