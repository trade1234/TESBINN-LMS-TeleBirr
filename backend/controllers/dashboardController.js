const Enrollment = require('../models/Enrollment');
const Certificate = require('../models/Certificate');
const asyncHandler = require('../middleware/async');

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const getStartOfWeek = (date) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const day = start.getDay();
  const diff = (day + 6) % 7;
  start.setDate(start.getDate() - diff);
  return start;
};

const buildCourseLessonIndex = (course) => {
  const lessons = new Map();
  let totalLessons = 0;

  (course.modules || []).forEach((module) => {
    (module.lessons || []).forEach((lesson) => {
      if (!lesson?._id) return;
      totalLessons += 1;
      lessons.set(lesson._id.toString(), {
        title: lesson.title || 'Lesson',
        duration: Number.isFinite(lesson.duration) ? lesson.duration : null,
      });
    });
  });

  const fallbackDuration =
    totalLessons > 0 && Number.isFinite(course.duration)
      ? course.duration / totalLessons
      : 0;

  return { lessons, fallbackDuration };
};

exports.getStudentDashboard = asyncHandler(async (req, res, next) => {
  const now = new Date();
  const startOfWeek = getStartOfWeek(now);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 7);

  const enrollments = await Enrollment.find({
    student: req.user.id,
    $or: [{ approvalStatus: { $exists: false } }, { approvalStatus: 'approved' }],
  }).populate({
    path: 'course',
    select: 'title duration modules',
  });

  const weeklyProgress = DAY_LABELS.map((label, index) => {
    const date = new Date(startOfWeek);
    date.setDate(date.getDate() + index);
    return { name: label, lessons: 0, hours: 0, date: date.toISOString() };
  });

  const activities = [];

  enrollments.forEach((enrollment) => {
    const course = enrollment.course;
    if (!course) return;

    const { lessons: lessonIndex, fallbackDuration } = buildCourseLessonIndex(course);

    (enrollment.completedLessons || []).forEach((entry, index) => {
      const completedAt = entry.completedAt ? new Date(entry.completedAt) : null;
      const lessonId = entry.lessonId
        ? entry.lessonId.toString()
        : entry._id
          ? entry._id.toString()
          : `lesson-${index}`;
      const lessonInfo = entry.lessonId ? lessonIndex.get(entry.lessonId.toString()) : null;
      const lessonTitle = lessonInfo?.title || 'Lesson';
      const lessonDuration =
        lessonInfo?.duration ?? (Number.isFinite(fallbackDuration) ? fallbackDuration : 0);

      if (completedAt && completedAt >= startOfWeek && completedAt < endOfWeek) {
        const dayIndex = Math.floor((completedAt - startOfWeek) / (1000 * 60 * 60 * 24));
        if (weeklyProgress[dayIndex]) {
          weeklyProgress[dayIndex].lessons += 1;
          weeklyProgress[dayIndex].hours += lessonDuration / 60;
        }
      }

      if (completedAt) {
        activities.push({
          id: `${enrollment._id.toString()}-${lessonId}`,
          type: 'lesson',
          title: 'Lesson completed',
          description: `${lessonTitle} - ${course.title}`,
          createdAt: completedAt.toISOString(),
        });
      }
    });

    if (enrollment.enrolledAt) {
      activities.push({
        id: `${enrollment._id.toString()}-enrolled`,
        type: 'enrolled',
        title: 'New enrollment',
        description: course.title,
        createdAt: new Date(enrollment.enrolledAt).toISOString(),
      });
    }

    if (enrollment.completedAt) {
      activities.push({
        id: `${enrollment._id.toString()}-completed`,
        type: 'completed',
        title: 'Course completed',
        description: course.title,
        createdAt: new Date(enrollment.completedAt).toISOString(),
      });
    }
  });

  const certificates = await Certificate.find({ student: req.user.id })
    .select('courseTitle issuedAt')
    .sort({ issuedAt: -1 })
    .limit(20);

  certificates.forEach((cert) => {
    if (!cert.issuedAt) return;
    activities.push({
      id: cert._id.toString(),
      type: 'achievement',
      title: 'Certificate issued',
      description: cert.courseTitle || 'Certificate earned',
      createdAt: new Date(cert.issuedAt).toISOString(),
    });
  });

  activities.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const recentActivity = activities.slice(0, 10);

  const lessonsCompletedThisWeek = weeklyProgress.reduce((sum, day) => sum + day.lessons, 0);
  const activityThisWeek = activities.filter((activity) => {
    const createdAt = activity.createdAt ? new Date(activity.createdAt) : null;
    return createdAt && createdAt >= startOfWeek && createdAt < endOfWeek;
  }).length;

  res.status(200).json({
    success: true,
    data: {
      stats: {
        lessonsCompletedThisWeek,
        activityThisWeek,
      },
      weeklyProgress,
      recentActivity,
    },
  });
});
