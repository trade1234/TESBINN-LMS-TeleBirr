const Course = require('../models/Course');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const { createNotificationForUser, createNotificationsForUsers } = require('../utils/notifications');

const buildInstructorStats = (courses) => {
  const totals = courses.reduce(
    (acc, course) => {
      const enrollments = Number(course.totalEnrollments || 0);
      const price = Number(course.price || 0);
      const reviews = Number(course.numberOfReviews || 0);
      const rating = Number(course.averageRating || 0);

      acc.totalStudents += enrollments;
      acc.totalRevenue += price * enrollments;
      acc.totalReviews += reviews;
      acc.ratingPoints += rating * reviews;
      return acc;
    },
    {
      totalStudents: 0,
      totalRevenue: 0,
      totalReviews: 0,
      ratingPoints: 0,
    }
  );

  const averageRating = totals.totalReviews
    ? totals.ratingPoints / totals.totalReviews
    : 0;

  return {
    totalStudents: totals.totalStudents,
    totalRevenue: totals.totalRevenue,
    totalReviews: totals.totalReviews,
    averageRating,
  };
};

exports.getMyCourses = asyncHandler(async (req, res, next) => {
  const courses = await Course.find({ teacher: req.user.id })
    .populate({ path: 'teacher', select: 'name email profileImage' })
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: courses.length,
    stats: buildInstructorStats(courses),
    data: courses,
  });
});

exports.getPendingCourses = asyncHandler(async (req, res, next) => {
  const courses = await Course.find({ isApproved: false })
    .populate({ path: 'teacher', select: 'name email profileImage' })
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: courses.length,
    data: courses,
  });
});

exports.getAllCoursesForAdmin = asyncHandler(async (req, res, next) => {
  const courses = await Course.find()
    .populate({ path: 'teacher', select: 'name email profileImage' })
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: courses.length,
    data: courses,
  });
});

// @desc    Get all courses
// @route   GET /api/v1/courses
// @route   GET /api/v1/teachers/:teacherId/courses
// @access  Public
exports.getCourses = asyncHandler(async (req, res, next) => {
  if (req.params.teacherId) {
    const courses = await Course.find({ teacher: req.params.teacherId, isPublished: true });
    return res.status(200).json({
      success: true,
      count: courses.length,
      stats: buildInstructorStats(courses),
      data: courses
    });
  } else {
    const query = { isPublished: true, isApproved: true };

    if (req.query.category) {
      query.category = req.query.category;
    }

    const courses = await Course.find(query)
      .populate({ path: 'teacher', select: 'name email profileImage' })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: courses.length,
      data: courses,
    });
  }
});

// @desc    Get single course
// @route   GET /api/v1/courses/:id
// @access  Public
exports.getCourse = asyncHandler(async (req, res, next) => {
  const course = await Course.findById(req.params.id)
    .populate({
      path: 'teacher',
      select: 'name email profileImage'
    });

  if (!course) {
    return next(
      new ErrorResponse(`No course with the id of ${req.params.id}`, 404)
    );
  }

  // Public access for published+approved courses
  if (course.isPublished && course.isApproved) {
    return res.status(200).json({ success: true, data: course });
  }

  // Otherwise require teacher/admin owner access
  if (!req.user) {
    return next(new ErrorResponse('Not authorized to access this course', 401));
  }

  const isOwner = course.teacher && course.teacher._id && course.teacher._id.toString() === req.user.id;
  const isAdmin = req.user.role === 'admin';

  if (!isOwner && !isAdmin) {
    return next(new ErrorResponse('Not authorized to access this course', 403));
  }

  res.status(200).json({
    success: true,
    data: course
  });
});

// @desc    Add course
// @route   POST /api/v1/courses
// @access  Private (Teacher & Admin)
exports.addCourse = asyncHandler(async (req, res, next) => {
  // Add user to req.body
  req.body.teacher = req.user.id;

  const course = await Course.create(req.body);

  if (req.user.role === 'teacher') {
    const teacher = await User.findById(req.user.id).select('name email preferences');
    if (teacher) {
      await createNotificationForUser(
        teacher,
        {
          type: 'course_submitted',
          title: 'Course submitted for approval',
          message: `Your course "${course.title}" is awaiting admin review.`,
          link: `/teacher/courses/${course._id}`,
          meta: { courseId: course._id },
        },
        { preferenceKey: 'courseUpdates', sendEmail: true }
      );
    }

    const admins = await User.find({ role: 'admin', status: 'active' }).select('name email preferences');
    if (admins.length) {
      await createNotificationsForUsers(
        admins,
        {
          type: 'course_submitted',
          title: 'Course awaiting approval',
          message: `${teacher?.name || 'A teacher'} submitted "${course.title}" for review.`,
          link: '/admin/courses',
          meta: { courseId: course._id, teacherId: teacher?._id },
        },
        { preferenceKey: 'courseUpdates', sendEmail: true }
      );
    }
  }

  res.status(201).json({
    success: true,
    data: course
  });
});

