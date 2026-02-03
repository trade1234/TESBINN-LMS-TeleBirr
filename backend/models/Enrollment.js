const mongoose = require('mongoose');

const EnrollmentSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
    },
    course: {
      type: mongoose.Schema.ObjectId,
      ref: 'Course',
      required: true,
    },
    completedLessons: [
      {
        moduleId: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
        },
        lessonId: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
        },
        completedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    completedQuizzes: [
      {
        moduleId: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
        },
        score: {
          type: Number,
          min: 0,
          max: 100,
          default: 0,
        },
        passed: {
          type: Boolean,
          default: false,
        },
        completedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    percentComplete: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    completionStatus: {
      type: String,
      enum: ['not_started', 'in_progress', 'completed'],
      default: 'not_started',
    },
    approvalStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    reviewedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
    reviewedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
    merchOrderId: {
      type: String,
      trim: true,
    },
    paymentOrderId: {
      type: String,
      trim: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending',
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    review: {
      type: String,
      trim: true,
      maxlength: [1000, 'Review cannot be more than 1000 characters'],
    },
    ratedAt: {
      type: Date,
    },
    enrolledAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

EnrollmentSchema.index({ student: 1, course: 1 }, { unique: true });

module.exports = mongoose.model('Enrollment', EnrollmentSchema);
