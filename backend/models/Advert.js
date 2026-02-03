const mongoose = require('mongoose');

const AdvertSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true,
    maxlength: [120, 'Title cannot be more than 120 characters'],
  },
  subtitle: {
    type: String,
    trim: true,
    maxlength: [200, 'Subtitle cannot be more than 200 characters'],
  },
  imageUrl: {
    type: String,
    trim: true,
  },
  ctaLabel: {
    type: String,
    trim: true,
    maxlength: [50, 'CTA label cannot be more than 50 characters'],
  },
  ctaUrl: {
    type: String,
    trim: true,
  },
  startsAt: {
    type: Date,
  },
  endsAt: {
    type: Date,
  },
  order: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Advert', AdvertSchema);
