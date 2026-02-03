const Enrollment = require('../models/Enrollment');
const User = require('../models/User');
const Course = require('../models/Course');
const Certificate = require('../models/Certificate');
const asyncHandler = require('../middleware/async');

const DAY_MS = 24 * 60 * 60 * 1000;

const startOfDay = (value) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

const endOfDay = (value) => {
  const date = new Date(value);
  date.setHours(23, 59, 59, 999);
  return date;
};

const parseRange = (query) => {
  const now = new Date();
  const rangeValue = typeof query.range === 'string' ? query.range : '';
  const parsedStart = query.start ? new Date(query.start) : null;
  const parsedEnd = query.end ? new Date(query.end) : null;

  const end = parsedEnd && !Number.isNaN(parsedEnd.getTime()) ? endOfDay(parsedEnd) : now;

  if (parsedStart && !Number.isNaN(parsedStart.getTime())) {
    return { start: startOfDay(parsedStart), end, label: 'custom' };
  }

  const days = Number.parseInt(rangeValue.replace(/[^\d]/g, ''), 10);
  const safeDays = Number.isFinite(days) && days > 0 ? days : 30;
  const start = startOfDay(new Date(end.getTime() - (safeDays - 1) * DAY_MS));
  return { start, end, label: `${safeDays}d` };
};

const getDateKey = (date) => date.toISOString().slice(0, 10);

const buildBuckets = (start, end) => {
  const buckets = [];
  for (let cursor = new Date(start); cursor <= end; cursor = new Date(cursor.getTime() + DAY_MS)) {
    buckets.push(getDateKey(cursor));
  }
  return buckets;
};

const buildSeries = (buckets, rows, valueKey) => {
  const byDate = new Map(rows.map((row) => [row._id, Number(row[valueKey] || 0)]));
  return buckets.map((date) => ({
    date,
    value: byDate.get(date) || 0,
  }));
};

