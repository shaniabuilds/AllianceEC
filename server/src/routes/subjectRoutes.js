const express = require('express');
const {
  getSubjectsByCourse,
  createSubject
} = require('../controllers/subjectController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');
const {
  createSubjectSchema,
  validateRequest
} = require('../validators/contentValidator');

const router = express.Router();

router.get('/', getSubjectsByCourse);

// Protected Educator / Admin Subject Creation
router.post(
  '/',
  protect,
  restrictTo('TEACHER', 'ADMIN'),
  validateRequest(createSubjectSchema),
  createSubject
);

module.exports = router;
