const { validationResult } = require('express-validator');
const ErrorResponse = require('../utils/errorResponse');

exports.validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }

  const message = errors.array({ onlyFirstError: true }).map((err) => err.msg).join(', ');
  return next(new ErrorResponse(message || 'Invalid request payload', 400));
};
