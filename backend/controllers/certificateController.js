const Certificate = require('../models/Certificate');
const Course = require('../models/Course');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

exports.getMyCertificates = asyncHandler(async (req, res, next) => {
  const certificates = await Certificate.find({ student: req.user.id })
    .populate({ path: 'course', select: 'title category teacher' })
    .sort({ issuedAt: -1 });

  res.status(200).json({ success: true, count: certificates.length, data: certificates });
});

exports.getCertificate = asyncHandler(async (req, res, next) => {
  const certificate = await Certificate.findById(req.params.id)
    .populate({ path: 'course', select: 'title category teacher' })
    .populate({ path: 'student', select: 'name email' });

  if (!certificate) {
    return next(new ErrorResponse('Certificate not found', 404));
  }

  const isOwner = certificate.student && certificate.student._id.toString() === req.user.id;
  const isAdmin = req.user.role === 'admin';

  let isTeacher = false;
  if (!isOwner && !isAdmin) {
    const course = await Course.findById(certificate.course);
    if (course && course.teacher.toString() === req.user.id) {
      isTeacher = true;
    }
  }

  if (!isOwner && !isAdmin && !isTeacher) {
    return next(new ErrorResponse('Not authorized to access this certificate', 403));
  }

  res.status(200).json({ success: true, data: certificate });
});

exports.getCertificatesForCourse = asyncHandler(async (req, res, next) => {
  const course = await Course.findById(req.params.courseId);
  if (!course) {
    return next(new ErrorResponse('Course not found', 404));
  }

  if (req.user.role !== 'admin' && course.teacher.toString() !== req.user.id) {
    return next(new ErrorResponse('Not authorized to view certificates for this course', 403));
  }

  const certificates = await Certificate.find({ course: req.params.courseId })
    .populate({ path: 'student', select: 'name email' })
    .sort({ issuedAt: -1 });

  res.status(200).json({ success: true, count: certificates.length, data: certificates });
});

exports.getAllCertificates = asyncHandler(async (req, res, next) => {
  const certificates = await Certificate.find()
    .populate({ path: 'course', select: 'title category teacher' })
    .populate({ path: 'student', select: 'name email' })
    .sort({ issuedAt: -1 });

  res.status(200).json({ success: true, count: certificates.length, data: certificates });
});
