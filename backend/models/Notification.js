const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        'enrollment_requested',
        'enrollment_pending_review',
        'enrollment_approved',
        'enrollment_rejected',
        'course_submitted',
        'course_approved',
        'course_rejected',
        'announcement',
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
      maxlength: [120, 'Notification title cannot exceed 120 characters'],
    },
    message: {
      type: String,
      required: true,
      maxlength: [1000, 'Notification message cannot exceed 1000 characters'],
    },
    link: {
      type: String,
      trim: true,
    },
    meta: {
      type: mongoose.Schema.Types.Mixed,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

NotificationSchema.index({ user: 1, readAt: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', NotificationSchema);
