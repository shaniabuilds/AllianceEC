const mongoose = require('mongoose');

const learningAssetSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Asset title is required'],
      trim: true
    },
    assetType: {
      type: String,
      enum: ['LESSON_TEXT', 'NOTE_PDF', 'VIDEO_DRM', 'MCQ_TEST', 'ATTACHMENT'],
      required: [true, 'Asset type is required'],
      index: true
    },
    chapter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chapter',
      required: [true, 'Parent chapter ID is required'],
      index: true
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Parent subject ID is required'],
      index: true
    },
    contentUrl: {
      type: String,
      trim: true
    },
    textContent: {
      type: String
    },
    durationSeconds: {
      type: Number,
      default: 0
    },
    sequence: {
      type: Number,
      default: 1,
      index: true
    },
    isFreePreview: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Compound indexes for optimal querying under chapters and subjects
learningAssetSchema.index({ chapter: 1, sequence: 1 });
learningAssetSchema.index({ subject: 1, isFreePreview: 1 });

const LearningAsset = mongoose.model('LearningAsset', learningAssetSchema);

module.exports = LearningAsset;
