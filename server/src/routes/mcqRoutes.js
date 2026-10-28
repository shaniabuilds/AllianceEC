const express = require('express');
const {
  getQuestionsForQuiz,
  createQuestion,
  submitQuizAttempt
} = require('../controllers/mcqController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');
const {
  createQuestionSchema,
  submitQuizSchema,
  validateRequest
} = require('../validators/learningValidator');

const router = express.Router();

router.get('/questions', getQuestionsForQuiz);

// Protected Student Quiz Submission
router.post(
  '/submit',
  protect,
  validateRequest(submitQuizSchema),
  submitQuizAttempt
);

// Protected Educator / Admin Question Creation
router.post(
  '/questions',
  protect,
  restrictTo('TEACHER', 'ADMIN'),
  validateRequest(createQuestionSchema),
  createQuestion
);

module.exports = router;
