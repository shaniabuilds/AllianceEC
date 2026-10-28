const express = require('express');
const {
  getChaptersBySubject,
  createChapter,
  seedChapters
} = require('../controllers/chapterController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');
const {
  createChapterSchema,
  validateRequest
} = require('../validators/learningValidator');

const router = express.Router();

router.get('/', getChaptersBySubject);
router.post('/seed', seedChapters);

// Protected Educator / Admin Chapter Creation
router.post(
  '/',
  protect,
  restrictTo('TEACHER', 'ADMIN'),
  validateRequest(createChapterSchema),
  createChapter
);

module.exports = router;
