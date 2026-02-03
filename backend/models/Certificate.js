const mongoose = require('mongoose');

const CertificateSchema = new mongoose.Schema(
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
    enrollment: {
      type: mongoose.Schema.ObjectId,
      ref: 'Enrollment',
      required: true,
      unique: true,
    },
    recipientName: {
      type: String,
      required: true,
      trim: true,
    },
    courseTitle: {
      type: String,
      required: true,
      trim: true,
    },
    certificateNumber: {
      type: String,
      required: true,
      unique: true,
    },
    templateSnapshot: {
      enabled: Boolean,
      title: String,
      subtitle: String,
      logoUrl: String,
      backgroundUrl: String,
      signatureName: String,
      signatureTitle: String,
    },
    issuedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

CertificateSchema.index({ student: 1, course: 1 });

module.exports = mongoose.model('Certificate', CertificateSchema);
