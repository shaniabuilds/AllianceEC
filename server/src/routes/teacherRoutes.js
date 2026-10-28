const express = require('express');
const {
  getTeacherStats,
  getTeacherCourses,
  createTeacherCourse,
  bulkCreateTeacherCourses,
  getTeacherMcqs,
  getTeacherMcqAttempts,
  createTeacherMcq,
  deleteTeacherMcq,
  requestTeacherPayout,
  updateTeacherCourse,
  deleteTeacherCourse,
  getTeacherCourseStudents,
  getTeacherRevenueStatement
} = require('../controllers/teacherController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');
const { uploadKycImage, uploadDocumentFile } = require('../middlewares/uploadMiddleware');
const { uploadStudyMaterialDocument } = require('../controllers/adminController');

const router = express.Router();

// Strict RBAC Guard: Requires valid JWT and TEACHER or ADMIN role
router.use(protect);
router.use(restrictTo('TEACHER', 'ADMIN'));

router.get('/stats', getTeacherStats);
router.get('/courses', getTeacherCourses);
router.get('/courses/:courseId/students', getTeacherCourseStudents);
router.post('/courses/bulk', bulkCreateTeacherCourses);
router.post('/courses', uploadKycImage.single('thumbnailFile'), createTeacherCourse);
router.post('/upload-material', uploadDocumentFile.single('documentFile'), uploadStudyMaterialDocument);
router.put('/courses/:id', updateTeacherCourse);
router.delete('/courses/:id', deleteTeacherCourse);
router.get('/mcqs', getTeacherMcqs);
router.get('/mcq-attempts', getTeacherMcqAttempts);
router.post('/mcqs', createTeacherMcq);
router.delete('/mcqs/:id', deleteTeacherMcq);
router.post('/payouts/request', requestTeacherPayout);

module.exports = router;