const percentChange = (current, previous) => {
  if (!previous) return current ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

const getSnapshot = async (start, end) => {
  const [
    totalUsers,
    totalCourses,
    activeCourses,
    newUsers,
    newEnrollments,
    pendingEnrollments,
    completedCourses,
    activeLearnerIds,
    revenueAgg,
  ] = await Promise.all([
    User.countDocuments(),
    Course.countDocuments(),
    Course.countDocuments({ isPublished: true, isApproved: true }),
    User.countDocuments({ createdAt: { $gte: start, $lte: end } }),
    Enrollment.countDocuments({
      enrolledAt: { $gte: start, $lte: end },
      approvalStatus: 'approved',
    }),
    Enrollment.countDocuments({
      enrolledAt: { $gte: start, $lte: end },
      approvalStatus: 'pending',
    }),
    Enrollment.countDocuments({
      completedAt: { $gte: start, $lte: end },
      completionStatus: 'completed',
    }),
    Enrollment.distinct('student', {
      $and: [
        {
          $or: [
            { enrolledAt: { $gte: start, $lte: end } },
            { completedAt: { $gte: start, $lte: end } },
          ],
        },
        {
          $or: [
            { approvalStatus: { $exists: false } },
            { approvalStatus: 'approved' },
          ],
        },
      ],
    }),
    Enrollment.aggregate([
      {
        $match: {
          enrolledAt: { $gte: start, $lte: end },
          approvalStatus: 'approved',
        },
      },
      {
        $lookup: {
          from: 'courses',
          localField: 'course',
          foreignField: '_id',
          as: 'course',
        },
      },
      { $unwind: '$course' },
      {
        $group: {
          _id: null,
          revenue: { $sum: { $ifNull: ['$course.price', 0] } },
        },
      },
    ]),
  ]);

  return {
    totalUsers,
    totalCourses,
    activeCourses,
    newUsers,
    newEnrollments,
    pendingEnrollments,
    completedCourses,
    activeLearners: activeLearnerIds.length,
    revenue: revenueAgg[0]?.revenue || 0,
  };
};

exports.getAdminAnalytics = asyncHandler(async (req, res, next) => {
  const { start, end, label } = parseRange(req.query);
  const buckets = buildBuckets(start, end);

  const periodMs = end.getTime() - start.getTime();
  const prevEnd = new Date(start.getTime() - 1);
  const prevStart = new Date(prevEnd.getTime() - periodMs);

  const [
    currentSnapshot,
    previousSnapshot,
    userGrowthRows,
    enrollmentRows,
    revenueRows,
    topCoursesRows,
    recentEnrollments,
    recentCompletions,
    recentCertificates,
    recentUsers,
    recentCourses,
  ] = await Promise.all([
    getSnapshot(start, end),
    getSnapshot(prevStart, prevEnd),
    User.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'UTC' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Enrollment.aggregate([
      {
        $match: {
          enrolledAt: { $gte: start, $lte: end },
          approvalStatus: 'approved',
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$enrolledAt', timezone: 'UTC' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Enrollment.aggregate([
      {
        $match: {
          enrolledAt: { $gte: start, $lte: end },
          approvalStatus: 'approved',
        },
      },
      {
        $lookup: {
          from: 'courses',
          localField: 'course',
          foreignField: '_id',
          as: 'course',
        },
      },
      { $unwind: '$course' },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$enrolledAt', timezone: 'UTC' },
          },
          revenue: { $sum: { $ifNull: ['$course.price', 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Enrollment.aggregate([
      {
        $match: {
          enrolledAt: { $gte: start, $lte: end },
          approvalStatus: 'approved',
        },
      },
      {
        $group: {
          _id: '$course',
          enrollments: { $sum: 1 },
        },
      },
      { $sort: { enrollments: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'courses',
          localField: '_id',
          foreignField: '_id',
          as: 'course',
        },
      },
      { $unwind: '$course' },
      {
        $project: {
          _id: 1,
          title: '$course.title',
          category: '$course.category',
          price: '$course.price',
          enrollments: 1,
        },
      },
    ]),
    Enrollment.find({ enrolledAt: { $gte: start, $lte: end } })
      .populate({ path: 'course', select: 'title' })
      .sort({ enrolledAt: -1 })
      .limit(10),
    Enrollment.find({ completedAt: { $gte: start, $lte: end } })
      .populate({ path: 'course', select: 'title' })
      .sort({ completedAt: -1 })
      .limit(10),
    Certificate.find({ issuedAt: { $gte: start, $lte: end } })
      .select('courseTitle issuedAt')
      .sort({ issuedAt: -1 })
      .limit(10),
    User.find({ createdAt: { $gte: start, $lte: end } })
      .select('name role createdAt')
      .sort({ createdAt: -1 })
      .limit(10),
    Course.find({ createdAt: { $gte: start, $lte: end } })
      .select('title createdAt')
      .sort({ createdAt: -1 })
      .limit(10),
  ]);

  const recentActivity = [
    ...recentEnrollments.map((enrollment) => ({
      id: enrollment._id.toString(),
      type: 'enrollment',
      title: 'New enrollment',
      description: enrollment.course?.title || 'Course enrollment',
      createdAt: enrollment.enrolledAt?.toISOString(),
    })),
    ...recentCompletions.map((enrollment) => ({
      id: `${enrollment._id.toString()}-completed`,
      type: 'completion',
      title: 'Course completed',
      description: enrollment.course?.title || 'Course completion',
      createdAt: enrollment.completedAt?.toISOString(),
    })),
    ...recentCertificates.map((cert) => ({
      id: cert._id.toString(),
      type: 'certificate',
      title: 'Certificate issued',
      description: cert.courseTitle || 'Certificate issued',
      createdAt: cert.issuedAt?.toISOString(),
    })),
    ...recentUsers.map((user) => ({
      id: user._id.toString(),
      type: 'user',
      title: 'New user',
      description: `${user.name} joined as ${user.role}`,
      createdAt: user.createdAt?.toISOString(),
    })),
    ...recentCourses.map((course) => ({
      id: course._id.toString(),
      type: 'course',
      title: 'Course created',
      description: course.title,
      createdAt: course.createdAt?.toISOString(),
    })),
  ]
    .filter((activity) => activity.createdAt)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 12);

  res.status(200).json({
    success: true,
    data: {
      range: {
        start: start.toISOString(),
        end: end.toISOString(),
        label,
        days: buckets.length,
      },
      summary: currentSnapshot,
      deltas: {
        activeLearners: percentChange(currentSnapshot.activeLearners, previousSnapshot.activeLearners),
        newUsers: percentChange(currentSnapshot.newUsers, previousSnapshot.newUsers),
        newEnrollments: percentChange(currentSnapshot.newEnrollments, previousSnapshot.newEnrollments),
        revenue: percentChange(currentSnapshot.revenue, previousSnapshot.revenue),
      },
      series: {
        userGrowth: buildSeries(buckets, userGrowthRows, 'count'),
        enrollments: buildSeries(buckets, enrollmentRows, 'count'),
        revenue: buildSeries(buckets, revenueRows, 'revenue'),
      },
      topCourses: topCoursesRows.map((course) => ({
        id: course._id.toString(),
        title: course.title,
        category: course.category,
        enrollments: course.enrollments || 0,
        revenue: Number(course.price || 0) * (course.enrollments || 0),
      })),
      recentActivity,
    },
  });
});
