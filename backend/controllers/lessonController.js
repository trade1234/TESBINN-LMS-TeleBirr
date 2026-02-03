const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

const ensureOwner = (course, user) => {
  if (user.role === 'admin') return true;
  return course.teacher.toString() === user.id;
};

const isStudentEnrolled = async (studentId, courseId) => {
  const enrollment = await Enrollment.findOne({
    student: studentId,
    course: courseId,
    $or: [{ approvalStatus: 'approved' }, { approvalStatus: { $exists: false } }],
  });
  return !!enrollment;
};

exports.addLesson = asyncHandler(async (req, res, next) => {
  const {
    courseId,
    moduleId,
    title,
    description,
    lessonType,
    content,
    videoUrl,
    duration,
    documentUrl,
    imageUrl,
    order,
    isFree,
  } = req.body;

  const course = await Course.findById(courseId);
  if (!course) return next(new ErrorResponse('Course not found', 404));

  if (!ensureOwner(course, req.user)) {
    return next(new ErrorResponse('Not authorized to modify this course', 403));
  }

  const moduleDoc = course.modules.id(moduleId);
  if (!moduleDoc) return next(new ErrorResponse('Module not found', 404));

  moduleDoc.lessons.push({
    title,
    description,
    lessonType,
    content,
    videoUrl,
    duration,
    documentUrl,
    imageUrl,
    order,
    isFree,
  });
  await course.save();

  res.status(201).json({ success: true, data: moduleDoc.lessons[moduleDoc.lessons.length - 1] });
});

exports.updateLesson = asyncHandler(async (req, res, next) => {
  const course = await Course.findById(req.params.courseId);
  if (!course) return next(new ErrorResponse('Course not found', 404));

  if (!ensureOwner(course, req.user)) {
    return next(new ErrorResponse('Not authorized to modify this course', 403));
  }

  const moduleDoc = course.modules.id(req.params.moduleId);
  if (!moduleDoc) return next(new ErrorResponse('Module not found', 404));

  const lessonDoc = moduleDoc.lessons.id(req.params.lessonId);
  if (!lessonDoc) return next(new ErrorResponse('Lesson not found', 404));

  const updatable = [
    'title',
    'description',
    'lessonType',
    'content',
    'videoUrl',
    'duration',
    'documentUrl',
    'imageUrl',
    'order',
    'isFree',
  ];
  updatable.forEach((k) => {
    if (req.body[k] !== undefined) lessonDoc[k] = req.body[k];
  });

  await course.save();
  res.status(200).json({ success: true, data: lessonDoc });
});

exports.deleteLesson = asyncHandler(async (req, res, next) => {
  const course = await Course.findById(req.params.courseId);
  if (!course) return next(new ErrorResponse('Course not found', 404));

  if (!ensureOwner(course, req.user)) {
    return next(new ErrorResponse('Not authorized to modify this course', 403));
  }

  const moduleDoc = course.modules.id(req.params.moduleId);
  if (!moduleDoc) return next(new ErrorResponse('Module not found', 404));

  const lessonDoc = moduleDoc.lessons.id(req.params.lessonId);
  if (!lessonDoc) return next(new ErrorResponse('Lesson not found', 404));

  lessonDoc.deleteOne();
  await course.save();

  res.status(200).json({ success: true, data: {} });
});

exports.getLesson = asyncHandler(async (req, res, next) => {
  const course = await Course.findById(req.params.courseId).populate({ path: 'teacher', select: '_id' });
  if (!course || !course.isPublished || !course.isApproved) {
    return next(new ErrorResponse('Course not found', 404));
  }

  const moduleDoc = course.modules.id(req.params.moduleId);
  if (!moduleDoc) return next(new ErrorResponse('Module not found', 404));

  const lessonDoc = moduleDoc.lessons.id(req.params.lessonId);
  if (!lessonDoc) return next(new ErrorResponse('Lesson not found', 404));

  const isOwner = req.user && (req.user.role === 'admin' || course.teacher._id.toString() === req.user.id);
  const canAccessFree = lessonDoc.isFree === true;

  let enrolled = false;
  if (req.user && req.user.role === 'student') {
    enrolled = await isStudentEnrolled(req.user.id, course._id);
  }

  if (!isOwner && !canAccessFree && !enrolled) {
    return next(new ErrorResponse('Not authorized to access this lesson', 403));
  }

  res.status(200).json({ success: true, data: lessonDoc });
});
