const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const Certificate = require('../models/Certificate');
const User = require('../models/User');
const crypto = require('crypto');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const { createNotificationForUser, createNotificationsForUsers } = require('../utils/notifications');

const calculatePercent = (course, enrollment) => {
  const lessonKeys = new Set();
  const quizModuleIds = new Set();

  (course.modules || []).forEach((module) => {
    (module.lessons || []).forEach((lesson) => {
      if (module?._id && lesson?._id) {
        lessonKeys.add(`${module._id.toString()}:${lesson._id.toString()}`);
      }
    });
    if (module?.quiz && module.quiz.questions && module.quiz.questions.length) {
      if (module?._id) {
        quizModuleIds.add(module._id.toString());
      }
    }
  });

  const totalItems = lessonKeys.size + quizModuleIds.size;
  if (!totalItems) return 0;

  const lessonSet = new Set(
    (enrollment.completedLessons || [])
      .map((x) => `${x.moduleId?.toString()}:${x.lessonId?.toString()}`)
      .filter((key) => lessonKeys.has(key))
  );
  const quizSet = new Set(
    (enrollment.completedQuizzes || [])
      .filter((x) => x.passed && quizModuleIds.has(x.moduleId?.toString()))
      .map((x) => x.moduleId.toString())
  );

  const percent = Math.round(((lessonSet.size + quizSet.size) / totalItems) * 100);
  return Math.max(0, Math.min(100, percent));
};

const hasBlockingQuiz = (course, enrollment, moduleOrder) => {
  if (!course?.modules) return false;
  const passedQuizSet = new Set(
    (enrollment.completedQuizzes || [])
      .filter((x) => x.passed)
      .map((x) => x.moduleId.toString())
  );

  return course.modules.some((mod) => {
    if (mod.order >= moduleOrder) return false;
    if (!mod.quiz || !mod.quiz.questions || !mod.quiz.questions.length) return false;
    return !passedQuizSet.has(mod._id.toString());
  });
};

const maybeIssueCertificate = async (course, enrollment, user) => {
  if (enrollment.completionStatus !== 'completed') return;
  if (course.certificateTemplate?.enabled === false) return;

  const existingCertificate = await Certificate.findOne({ enrollment: enrollment._id });
  if (existingCertificate) return;

  let studentName = user?.name;
  if (!studentName) {
    const student = await User.findById(enrollment.student).select('name');
    studentName = student?.name;
  }
  if (!studentName) {
    studentName = 'Student';
  }
  const templateSnapshot = course.certificateTemplate || {};

  await Certificate.create({
    student: enrollment.student,
    course: enrollment.course,
    enrollment: enrollment._id,
    recipientName: studentName,
    courseTitle: course.title,
    certificateNumber: createCertificateNumber(),
    templateSnapshot,
    issuedAt: new Date(),
  });
};

const createCertificateNumber = () => {
  const token = crypto.randomUUID ? crypto.randomUUID().replace(/-/g, '') : Date.now().toString();
  return `CERT-${token.slice(0, 12).toUpperCase()}`;
};

