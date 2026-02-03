const Advert = require('../models/Advert');
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

exports.getAdverts = asyncHandler(async (req, res, next) => {
  const now = new Date();
  const adverts = await Advert.find({
    isActive: true,
    $and: [
      { $or: [{ startsAt: { $exists: false } }, { startsAt: null }, { startsAt: { $lte: now } }] },
      { $or: [{ endsAt: { $exists: false } }, { endsAt: null }, { endsAt: { $gte: now } }] },
    ],
  }).sort({ order: 1, createdAt: -1 });

  res.status(200).json({
    success: true,
    count: adverts.length,
    data: adverts,
  });
});

exports.getAdminAdverts = asyncHandler(async (req, res, next) => {
  const adverts = await Advert.find().sort({ order: 1, createdAt: -1 });

  res.status(200).json({
    success: true,
    count: adverts.length,
    data: adverts,
  });
});

exports.createAdvert = asyncHandler(async (req, res, next) => {
  const {
    title,
    subtitle,
    imageUrl,
    ctaLabel,
    ctaUrl,
    startsAt,
    endsAt,
    order,
    isActive,
  } = req.body || {};

  if (!title || !title.trim()) {
    return next(new ErrorResponse('Advert title is required', 400));
  }

  const parsedOrder = Number.isFinite(Number(order)) ? Number(order) : 0;

  const advert = await Advert.create({
    title: title.trim(),
    subtitle: subtitle?.trim() || '',
    imageUrl: imageUrl?.trim() || '',
    ctaLabel: ctaLabel?.trim() || '',
    ctaUrl: ctaUrl?.trim() || '',
    startsAt: parseDateInput(startsAt),
    endsAt: parseDateInput(endsAt),
    order: parsedOrder,
    isActive: isActive !== undefined ? Boolean(isActive) : true,
  });

  res.status(201).json({
    success: true,
    data: advert,
  });
});

exports.updateAdvert = asyncHandler(async (req, res, next) => {
  const advert = await Advert.findById(req.params.id);
  if (!advert) {
    return next(new ErrorResponse('Advert not found', 404));
  }

  const {
    title,
    subtitle,
    imageUrl,
    ctaLabel,
    ctaUrl,
    startsAt,
    endsAt,
    order,
    isActive,
  } = req.body || {};

  if (title !== undefined) {
    if (!title || !title.trim()) {
      return next(new ErrorResponse('Advert title is required', 400));
    }
    advert.title = title.trim();
  }

  if (subtitle !== undefined) {
    advert.subtitle = subtitle?.trim() || '';
  }

  if (imageUrl !== undefined) {
    advert.imageUrl = imageUrl?.trim() || '';
  }

  if (ctaLabel !== undefined) {
    advert.ctaLabel = ctaLabel?.trim() || '';
  }

  if (ctaUrl !== undefined) {
    advert.ctaUrl = ctaUrl?.trim() || '';
  }

  if (startsAt !== undefined) {
    advert.startsAt = parseDateInput(startsAt);
  }

  if (endsAt !== undefined) {
    advert.endsAt = parseDateInput(endsAt);
  }

  if (order !== undefined) {
    advert.order = Number.isFinite(Number(order)) ? Number(order) : 0;
  }

  if (isActive !== undefined) {
    advert.isActive = Boolean(isActive);
  }

  await advert.save();

  res.status(200).json({
    success: true,
    data: advert,
  });
});

exports.deleteAdvert = asyncHandler(async (req, res, next) => {
  const advert = await Advert.findById(req.params.id);
  if (!advert) {
    return next(new ErrorResponse('Advert not found', 404));
  }

  await advert.remove();

  res.status(200).json({
    success: true,
    data: {},
  });
});
