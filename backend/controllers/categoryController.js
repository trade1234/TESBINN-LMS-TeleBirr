const Category = require('../models/Category');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

exports.getCategories = asyncHandler(async (req, res, next) => {
  const categories = await Category.find().sort({ name: 1 });

  res.status(200).json({
    success: true,
    count: categories.length,
    data: categories,
  });
});

exports.createCategory = asyncHandler(async (req, res, next) => {
  const { name, description } = req.body || {};

  if (!name || !name.trim()) {
    return next(new ErrorResponse('Category name is required', 400));
  }

  const existing = await Category.findOne({ slug: name.trim().toLowerCase().replace(/\s+/g, '-') });
  if (existing) {
    return next(new ErrorResponse('Category with that name already exists', 400));
  }

  const category = await Category.create({
    name: name.trim(),
    description: description?.trim() || '',
  });

  res.status(201).json({
    success: true,
    data: category,
  });
});

exports.updateCategory = asyncHandler(async (req, res, next) => {
  const { name, description } = req.body || {};
  const category = await Category.findById(req.params.id);

  if (!category) {
    return next(new ErrorResponse('Category not found', 404));
  }

  if (name && name.trim()) {
    category.name = name.trim();
  }

  if (description !== undefined) {
    category.description = description?.trim() || "";
  }

  await category.save();

  res.status(200).json({
    success: true,
    data: category,
  });
});

exports.deleteCategory = asyncHandler(async (req, res, next) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    return next(new ErrorResponse('Category not found', 404));
  }

  await category.remove();

  res.status(200).json({
    success: true,
    data: {},
  });
});
