const Schedule = require('../models/Schedule');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

const parseDateInput = (value) => {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || value === '') {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
};

exports.getSchedules = asyncHandler(async (req, res, next) => {
  const now = new Date();
  const schedules = await Schedule.find({
    isActive: true,
    startDate: { $gte: now },
  }).sort({ startDate: 1, order: 1, createdAt: -1 });

  res.status(200).json({
    success: true,
    count: schedules.length,
    data: schedules,
  });
});

exports.getAdminSchedules = asyncHandler(async (req, res, next) => {
  const schedules = await Schedule.find().sort({ startDate: 1, order: 1, createdAt: -1 });

  res.status(200).json({
    success: true,
    count: schedules.length,
    data: schedules,
  });
});

exports.createSchedule = asyncHandler(async (req, res, next) => {
  const {
    title,
    startDate,
    startTime,
    durationLabel,
    instructor,
    mode,
    location,
    notes,
    ctaLabel,
    ctaUrl,
    order,
    isActive,
  } = req.body || {};

  if (!title || !title.trim()) {
    return next(new ErrorResponse('Schedule title is required', 400));
  }

  const parsedStartDate = parseDateInput(startDate);
  if (!parsedStartDate) {
    return next(new ErrorResponse('Valid start date is required', 400));
  }

  if (!durationLabel || !durationLabel.trim()) {
    return next(new ErrorResponse('Duration is required', 400));
  }

  const schedule = await Schedule.create({
    title: title.trim(),
    startDate: parsedStartDate,
    startTime: startTime?.trim() || '',
    durationLabel: durationLabel.trim(),
    instructor: instructor?.trim() || '',
    mode: mode || 'online',
    location: location?.trim() || '',
    notes: notes?.trim() || '',
    ctaLabel: ctaLabel?.trim() || '',
    ctaUrl: ctaUrl?.trim() || '',
    order: Number.isFinite(Number(order)) ? Number(order) : 0,
    isActive: isActive !== undefined ? Boolean(isActive) : true,
  });

  res.status(201).json({
    success: true,
    data: schedule,
  });
});

exports.updateSchedule = asyncHandler(async (req, res, next) => {
  const schedule = await Schedule.findById(req.params.id);
  if (!schedule) {
    return next(new ErrorResponse('Schedule not found', 404));
  }

  const {
    title,
    startDate,
    startTime,
    durationLabel,
    instructor,
    mode,
    location,
    notes,
    ctaLabel,
    ctaUrl,
    order,
    isActive,
  } = req.body || {};

  if (title !== undefined) {
    if (!title || !title.trim()) {
      return next(new ErrorResponse('Schedule title is required', 400));
    }
    schedule.title = title.trim();
  }

  if (startDate !== undefined) {
    const parsedStartDate = parseDateInput(startDate);
    if (!parsedStartDate) {
      return next(new ErrorResponse('Valid start date is required', 400));
    }
    schedule.startDate = parsedStartDate;
  }

  if (startTime !== undefined) {
    schedule.startTime = startTime?.trim() || '';
  }

  if (durationLabel !== undefined) {
    if (!durationLabel || !durationLabel.trim()) {
      return next(new ErrorResponse('Duration is required', 400));
    }
    schedule.durationLabel = durationLabel.trim();
  }

  if (instructor !== undefined) {
    schedule.instructor = instructor?.trim() || '';
  }

  if (mode !== undefined) {
    schedule.mode = mode;
  }

  if (location !== undefined) {
    schedule.location = location?.trim() || '';
  }

  if (notes !== undefined) {
    schedule.notes = notes?.trim() || '';
  }

  if (ctaLabel !== undefined) {
    schedule.ctaLabel = ctaLabel?.trim() || '';
  }

  if (ctaUrl !== undefined) {
    schedule.ctaUrl = ctaUrl?.trim() || '';
  }

  if (order !== undefined) {
    schedule.order = Number.isFinite(Number(order)) ? Number(order) : 0;
  }

  if (isActive !== undefined) {
    schedule.isActive = Boolean(isActive);
  }

  await schedule.save();

  res.status(200).json({
    success: true,
    data: schedule,
  });
});

exports.deleteSchedule = asyncHandler(async (req, res, next) => {
  const schedule = await Schedule.findById(req.params.id);
  if (!schedule) {
    return next(new ErrorResponse('Schedule not found', 404));
  }

  await schedule.remove();

  res.status(200).json({
    success: true,
    data: {},
  });
});