exports.enrollInCourse = asyncHandler(async (req, res, next) => {
  const { courseId } = req.body;

  const course = await Course.findById(courseId);
  if (!course || !course.isPublished || !course.isApproved) {
    return next(new ErrorResponse('Course not available for enrollment', 404));
  }

  const existing = await Enrollment.findOne({ student: req.user.id, course: courseId });
  let shouldNotify = false;
  if (existing) {
    if (!existing.approvalStatus || existing.approvalStatus === 'approved') {
      return next(new ErrorResponse('Already enrolled in this course', 400));
    }

    if (existing.approvalStatus === 'rejected') {
      shouldNotify = true;
      existing.approvalStatus = 'pending';
      existing.rejectionReason = undefined;
      existing.reviewedBy = undefined;
      existing.reviewedAt = undefined;
      existing.completedLessons = [];
      existing.percentComplete = 0;
      existing.completionStatus = 'not_started';
      await existing.save();
    }

    if (shouldNotify) {
      const [student, teacher, admins] = await Promise.all([
        User.findById(req.user.id).select('name email preferences'),
        User.findById(course.teacher).select('name email preferences'),
        User.find({ role: 'admin', status: 'active' }).select('name email preferences'),
      ]);

      await createNotificationForUser(
        student,
        {
          type: 'enrollment_requested',
          title: 'Enrollment request sent',
          message: `Your request to enroll in "${course.title}" is pending approval.`,
          link: '/student/courses',
          meta: { courseId: course._id, enrollmentId: existing._id },
        },
        { preferenceKey: 'enrollmentUpdates', sendEmail: true }
      );

      await createNotificationsForUsers(
        admins,
        {
          type: 'enrollment_pending_review',
          title: 'Enrollment requires review',
          message: `${student?.name || 'A student'} requested access to "${course.title}".`,
          link: '/admin/approvals',
          meta: { courseId: course._id, enrollmentId: existing._id },
        },
        { preferenceKey: 'enrollmentUpdates', sendEmail: true }
      );

      await createNotificationForUser(
        teacher,
        {
          type: 'enrollment_pending_review',
          title: 'New enrollment request',
          message: `${student?.name || 'A student'} requested access to "${course.title}".`,
          link: `/teacher/courses/${course._id}`,
          meta: { courseId: course._id, enrollmentId: existing._id },
        },
        { preferenceKey: 'enrollmentUpdates', sendEmail: true }
      );
    }

    return res.status(200).json({ success: true, data: existing });
  }

  const enrollment = await Enrollment.create({
    student: req.user.id,
    course: courseId,
    completionStatus: 'not_started',
    approvalStatus: 'pending',
  });

  const [student, teacher, admins] = await Promise.all([
    User.findById(req.user.id).select('name email preferences'),
    User.findById(course.teacher).select('name email preferences'),
    User.find({ role: 'admin', status: 'active' }).select('name email preferences'),
  ]);

  await createNotificationForUser(
    student,
    {
      type: 'enrollment_requested',
      title: 'Enrollment request sent',
      message: `Your request to enroll in "${course.title}" is pending approval.`,
      link: '/student/courses',
      meta: { courseId: course._id, enrollmentId: enrollment._id },
    },
    { preferenceKey: 'enrollmentUpdates', sendEmail: true }
  );

  await createNotificationsForUsers(
    admins,
    {
      type: 'enrollment_pending_review',
      title: 'Enrollment requires review',
      message: `${student?.name || 'A student'} requested access to "${course.title}".`,
      link: '/admin/approvals',
      meta: { courseId: course._id, enrollmentId: enrollment._id },
    },
    { preferenceKey: 'enrollmentUpdates', sendEmail: true }
  );

  await createNotificationForUser(
    teacher,
    {
      type: 'enrollment_pending_review',
      title: 'New enrollment request',
      message: `${student?.name || 'A student'} requested access to "${course.title}".`,
      link: `/teacher/courses/${course._id}`,
      meta: { courseId: course._id, enrollmentId: enrollment._id },
    },
    { preferenceKey: 'enrollmentUpdates', sendEmail: true }
  );

  res.status(201).json({ success: true, data: enrollment });
});

exports.getMyEnrollments = asyncHandler(async (req, res, next) => {
  const enrollments = await Enrollment.find({ student: req.user.id })
    .populate({
      path: 'course',
      select: 'title description category imageUrl teacher isPublished isApproved duration totalEnrollments averageRating price modules',
      populate: { path: 'teacher', select: 'name profileImage' },
    });

  res.status(200).json({ success: true, count: enrollments.length, data: enrollments });
});

exports.getEnrollmentsForCourse = asyncHandler(async (req, res, next) => {
  const course = await Course.findById(req.params.courseId);
  if (!course) {
    return next(new ErrorResponse('Course not found', 404));
  }

  if (req.user.role !== 'admin' && course.teacher.toString() !== req.user.id) {
    return next(new ErrorResponse('Not authorized to view enrollments for this course', 403));
  }

  const enrollments = await Enrollment.find({ course: req.params.courseId })
    .populate({ path: 'student', select: 'name email status' });

  res.status(200).json({ success: true, count: enrollments.length, data: enrollments });
});

