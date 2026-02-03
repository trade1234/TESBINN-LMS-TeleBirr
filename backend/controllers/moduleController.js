const Course = require('../models/Course');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

const ensureOwner = (course, user) => {
  if (user.role === 'admin') return true;
  return course.teacher.toString() === user.id;
};

exports.addModule = asyncHandler(async (req, res, next) => {
  const { courseId, title, description, order, quiz } = req.body;

  const course = await Course.findById(courseId);
  if (!course) return next(new ErrorResponse('Course not found', 404));

  if (!ensureOwner(course, req.user)) {
    return next(new ErrorResponse('Not authorized to modify this course', 403));
  }

  course.modules.push({ title, description, order, lessons: [], quiz: quiz || null });
  await course.save();

  res.status(201).json({ success: true, data: course.modules[course.modules.length - 1] });
});

exports.updateModule = asyncHandler(async (req, res, next) => {
  const { title, description, order, isPublished, quiz } = req.body;

  const course = await Course.findById(req.params.courseId);
  if (!course) return next(new ErrorResponse('Course not found', 404));

  if (!ensureOwner(course, req.user)) {
    return next(new ErrorResponse('Not authorized to modify this course', 403));
  }

  const moduleDoc = course.modules.id(req.params.moduleId);
  if (!moduleDoc) return next(new ErrorResponse('Module not found', 404));

  if (title !== undefined) moduleDoc.title = title;
  if (description !== undefined) moduleDoc.description = description;
  if (order !== undefined) moduleDoc.order = order;
  if (isPublished !== undefined) moduleDoc.isPublished = isPublished;
  if (quiz !== undefined) moduleDoc.quiz = quiz;

  await course.save();
  res.status(200).json({ success: true, data: moduleDoc });
});

exports.deleteModule = asyncHandler(async (req, res, next) => {
  const course = await Course.findById(req.params.courseId);
  if (!course) return next(new ErrorResponse('Course not found', 404));

  if (!ensureOwner(course, req.user)) {
    return next(new ErrorResponse('Not authorized to modify this course', 403));
  }

  const moduleDoc = course.modules.id(req.params.moduleId);
  if (!moduleDoc) return next(new ErrorResponse('Module not found', 404));

  moduleDoc.deleteOne();
  await course.save();

  res.status(200).json({ success: true, data: {} });
});
