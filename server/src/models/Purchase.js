const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true
    },
    itemType: {
      type: String,
      enum: ['COURSE', 'EBOOK'],
      required: [true, 'Item type (COURSE or EBOOK) is required'],
      index: true
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      index: true
    },
    ebook: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ebook',
      index: true
    },
    amountPaid: {
      type: Number,
      required: [true, 'Amount paid is required']
    },
    validUntil: {
      type: Date,
      default: () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year validity
    },
    paymentMethod: {
      type: String,
      enum: ['WALLET', 'RAZORPAY'],
      default: 'WALLET'
    },
    status: {
      type: String,
      enum: ['SUCCESS', 'FAILED', 'REFUNDED'],
      default: 'SUCCESS',
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Compound indexes to quickly check if a user has enrolled in a course or ebook
purchaseSchema.index({ user: 1, course: 1 });
purchaseSchema.index({ user: 1, ebook: 1 });

const Purchase = mongoose.model('Purchase', purchaseSchema);

module.exports = Purchase;