exports.updateProgress = asyncHandler(async (req, res, next) => {
  const { moduleId, lessonId } = req.body;

  const enrollment = await Enrollment.findById(req.params.id);
  if (!enrollment) {
    return next(new ErrorResponse('Enrollment not found', 404));
  }

  if (enrollment.student.toString() !== req.user.id) {
    return next(new ErrorResponse('Not authorized to update this enrollment', 403));
  }

  if (enrollment.approvalStatus && enrollment.approvalStatus !== 'approved') {
    return next(new ErrorResponse('Enrollment is not approved yet', 403));
  }

  const course = await Course.findById(enrollment.course);
  if (!course) {
    return next(new ErrorResponse('Course not found', 404));
  }

  const moduleDoc = course.modules.id(moduleId);
  if (!moduleDoc) {
    return next(new ErrorResponse('Module not found', 404));
  }

  if (hasBlockingQuiz(course, enrollment, moduleDoc.order || 0)) {
    return next(new ErrorResponse('Complete the previous module quiz before continuing', 403));
  }

  const key = `${moduleId}:${lessonId}`;
  const existing = new Set(
    (enrollment.completedLessons || []).map((x) => `${x.moduleId.toString()}:${x.lessonId.toString()}`)
  );

  if (!existing.has(key)) {
    enrollment.completedLessons.push({ moduleId, lessonId });
  }

  enrollment.percentComplete = calculatePercent(course, enrollment);

  if (enrollment.percentComplete >= 100) {
    enrollment.completionStatus = 'completed';
    enrollment.completedAt = new Date();
  } else {
    enrollment.completionStatus = 'in_progress';
  }

  await enrollment.save();
  await maybeIssueCertificate(course, enrollment, req.user);

  res.status(200).json({ success: true, data: enrollment });
});

exports.submitQuiz = asyncHandler(async (req, res, next) => {
  const { moduleId, answers } = req.body;

  const enrollment = await Enrollment.findById(req.params.id);
  if (!enrollment) {
    return next(new ErrorResponse('Enrollment not found', 404));
  }

  if (enrollment.student.toString() !== req.user.id) {
    return next(new ErrorResponse('Not authorized to update this enrollment', 403));
  }

  if (enrollment.approvalStatus && enrollment.approvalStatus !== 'approved') {
    return next(new ErrorResponse('Enrollment is not approved yet', 403));
  }

  const course = await Course.findById(enrollment.course);
  if (!course) {
    return next(new ErrorResponse('Course not found', 404));
  }

  const moduleDoc = course.modules.id(moduleId);
  if (!moduleDoc) {
    return next(new ErrorResponse('Module not found', 404));
  }

  if (!moduleDoc.quiz || !moduleDoc.quiz.questions || !moduleDoc.quiz.questions.length) {
    return next(new ErrorResponse('Quiz not available for this module', 404));
  }

  const questionCount = moduleDoc.quiz.questions.length;
  const normalizedAnswers = Array.isArray(answers) ? answers : [];
  const correctCount = moduleDoc.quiz.questions.reduce((sum, question, index) => {
    const answerIndex = Number(normalizedAnswers[index]);
    if (!Number.isFinite(answerIndex)) return sum;
    return sum + (answerIndex === question.correctIndex ? 1 : 0);
  }, 0);

  const score = questionCount ? Math.round((correctCount / questionCount) * 100) : 0;
  const passingScore = Number.isFinite(moduleDoc.quiz.passingScore)
    ? moduleDoc.quiz.passingScore
    : 70;
  const passed = score >= passingScore;

  const existing = (enrollment.completedQuizzes || []).find(
    (entry) => entry.moduleId.toString() === moduleId
  );

  if (existing) {
    existing.score = score;
    existing.passed = passed;
    existing.completedAt = new Date();
  } else {
    enrollment.completedQuizzes.push({
      moduleId,
      score,
      passed,
      completedAt: new Date(),
    });
  }

  enrollment.percentComplete = calculatePercent(course, enrollment);
  if (enrollment.percentComplete >= 100) {
    enrollment.completionStatus = 'completed';
    enrollment.completedAt = new Date();
  } else if (enrollment.percentComplete > 0) {
    enrollment.completionStatus = 'in_progress';
  }

  await enrollment.save();
  await maybeIssueCertificate(course, enrollment, req.user);

  res.status(200).json({
    success: true,
    data: enrollment,
    meta: {
      score,
      passed,
      passingScore,
    },
  });
});

exports.getPendingEnrollments = asyncHandler(async (req, res, next) => {
  const enrollments = await Enrollment.find({ approvalStatus: 'pending' })
    .populate({ path: 'student', select: 'name email status' })
    .populate({ path: 'course', select: 'title category teacher' });

  res.status(200).json({ success: true, count: enrollments.length, data: enrollments });
});

