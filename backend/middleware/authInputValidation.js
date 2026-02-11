const { body } = require('express-validator');

const disallowBatchPayload = body().custom((value) => {
  if (Array.isArray(value)) {
    throw new Error('Batch payloads are not allowed for this endpoint');
  }

  if (value && typeof value === 'object' && Array.isArray(value.users)) {
    throw new Error('Batch user operations are not allowed for this endpoint');
  }

  return true;
});

const registerValidationRules = [
  disallowBatchPayload,
  body('name')
    .exists({ checkFalsy: true })
    .withMessage('Name is required')
    .bail()
    .isString()
    .withMessage('Name must be a string')
    .bail()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .exists({ checkFalsy: true })
    .withMessage('Email is required')
    .bail()
    .isEmail()
    .withMessage('Please provide a valid email')
    .bail()
    .normalizeEmail(),
  body('password')
    .exists({ checkFalsy: true })
    .withMessage('Password is required')
    .bail()
    .isLength({ min: 8, max: 72 })
    .withMessage('Password must be between 8 and 72 characters')
    .bail()
    .matches(/[A-Za-z]/)
    .withMessage('Password must include at least one letter')
    .bail()
    .matches(/\d/)
    .withMessage('Password must include at least one number'),
  body('phone')
    .optional({ nullable: true })
    .isString()
    .withMessage('Phone must be a string')
    .bail()
    .trim()
    .isLength({ max: 25 })
    .withMessage('Phone cannot be more than 25 characters'),
  body('role')
    .optional()
    .custom((value) => {
      if (value === undefined || value === null || value === '' || value === 'student') {
        return true;
      }
      throw new Error('Only student self-registration is allowed');
    })
];

const loginValidationRules = [
  disallowBatchPayload,
  body('email')
    .exists({ checkFalsy: true })
    .withMessage('Email is required')
    .bail()
    .isEmail()
    .withMessage('Please provide a valid email')
    .bail()
    .normalizeEmail(),
  body('password')
    .exists({ checkFalsy: true })
    .withMessage('Password is required')
    .bail()
    .isString()
    .withMessage('Password is required')
];

const createAdminValidationRules = [
  disallowBatchPayload,
  body('name')
    .exists({ checkFalsy: true })
    .withMessage('Name is required')
    .bail()
    .isString()
    .withMessage('Name must be a string')
    .bail()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .exists({ checkFalsy: true })
    .withMessage('Email is required')
    .bail()
    .isEmail()
    .withMessage('Please provide a valid email')
    .bail()
    .normalizeEmail(),
  body('password')
    .exists({ checkFalsy: true })
    .withMessage('Password is required')
    .bail()
    .isLength({ min: 12, max: 72 })
    .withMessage('Admin password must be between 12 and 72 characters')
    .bail()
    .matches(/[A-Z]/)
    .withMessage('Admin password must include at least one uppercase letter')
    .bail()
    .matches(/[a-z]/)
    .withMessage('Admin password must include at least one lowercase letter')
    .bail()
    .matches(/\d/)
    .withMessage('Admin password must include at least one number')
    .bail()
    .matches(/[^A-Za-z0-9]/)
    .withMessage('Admin password must include at least one special character'),
  body('phone')
    .optional({ nullable: true })
    .isString()
    .withMessage('Phone must be a string')
    .bail()
    .trim()
    .isLength({ max: 25 })
    .withMessage('Phone cannot be more than 25 characters'),
  body('location')
    .optional({ nullable: true })
    .isString()
    .withMessage('Location must be a string')
    .bail()
    .trim()
    .isLength({ max: 120 })
    .withMessage('Location cannot be more than 120 characters')
];

module.exports = {
  registerValidationRules,
  loginValidationRules,
  createAdminValidationRules
};
