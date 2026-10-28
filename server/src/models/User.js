
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      unique: true,
      index: true,
      trim: true
    },

    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true
    },

    mobile: {
      type: String,
      required: [true, 'Mobile number is required'],
      unique: true,
      index: true,
      trim: true
    },

    email: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
      lowercase: true,
      trim: true
    },

    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false
    },

    role: {
      type: String,
      enum: ['STUDENT', 'TEACHER', 'ADMIN', 'EXECUTIVE'],
      default: 'STUDENT',
      index: true
    },
    
    lastLoginAt: { type: Date },

    selectedState: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'State'
    },

    stateCode: {
      type: String,
      default: 'KA',
      index: true
    },

    learningPreference: {
      stateCode: { type: String, default: 'GLOBAL' },
      categoryCode: { type: String, default: '' },
      subCategory: { type: String, default: '' },
      subCategoryTitle: { type: String, default: '' },
      stream: { type: String, default: '' },
      boardOrGrade: { type: String, default: '' },
      subjectName: { type: String, default: 'All Subjects' },
      isPreferenceSet: { type: Boolean, default: false }
    },

    kycStatus: {
      type: String,
      enum: ['NOT_SUBMITTED', 'PENDING', 'VERIFIED', 'REJECTED'],
      default: 'NOT_SUBMITTED',
      index: true
    },

    payoutProfile: {
      preferredMethod: {
        type: String,
        enum: ['BANK', 'UPI'],
        default: 'BANK'
      },

      bankAccount: {
        accountHolderName: {
          type: String,
          trim: true,
          default: ''
        },
        accountNumber: {
          type: String,
          trim: true,
          default: ''
        },
        ifscCode: {
          type: String,
          uppercase: true,
          trim: true,
          default: ''
        },
        bankName: {
          type: String,
          trim: true,
          default: ''
        }
      },

      upi: {
        upiId: {
          type: String,
          lowercase: true,
          trim: true,
          default: ''
        },
        accountHolderName: {
          type: String,
          trim: true,
          default: ''
        }
      },

      isConfigured: {
        type: Boolean,
        default: false
      }
    },

    isMobileVerified: {
      type: Boolean,
      default: false
    },

    isEmailVerified: {
      type: Boolean,
      default: false
    },

    isBlocked: {
      type: Boolean,
      default: false,
      index: true
    },

    status: {
      type: String,
      enum: ['ACTIVE', 'BLOCKED'],
      default: 'ACTIVE',
      index: true
    },

    otp: {
      type: String,
      select: false
    },

    otpExpires: {
      type: Date,
      select: false
    },

    emailOtp: {
      type: String,
      select: false
    },

    emailOtpExpires: {
      type: Date,
      select: false
    },

    referralCode: {
      type: String,
      unique: true,
      index: true
    },

    referredBy: {
      type: String,
      trim: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Pre-save hook: generate IDs and hash passwords.
userSchema.pre('save', async function (next) {
  try {
    if (!this.userId) {
      const randomNum = Math.floor(10000 + Math.random() * 90000);
      this.userId = `EDU-${randomNum}`;
    }

    if (!this.referralCode) {
      const randomRef = Math.random()
        .toString(36)
        .substring(2, 7)
        .toUpperCase();

      this.referralCode = `REF-${randomRef}`;
    }

    if (!this.isModified('password')) {
      return next();
    }

    this.password = await bcrypt.hash(this.password, 12);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare candidate password.
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return bcrypt.compare(candidatePassword, userPassword);
};

// Generate a 6-digit SMS OTP with 10-minute expiry.
userSchema.methods.createOTP = function () {
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

  this.otp = otpCode;
  this.otpExpires = new Date(Date.now() + 10 * 60 * 1000);

  return otpCode;
};

// Generate a 6-digit email OTP with 10-minute expiry.
userSchema.methods.createEmailOTP = function () {
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

  this.emailOtp = otpCode;
  this.emailOtpExpires = new Date(Date.now() + 10 * 60 * 1000);

  return otpCode;
};

// Indexes for filtering and sorting.
userSchema.index({ role: 1, createdAt: -1 });
userSchema.index({ stateCode: 1, role: 1, createdAt: -1 });
userSchema.index({ kycStatus: 1, createdAt: -1 });
userSchema.index({ isBlocked: 1, createdAt: -1 });
userSchema.index({ name: 1, role: 1 });

// Allow only one EXECUTIVE account in the database.
userSchema.index(
  { role: 1 },
  {
    unique: true,
    partialFilterExpression: { role: 'EXECUTIVE' },
    name: 'one_executive_account_only'
  }
);

const User = mongoose.model('User', userSchema);

module.exports = User;
