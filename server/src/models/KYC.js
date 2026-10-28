const mongoose = require('mongoose');

const kycSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      unique: true,
      index: true
    },
    documentType: {
      type: String,
      enum: ['AADHAAR', 'PAN', 'BOTH'],
      default: 'BOTH'
    },
    documentNumber: {
      type: String,
      trim: true
    },
    documentScanUrl: {
      type: String,
      trim: true
    },
    aadhaarNumber: {
      type: String,
      trim: true
    },
    aadhaarScanUrl: {
      type: String,
      trim: true
    },
    panNumber: {
      type: String,
      trim: true
    },
    panScanUrl: {
      type: String,
      trim: true
    },
    cloudinaryPublicId: {
      type: String,
      trim: true
    },
    status: {
      type: String,
      enum: ['PENDING', 'VERIFIED', 'REJECTED'],
      default: 'PENDING',
      index: true
    },
    rejectionReason: {
      type: String,
      trim: true
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    verifiedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

kycSchema.index({ status: 1, createdAt: -1 });

const KYC = mongoose.model('KYC', kycSchema);

module.exports = KYC;
