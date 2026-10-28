const mongoose = require('mongoose');

const chapterSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Chapter title is required'],
      trim: true
    },
    chapterCode: {
      type: String,
      trim: true,
      uppercase: true
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Parent subject ID is required'],
      index: true
    },
    sequence: {
      type: Number,
      default: 1,
      index: true
    },
    totalAssets: {
      type: Number,
      default: 0
    },
    isFreeDemo: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Compound index for sequence ordering under a subject
chapterSchema.index({ subject: 1, sequence: 1 });

const Chapter = mongoose.model('Chapter', chapterSchema);

module.exports = Chapter;
