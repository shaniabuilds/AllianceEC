const mongoose = require('mongoose');

const userProgressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Subject ID is required'],
      index: true
    },
    completedAssets: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LearningAsset'
      }
    ],
    progressPercentage: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

// Compound unique index ensuring one progress record per user per subject
userProgressSchema.index({ user: 1, subject: 1 }, { unique: true });

const UserProgress = mongoose.model('UserProgress', userProgressSchema);

module.exports = UserProgress;
