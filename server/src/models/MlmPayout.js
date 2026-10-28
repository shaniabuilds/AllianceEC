const mongoose = require('mongoose');

const mlmPayoutSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    mlmNode: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MLMNode',
      required: true
    },
    cycleDate: {
      type: Date,
      default: Date.now,
      index: true
    },
    matchedVolume: {
      type: Number,
      default: 0
    },
    matchingRatePercentage: {
      type: Number,
      default: 10
    },
    grossBonus: {
      type: Number,
      default: 0
    },
    cappingLimit: {
      type: Number,
      default: 25000
    },
    cappedGrossBonus: {
      type: Number,
      default: 0
    },
    adminFee: {
      type: Number,
      default: 0
    },
    tdsDeduction: {
      type: Number,
      default: 0
    },
    netPayout: {
      type: Number,
      default: 0
    },
    carriedLeftAfter: {
      type: Number,
      default: 0
    },
    carriedRightAfter: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['PAID', 'FAILED'],
      default: 'PAID',
      index: true
    }
  },
  {
    timestamps: true
  }
);

mlmPayoutSchema.index({ user: 1, cycleDate: -1 });

const MlmPayout = mongoose.model('MlmPayout', mlmPayoutSchema);

module.exports = MlmPayout;
