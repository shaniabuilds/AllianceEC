const mongoose = require('mongoose');

const mcqAttemptSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true
    },
    chapter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chapter',
      index: true
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      index: true
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      index: true
    },
    quizSetTitle: {
      type: String,
      trim: true
    },
    quizSetId: {
      type: String,
      trim: true,
      index: true
    },
    answers: [
      {
        question: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'McqQuestion',
          required: true
        },
        selectedOption: {
          type: Number,
          required: true
        },
        isCorrect: {
          type: Boolean,
          default: false
        }
      }
    ],
    score: {
      type: Number,
      default: 0
    },
    totalMarks: {
      type: Number,
      default: 0
    },
    percentage: {
      type: Number,
      default: 0
    },
    passed: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

mcqAttemptSchema.index({ user: 1, chapter: 1, createdAt: -1 });

const McqAttempt = mongoose.model('McqAttempt', mcqAttemptSchema);

module.exports = McqAttempt;
