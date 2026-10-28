const express = require('express');
const {
  getTaxonomyTree,
  getCoursesByCategory,
  getCourseById,
  createCourse,
  seedCourses
} = require('../controllers/courseController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');
const {
  createCourseSchema,
  validateRequest
} = require('../validators/contentValidator');

const router = express.Router();

router.get('/taxonomy', getTaxonomyTree);
router.get('/', getCoursesByCategory);
router.get('/:id', getCourseById);
router.post('/seed', seedCourses);

// Protected Educator / Admin Course Creation
router.post(
  '/',
  protect,
  restrictTo('TEACHER', 'ADMIN'),
  validateRequest(createCourseSchema),
  createCourse
);

module.exports = router;
