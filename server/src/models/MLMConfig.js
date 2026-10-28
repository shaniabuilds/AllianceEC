const mongoose = require('mongoose');

const mlmConfigSchema = new mongoose.Schema(
  {
    perReferralPV: {
      type: Number,
      default: 100,
      min: [1, 'PV must be at least 1']
    },
    directReferralBonus: {
      type: Number,
      default: 0,
      min: [0, 'Direct referral bonus cannot be negative']
    },
    matchingRatePercentage: {
      type: Number,
      default: 10,
      min: [0, 'Matching rate cannot be negative'],
      max: [100, 'Matching rate cannot exceed 100%']
    },
    dailyCappingLimit: {
      type: Number,
      default: 25000,
      min: [100, 'Daily capping limit must be at least ₹100']
    },
    adminFeePercentage: {
      type: Number,
      default: 5,
      min: [0, 'Admin fee cannot be negative'],
      max: [50, 'Admin fee cannot exceed 50%']
    },
    tdsPercentage: {
      type: Number,
      default: 5,
      min: [0, 'TDS percentage cannot be negative'],
      max: [50, 'TDS percentage cannot exceed 50%']
    },
    isActive: {
      type: Boolean,
      default: true
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

/**
 * Static singleton helper to retrieve or create default active MLM configuration
 */
mlmConfigSchema.statics.getConfig = async function () {
  let config = await this.findOne({ isActive: true }).sort({ createdAt: -1 });
  if (!config) {
    config = await this.create({
      perReferralPV: 100,
      directReferralBonus: 0,
      matchingRatePercentage: 10,
      dailyCappingLimit: 25000,
      adminFeePercentage: 5,
      tdsPercentage: 5
    });
  }
  return config;
};

const MLMConfig = mongoose.model('MLMConfig', mlmConfigSchema);

module.exports = MLMConfig;
