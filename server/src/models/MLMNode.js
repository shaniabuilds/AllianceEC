const mongoose = require('mongoose');

const mlmNodeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      unique: true,
      index: true
    },
    sponsor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MLMNode',
      index: true
    },
    position: {
      type: String,
      enum: ['LEFT', 'RIGHT'],
      index: true
    },
    leftLeg: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MLMNode'
    },
    rightLeg: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MLMNode'
    },
    ancestors: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MLMNode',
        index: true
      }
    ],
    leftVolume: {
      type: Number,
      default: 0
    },
    rightVolume: {
      type: Number,
      default: 0
    },
    carriedLeftVolume: {
      type: Number,
      default: 0
    },
    carriedRightVolume: {
      type: Number,
      default: 0
    },
    totalMatchedVolume: {
      type: Number,
      default: 0
    },
    totalEarnings: {
      type: Number,
      default: 0
    },
    lastPayoutDate: {
      type: Date
    },
    rank: {
      type: String,
      enum: ['BRONZE', 'SILVER', 'GOLD', 'DIAMOND', 'CROWN_AMBASSADOR'],
      default: 'BRONZE',
      index: true
    },
    placementPreference: {
      type: String,
      enum: ['AUTO', 'LEFT', 'RIGHT'],
      default: 'AUTO'
    }
  },
  {
    timestamps: true
  }
);

mlmNodeSchema.index({ user: 1, parent: 1 });

const MLMNode = mongoose.model('MLMNode', mlmNodeSchema);

module.exports = MLMNode;
