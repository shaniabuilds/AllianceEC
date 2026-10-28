const mongoose = require('mongoose');
const McqQuestion = require('../models/McqQuestion');
const McqAttempt = require('../models/McqAttempt');
const catchAsync = require('../utils/catchAsync');
const { sendSuccess } = require('../utils/apiResponse');
const AppError = require('../utils/appError');

/**
 * @route   GET /api/mcq/questions
 * @desc    Fetch questions for a quiz (correctOption hidden for student security)
 * @access  Public / Student
 */
const getQuestionsForQuiz = catchAsync(async (req, res, next) => {
  const { chapterId, subjectId } = req.query;

  const filter = {};
  if (chapterId) {
    if (!mongoose.Types.ObjectId.isValid(chapterId)) {
      return next(new AppError('Invalid chapterId format.', 400));
    }
    filter.chapter = chapterId;
  } else if (subjectId) {
    if (!mongoose.Types.ObjectId.isValid(subjectId)) {
      return next(new AppError('Invalid subjectId format.', 400));
    }
    filter.subject = subjectId;
  } else {
    return next(new AppError('Please provide chapterId or subjectId query parameter.', 400));
  }

  const questions = await McqQuestion.find(filter)
    .sort({ createdAt: 1 })
    .lean();

  return sendSuccess(res, 200, 'Quiz questions retrieved successfully.', {
    count: questions.length,
    questions
  });
});

/**
 * @route   POST /api/mcq/questions
 * @desc    Create a new MCQ Question with options A-D & correct option key
 * @access  Private (Teacher / Educator / Admin)
 */
const createQuestion = catchAsync(async (req, res, next) => {
  const { chapterId, subjectId, questionText, options, correctOption, explanation, marks } = req.body;

  if (chapterId && !mongoose.Types.ObjectId.isValid(chapterId)) {
    return next(new AppError('Invalid chapterId format.', 400));
  }

  const newQuestion = await McqQuestion.create({
    chapter: chapterId || undefined,
    subject: subjectId || undefined,
    questionText,
    options,
    correctOption,
    explanation,
    marks: marks || 1
  });

  return sendSuccess(res, 201, 'MCQ Question created successfully.', {
    question: newQuestion
  });
});

/**
 * @route   POST /api/mcq/submit
 * @desc    Submit student quiz answers, evaluate score & percentage, record attempt
 * @access  Private (Student / User)
 */
const submitQuizAttempt = catchAsync(async (req, res, next) => {
  const { chapterId, answers } = req.body;

  if (!mongoose.Types.ObjectId.isValid(chapterId)) {
    return next(new AppError('Invalid chapterId format.', 400));
  }

  const questionIds = answers.map((a) => a.questionId);
  const questionsInDb = await McqQuestion.find({ _id: { $in: questionIds } })
    .select('+correctOption')
    .lean();

  const questionMap = new Map();
  questionsInDb.forEach((q) => questionMap.set(q._id.toString(), q));

  let totalMarks = 0;
  let score = 0;
  const processedAnswers = [];

  for (const item of answers) {
    const qObj = questionMap.get(item.questionId);
    if (qObj) {
      const qMarks = qObj.marks || 1;
      totalMarks += qMarks;
      const isCorrect = qObj.correctOption === item.selectedOption;
      if (isCorrect) {
        score += qMarks;
      }
      processedAnswers.push({
        question: qObj._id,
        selectedOption: item.selectedOption,
        correctOption: qObj.correctOption,
        isCorrect,
        explanation: qObj.explanation
      });
    }
  }

  const percentage = totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0;
  const passed = percentage >= 50;

  const attemptRecord = await McqAttempt.create({
    user: req.user._id,
    chapter: chapterId,
    answers: processedAnswers,
    score,
    totalMarks,
    percentage,
    passed
  });

  return sendSuccess(res, 200, 'Quiz attempt submitted and evaluated successfully.', {
    attemptId: attemptRecord._id,
    score,
    totalMarks,
    percentage,
    passed,
    results: processedAnswers
  });
});

module.exports = {
  getQuestionsForQuiz,
  createQuestion,
  submitQuizAttempt
};
