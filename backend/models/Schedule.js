const mongoose = require('mongoose');

const ScheduleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a schedule title'],
    trim: true,
    maxlength: [120, 'Title cannot be more than 120 characters'],
  },
  startDate: {
    type: Date,
    required: [true, 'Please add a start date'],
  },
  startTime: {
    type: String,
    trim: true,
    maxlength: [40, 'Start time cannot be more than 40 characters'],
  },
  durationLabel: {
    type: String,
    required: [true, 'Please add a duration'],
    trim: true,
    maxlength: [50, 'Duration cannot be more than 50 characters'],
  },
  instructor: {
    type: String,
    trim: true,
    maxlength: [120, 'Instructor cannot be more than 120 characters'],
  },
  mode: {
    type: String,
    enum: ['online', 'in-person', 'hybrid'],
    default: 'online',
  },
  location: {
    type: String,
    trim: true,
    maxlength: [120, 'Location cannot be more than 120 characters'],
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [300, 'Notes cannot be more than 300 characters'],
  },
  ctaLabel: {
    type: String,
    trim: true,
    maxlength: [60, 'CTA label cannot be more than 60 characters'],
  },
  ctaUrl: {
    type: String,
    trim: true,
    maxlength: [300, 'CTA URL cannot be more than 300 characters'],
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

module.exports = mongoose.model('Schedule', ScheduleSchema);
