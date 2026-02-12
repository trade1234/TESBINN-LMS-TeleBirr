const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  role: {
    type: String,
    enum: ['student', 'teacher', 'admin'],
    default: 'student'
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'suspended', 'blocked'],
    default: 'pending'
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false
  },
  tokenVersion: {
    type: Number,
    default: 0
  },
  loginAttempts: {
    type: Number,
    default: 0,
    select: false
  },
  lockoutCount: {
    type: Number,
    default: 0,
    select: false
  },
  lockUntil: {
    type: Date,
    select: false
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  profileImage: {
    type: String,
    default: 'default.jpg'
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot be more than 500 characters']
  },
  phone: {
    type: String,
    trim: true,
    maxlength: [25, 'Phone cannot be more than 25 characters']
  },
  location: {
    type: String,
    trim: true,
    maxlength: [120, 'Location cannot be more than 120 characters']
  },
  professional: {
    headline: {
      type: String,
      trim: true,
      maxlength: [120, 'Headline cannot be more than 120 characters']
    },
    currentRole: {
      type: String,
      trim: true,
      maxlength: [120, 'Role cannot be more than 120 characters']
    },
    company: {
      type: String,
      trim: true,
      maxlength: [120, 'Company cannot be more than 120 characters']
    },
    careerFocus: {
      type: String,
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
    experienceLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced']
    },
    portfolioUrl: {
      type: String,
      trim: true,
      maxlength: [200, 'Portfolio URL cannot be more than 200 characters']
    },
    careerGoals: {
      type: String,
      trim: true,
      maxlength: [500, 'Career goals cannot be more than 500 characters']
    },
    skills: [{
      type: String,
      trim: true,
      maxlength: [40, 'Skill cannot be more than 40 characters']
    }],
    openToOpportunities: {
      type: Boolean,
      default: false
    },
    availableForMentorship: {
      type: Boolean,
      default: false
    }
  },
  preferences: {
    notifications: {
      courseReminders: {
        type: Boolean,
        default: true
      },
      mentorMessages: {
        type: Boolean,
        default: true
      },
      productUpdates: {
        type: Boolean,
        default: false
      },
      enrollmentUpdates: {
        type: Boolean,
        default: true
      },
      courseUpdates: {
        type: Boolean,
        default: true
      },
      adminAnnouncements: {
        type: Boolean,
        default: true
      }
    },
    learning: {
      weeklyStudyGoalHours: {
        type: Number,
        min: [0, 'Study goal cannot be negative'],
        max: [40, 'Study goal cannot exceed 40 hours'],
        default: 5
      },
      personalizedSuggestions: {
        type: Boolean,
        default: true
      },
      weeklyProgressReport: {
        type: Boolean,
        default: true
      }
    }
  },
  security: {
    mfaEnabled: {
      type: Boolean,
      default: false
    },
    newDeviceAlerts: {
      type: Boolean,
      default: true
    }
  },
  lastLogin: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Encrypt password using bcrypt
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Sign JWT and return
UserSchema.methods.getSignedJwtToken = function(expiresInOverride) {
  return jwt.sign(
    { id: this._id, role: this.role, tokenVersion: this.tokenVersion || 0 },
    process.env.JWT_SECRET,
    { expiresIn: expiresInOverride || process.env.JWT_EXPIRE || '1h' }
  );
};

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate and hash password token
UserSchema.methods.getResetPasswordToken = function() {
  // Generate token
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Hash token and set to resetPasswordToken field
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set expire
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

  return resetToken;
};

// Reverse populate with virtuals
UserSchema.virtual('courses', {
  ref: 'Course',
  localField: '_id',
  foreignField: 'teacher',
  justOne: false
});

module.exports = mongoose.model('User', UserSchema);
