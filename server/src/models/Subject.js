const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Subject title is required'],
      trim: true
    },
    subjectCode: {
      type: String,
      required: [true, 'Subject code is required (e.g. PHY-10)'],
      uppercase: true,
      index: true,
      trim: true
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Parent course ID is required'],
      index: true
    },
    icon: {
      type: String,
      default: 'BookOpen'
    },
    colorBadge: {
      type: String,
      default: '#6366F1'
    },
    totalChapters: {
      type: Number,
      default: 0
    },
    sequence: {
      type: Number,
      default: 1,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Compound index for sequence ordering under a course
subjectSchema.index({ course: 1, sequence: 1 });

const Subject = mongoose.model('Subject', subjectSchema);

module.exports = Subject;
