const mongoose = require('mongoose');

const withdrawalRequestSchema = new mongoose.Schema(
  {
    withdrawalId: {
      type: String,
      unique: true,
      index: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true
    },
    userRole: {
      type: String,
      enum: ['STUDENT', 'TEACHER', 'ADMIN', 'EXECUTIVE'],
      required: [true, 'User role is required'],
      index: true
    },
    wallet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Wallet',
      required: [true, 'Wallet ID is required']
    },
    amount: {
      type: Number,
      required: [true, 'Withdrawal amount is required'],
      min: [50, 'Minimum withdrawal amount is ₹50']
    },
    payoutMethod: {
      type: String,
      enum: ['BANK', 'UPI'],
      required: [true, 'Payout method (BANK or UPI) is required'],
      index: true
    },
    bankDetails: {
      accountHolderName: { type: String, trim: true },
      accountNumber: { type: String, trim: true },
      ifscCode: { type: String, uppercase: true, trim: true },
      bankName: { type: String, trim: true }
    },
    upiDetails: {
      upiId: { type: String, lowercase: true, trim: true },
      accountHolderName: { type: String, trim: true }
    },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'],
      default: 'PENDING',
      index: true
    },
    adminRemarks: {
      type: String,
      trim: true,
      default: ''
    },
    utrNumber: {
      type: String,
      trim: true,
      default: ''
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    processedAt: {
      type: Date
    },
    rejectionReason: {
      type: String,
      trim: true,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

// Pre-save hook to generate unique withdrawal tracking ID
withdrawalRequestSchema.pre('save', function (next) {
  if (!this.withdrawalId) {
    const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.withdrawalId = `WTH-${Date.now()}-${randomHex}`;
  }
  next();
});

withdrawalRequestSchema.index({ status: 1, createdAt: -1 });
withdrawalRequestSchema.index({ user: 1, createdAt: -1 });
withdrawalRequestSchema.index({ userRole: 1, status: 1, createdAt: -1 });

const WithdrawalRequest = mongoose.model('WithdrawalRequest', withdrawalRequestSchema);

module.exports = WithdrawalRequest;
