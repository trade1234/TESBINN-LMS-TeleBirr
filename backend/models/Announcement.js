const mongoose = require('mongoose');

const AnnouncementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      maxlength: [140, 'Announcement title cannot exceed 140 characters'],
    },
    message: {
      type: String,
      required: true,
      maxlength: [2000, 'Announcement message cannot exceed 2000 characters'],
    },
    audience: {
      type: String,
      enum: ['all', 'students', 'teachers', 'admins'],
      default: 'all',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

AnnouncementSchema.index({ createdAt: -1 });
AnnouncementSchema.index({ expiresAt: 1 });

module.exports = mongoose.model('Announcement', AnnouncementSchema);