exports.reviewEnrollment = asyncHandler(async (req, res, next) => {
  const { status, rejectionReason } = req.body;

  if (!['approved', 'rejected'].includes(status)) {
    return next(new ErrorResponse('Invalid enrollment status', 400));
  }

  const enrollment = await Enrollment.findById(req.params.id);
  if (!enrollment) {
    return next(new ErrorResponse('Enrollment not found', 404));
  }

  const wasApproved = enrollment.approvalStatus === 'approved';
  const wasRejected = enrollment.approvalStatus === 'rejected';
  const hadRating = Number.isFinite(enrollment.rating);
  enrollment.approvalStatus = status;
  enrollment.reviewedBy = req.user.id;
  enrollment.reviewedAt = new Date();

  if (status === 'rejected') {
    enrollment.rejectionReason = rejectionReason || 'Enrollment request rejected';
    enrollment.completedLessons = [];
    enrollment.percentComplete = 0;
    enrollment.completionStatus = 'not_started';
    enrollment.rating = undefined;
    enrollment.review = undefined;
    enrollment.ratedAt = undefined;
  } else {
    enrollment.rejectionReason = undefined;
    enrollment.completionStatus = 'not_started';
  }

  await enrollment.save();

  if (status === 'approved' && !wasApproved) {
    const course = await Course.findById(enrollment.course);
    if (course) {
      course.totalEnrollments = (course.totalEnrollments || 0) + 1;
      await course.save({ validateBeforeSave: false });
    }
  }
  if (status === 'rejected' && hadRating) {
    await Course.getAverageRating(enrollment.course);
  }

  const [student, course] = await Promise.all([
    User.findById(enrollment.student).select('name email preferences'),
    Course.findById(enrollment.course).select('title teacher'),
  ]);
  const teacher = course ? await User.findById(course.teacher).select('name email preferences') : null;

  if (status === 'approved' && !wasApproved) {
    await createNotificationForUser(
      student,
      {
        type: 'enrollment_approved',
        title: 'Enrollment approved',
        message: `You can now access "${course?.title || 'this course'}".`,
        link: '/student/courses',
        meta: { courseId: course?._id, enrollmentId: enrollment._id },
      },
      { preferenceKey: 'enrollmentUpdates', sendEmail: true }
    );

    await createNotificationForUser(
      teacher,
      {
        type: 'enrollment_approved',
        title: 'Student approved',
        message: `${student?.name || 'A student'} was approved for "${course?.title || 'your course'}".`,
        link: `/teacher/courses/${course?._id}`,
        meta: { courseId: course?._id, enrollmentId: enrollment._id },
      },
      { preferenceKey: 'enrollmentUpdates', sendEmail: true }
    );
  } else if (status === 'rejected' && !wasRejected) {
    await createNotificationForUser(
      student,
      {
        type: 'enrollment_rejected',
        title: 'Enrollment rejected',
        message: rejectionReason || 'Your enrollment request was not approved.',
        link: '/student/courses',
        meta: { courseId: course?._id, enrollmentId: enrollment._id },
      },
      { preferenceKey: 'enrollmentUpdates', sendEmail: true }
    );
  }

  res.status(200).json({ success: true, data: enrollment });
});

exports.rateEnrollment = asyncHandler(async (req, res, next) => {
  const { rating, review } = req.body;
  const score = Number(rating);

  if (!Number.isFinite(score) || score < 1 || score > 5) {
    return next(new ErrorResponse('Rating must be a number between 1 and 5', 400));
  }

  const enrollment = await Enrollment.findById(req.params.id);
  if (!enrollment) {
    return next(new ErrorResponse('Enrollment not found', 404));
  }

  if (enrollment.student.toString() !== req.user.id) {
    return next(new ErrorResponse('Not authorized to rate this enrollment', 403));
  }

  if (enrollment.approvalStatus && enrollment.approvalStatus !== 'approved') {
    return next(new ErrorResponse('Enrollment is not approved yet', 403));
  }

  enrollment.rating = score;
  enrollment.review = typeof review === 'string' && review.trim() ? review.trim() : undefined;
  enrollment.ratedAt = new Date();
  await enrollment.save();

  await Course.getAverageRating(enrollment.course);

  res.status(200).json({ success: true, data: enrollment });
});
