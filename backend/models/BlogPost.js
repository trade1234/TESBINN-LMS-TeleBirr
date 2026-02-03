const mongoose = require('mongoose');

const BlogPostSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add a title'],
      trim: true,
      maxlength: [180, 'Title cannot exceed 180 characters'],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      index: true,
      lowercase: true,
      trim: true,
    },
    category: {
      type: String,
      trim: true,
      maxlength: [60, 'Category cannot exceed 60 characters'],
    },
    excerpt: {
      type: String,
      trim: true,
      maxlength: [400, 'Excerpt cannot exceed 400 characters'],
    },
    content: {
      type: String,
      trim: true,
    },
    coverImage: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'draft',
    },
    publishedAt: {
      type: Date,
    },
    author: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('BlogPost', BlogPostSchema);