// @desc    Update course
// @route   PUT /api/v1/courses/:id
// @access  Private (Teacher & Admin)
exports.updateCourse = asyncHandler(async (req, res, next) => {
  let course = await Course.findById(req.params.id);

  if (!course) {
    return next(
      new ErrorResponse(`No course with the id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is course owner or admin
  if (course.teacher.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to update this course`,
        401
      )
    );
  }

  course = await Course.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: course
  });
});

// @desc    Delete course
// @route   DELETE /api/v1/courses/:id
// @access  Private (Teacher & Admin)
exports.deleteCourse = asyncHandler(async (req, res, next) => {
  const course = await Course.findById(req.params.id);

  if (!course) {
    return next(
      new ErrorResponse(`No course with the id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is course owner or admin
  if (course.teacher.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to delete this course`,
        401
      )
    );
  }

  await course.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Approve course
// @route   PUT /api/v1/courses/:id/approve
// @access  Private (Admin)
exports.approveCourse = asyncHandler(async (req, res, next) => {
  const course = await Course.findById(req.params.id);

  if (!course) {
    return next(
      new ErrorResponse(`No course with the id of ${req.params.id}`, 404)
    );
  }

  course.isApproved = true;
  course.isPublished = true;
  course.rejectionReason = null;
  await course.save();

  const teacher = await User.findById(course.teacher).select('name email preferences');
  if (teacher) {
    await createNotificationForUser(
      teacher,
      {
        type: 'course_approved',
        title: 'Course approved',
        message: `Your course "${course.title}" is now live for students.`,
        link: `/teacher/courses/${course._id}`,
        meta: { courseId: course._id },
      },
      { preferenceKey: 'courseUpdates', sendEmail: true }
    );
  }

  res.status(200).json({
    success: true,
    data: course
  });
});

// @desc    Update course certificate template
// @route   PUT /api/v1/courses/:id/certificate-template
// @access  Private (Teacher & Admin)
exports.updateCertificateTemplate = asyncHandler(async (req, res, next) => {
  const course = await Course.findById(req.params.id);

  if (!course) {
    return next(
      new ErrorResponse(`No course with the id of ${req.params.id}`, 404)
    );
  }

  if (course.teacher.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to update this course`,
        401
      )
    );
  }

  const template = req.body || {};
  course.certificateTemplate = {
    ...course.certificateTemplate?.toObject?.(),
    ...template,
  };

  await course.save();

  res.status(200).json({
    success: true,
    data: course.certificateTemplate
  });
});

exports.rejectCourse = asyncHandler(async (req, res, next) => {
  const course = await Course.findById(req.params.id);

  if (!course) {
    return next(
      new ErrorResponse(`No course with the id of ${req.params.id}`, 404)
    );
  }

  course.isApproved = false;
  course.isPublished = false;
  const reason =
    req.body && typeof req.body.reason === 'string' ? req.body.reason.trim() : '';
  course.rejectionReason = reason || 'Marked for revisions';
  await course.save();

  const teacher = await User.findById(course.teacher).select('name email preferences');
  if (teacher) {
    await createNotificationForUser(
      teacher,
      {
        type: 'course_rejected',
        title: 'Course needs updates',
        message: `Your course "${course.title}" was marked for revisions.`,
        link: `/teacher/courses/${course._id}`,
        meta: { courseId: course._id },
      },
      { preferenceKey: 'courseUpdates', sendEmail: true }
    );
  }

  res.status(200).json({
    success: true,
    data: course
  });
});

// @desc    Get courses by category
// @route   GET /api/v1/courses/category/:category
// @access  Public
exports.getCoursesByCategory = asyncHandler(async (req, res, next) => {
  const courses = await Course.find({ 
    category: req.params.category,
    isPublished: true,
    isApproved: true 
  });

  res.status(200).json({
    success: true,
    count: courses.length,
    data: courses
  });
});

// @desc    Get top rated courses
// @route   GET /api/v1/courses/top
// @access  Public
exports.getTopCourses = asyncHandler(async (req, res, next) => {
  const courses = await Course.find({ isPublished: true, isApproved: true })
    .sort({ averageRating: -1 })
    .limit(5);

  res.status(200).json({
    success: true,
    count: courses.length,
    data: courses
  });
});
