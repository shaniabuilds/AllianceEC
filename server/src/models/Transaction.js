const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    wallet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Wallet',
      required: [true, 'Wallet ID is required'],
      index: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true
    },
    amount: {
      type: Number,
      required: [true, 'Transaction amount is required']
    },
    type: {
      type: String,
      enum: ['CREDIT', 'DEBIT'],
      required: [true, 'Transaction type (CREDIT or DEBIT) is required'],
      index: true
    },
    category: {
      type: String,
      enum: [
        'TOPUP',
        'WALLET_TOPUP',
        'COURSE_PURCHASE',
        'EBOOK_PURCHASE',
        'ROYALTY_PAYOUT',
        'AFFILIATE_COMMISSION',
        'WITHDRAWAL',
        'WITHDRAWAL_REFUND',
        'WITHDRAWAL_PAID'
      ],
      required: [true, 'Transaction category is required'],
      index: true
    },
    status: {
      type: String,
      enum: ['PENDING', 'SUCCESS', 'FAILED'],
      default: 'PENDING',
      index: true
    },
    referenceId: {
      type: String,
      unique: true,
      index: true
    },
    razorpayOrderId: {
      type: String,
      trim: true
    },
    razorpayPaymentId: {
      type: String,
      trim: true
    },
    razorpaySignature: {
      type: String,
      trim: true
    },
    description: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

// Pre-save hook to generate referenceId if missing
transactionSchema.pre('save', function (next) {
  if (!this.referenceId) {
    const randomHex = Math.random().toString(36).substring(2, 10).toUpperCase();
    this.referenceId = `TXN-${Date.now()}-${randomHex}`;
  }
  next();
});

transactionSchema.index({ user: 1, createdAt: -1 });
transactionSchema.index({ wallet: 1, createdAt: -1 });

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
