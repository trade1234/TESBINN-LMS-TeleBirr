const mongoose = require('mongoose');

const LessonSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a lesson title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please add a description']
  },
  lessonType: {
    type: String,
    required: [true, 'Please specify lesson type'],
    enum: ['video', 'pdf', 'text', 'image']
  },
  content: {
    type: String,
    required: [
      function() { return this.lessonType === 'text'; },
      'Content is required for text lessons'
    ]
  },
  videoUrl: {
    type: String,
    required: [
      function() { return this.lessonType === 'video'; },
      'Video URL is required for video lessons'
    ]
  },
  duration: {
    type: Number, // Duration in minutes
    required: [
      function() { return this.lessonType === 'video'; },
      'Duration is required for video lessons'
    ]
  },
  documentUrl: {
    type: String,
    required: [
      function() { return this.lessonType === 'pdf'; },
      'Document URL is required for PDF lessons'
    ]
  },
  imageUrl: {
    type: String,
    required: [
      function() { return this.lessonType === 'image'; },
      'Image URL is required for image lessons'
    ]
  },
  order: {
    type: Number,
    required: true
  },
  isFree: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const QuizQuestionSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: [true, 'Please add a quiz question'],
      trim: true,
      maxlength: [300, 'Question cannot be more than 300 characters'],
    },
    options: {
      type: [String],
      validate: {
        validator: (value) => Array.isArray(value) && value.length >= 2,
        message: 'Quiz options must include at least two choices',
      },
    },
    correctIndex: {
      type: Number,
      required: [true, 'Please set the correct answer index'],
      min: [0, 'Correct answer index must be zero or greater'],
    },
  },
  { _id: true }
);

const QuizSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      maxlength: [120, 'Quiz title cannot be more than 120 characters'],
      default: 'Module Quiz',
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Quiz description cannot be more than 500 characters'],
    },
    passingScore: {
      type: Number,
      min: [0, 'Passing score must be between 0 and 100'],
      max: [100, 'Passing score must be between 0 and 100'],
      default: 70,
    },
    questions: [QuizQuestionSchema],
  },
  { _id: false }
);

const ModuleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a module title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: String,
  lessons: [LessonSchema],
  quiz: {
    type: QuizSchema,
    default: null,
  },
  order: {
    type: Number,
    required: true
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const CourseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a course title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  slug: String,
  description: {
    type: String,
    required: [true, 'Please add a description'],
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  summary: {
    type: String,
    maxlength: [1000, 'Summary cannot be more than 1000 characters']
  },
  price: {
    type: Number,
    required: [true, 'Please add a price'],
    min: [0, 'Price cannot be negative']
  },
  duration: {
    // Total duration in minutes
    type: Number,
    default: 0
  },
  level: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  category: {
    type: String,
    required: [true, 'Please add a category'],
    enum: [
      'development',
      'design',
      'marketing',
      'leadership',
      'ai',
      'business',
      'productivity',
      'other'
    ]
  },
  imageUrl: {
    type: String,
    default: 'default-course.jpg'
  },
  previewVideo: String,
  certificateTemplate: {
    enabled: {
      type: Boolean,
      default: true
    },
    title: {
      type: String,
      default: 'Certificate of Completion',
      trim: true
    },
    subtitle: {
      type: String,
      default: 'This certifies that',
      trim: true
    },
    logoUrl: {
      type: String
    },
    backgroundUrl: {
      type: String
    },
    signatureName: {
      type: String,
      default: 'TESBINN Learning'
    },
    signatureTitle: {
      type: String,
      default: 'Program Director'
    }
  },
  modules: [ModuleSchema],
  teacher: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  rejectionReason: {
    type: String,
    default: null
  },
  requirements: [String],
  learningOutcomes: [String],
  tags: [String],
  averageRating: {
    type: Number,
    min: [0, 'Rating must be at least 0'],
    max: [5, 'Rating cannot be more than 5']
  },
  numberOfReviews: {
    type: Number,
    default: 0
  },
  totalEnrollments: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Calculate total duration before saving
CourseSchema.pre('save', function(next) {
  if (this.isModified('modules')) {
    this.duration = this.modules.reduce((total, module) => {
      return total + module.lessons.reduce((sum, lesson) => {
        return sum + (lesson.duration || 0);
      }, 0);
    }, 0);
  }
  next();
});

// Create course slug from the title
CourseSchema.pre('save', function(next) {
  this.slug = this.title
    .toLowerCase()
    .replace(/[^a-zA-Z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
  next();
});

// Cascade delete enrollments when a course is deleted
CourseSchema.pre('remove', async function(next) {
  await this.model('Enrollment').deleteMany({ course: this._id });
  next();
});

// Reverse populate with virtuals
CourseSchema.virtual('enrollments', {
  ref: 'Enrollment',
  localField: '_id',
  foreignField: 'course',
  justOne: false
});

CourseSchema.virtual('revenue').get(function() {
  const price = Number(this.price || 0);
  const enrollments = Number(this.totalEnrollments || 0);
  if (!Number.isFinite(price) || !Number.isFinite(enrollments)) {
    return 0;
  }
  return price * enrollments;
});

// Static method to get average course rating
CourseSchema.statics.getAverageRating = async function(courseId) {
  const courseObjectId = mongoose.Types.ObjectId.isValid(courseId)
    ? new mongoose.Types.ObjectId(courseId)
    : courseId;
  const obj = await this.model('Enrollment').aggregate([
    {
      $match: {
        course: courseObjectId,
        approvalStatus: 'approved',
        rating: { $ne: null },
      }
    },
    {
      $group: {
        _id: '$course',
        averageRating: { $avg: '$rating' },
        numberOfReviews: { $sum: 1 }
      }
    }
  ]);

  try {
    await this.model('Course').findByIdAndUpdate(courseId, {
      averageRating: obj[0] ? obj[0].averageRating : 0,
      numberOfReviews: obj[0] ? obj[0].numberOfReviews : 0
    });
  } catch (err) {
    console.error(err);
  }
};

module.exports = mongoose.model('Course', CourseSchema);
