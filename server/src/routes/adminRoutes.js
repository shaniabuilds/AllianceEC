const express = require('express');
const {
  getAdminOverviewStats,
  getAllUsers,
  getAdminGranularUserAnalytics,
  bulkCreateAdminUsers,
  updateUserRoleStatus,
  getPendingPayouts,
  approvePayout,
  getAllCourses,
  toggleCourseStatus,
  createAdminCourse,
  bulkCreateAdminCourses,
  uploadCourseThumbnail,
  uploadStudyMaterialDocument,
  updateAdminCourse,
  deleteAdminCourse,
  getCourseEnrolledStudents,
  getRevenueStatement,
  getMlmLeaderboard
} = require('../controllers/adminController');
const {
  getAdminWithdrawals,
  approveAdminWithdrawal,
  rejectAdminWithdrawal
} = require('../controllers/withdrawalController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');
const { uploadKycImage, uploadDocumentFile } = require('../middlewares/uploadMiddleware');

const router = express.Router();

// Strict RBAC Guard: Requires valid JWT and ADMIN role
router.use(protect);
router.use(restrictTo('ADMIN'));

router.get('/stats', getAdminOverviewStats);
router.get('/users', getAllUsers);
router.get('/users/analytics', getAdminGranularUserAnalytics);
router.post('/users/bulk', bulkCreateAdminUsers);
router.put('/users/:userId/role-status', updateUserRoleStatus);
router.get('/payouts', getPendingPayouts);
router.post('/payouts/:transactionId/approve', approvePayout);
router.get('/withdrawals', getAdminWithdrawals);
router.post('/withdrawals/:id/approve', approveAdminWithdrawal);
router.post('/withdrawals/:id/reject', rejectAdminWithdrawal);
router.get('/courses', getAllCourses);
router.get('/courses/:courseId/students', getCourseEnrolledStudents);
router.post('/courses/bulk', bulkCreateAdminCourses);
router.post('/courses', uploadKycImage.single('thumbnailFile'), createAdminCourse);
router.post('/upload-thumbnail', uploadKycImage.single('thumbnailFile'), uploadCourseThumbnail);
router.post('/upload-material', uploadDocumentFile.single('documentFile'), uploadStudyMaterialDocument);
router.put('/courses/:courseId/toggle-active', toggleCourseStatus);
router.put('/courses/:id', updateAdminCourse);
router.delete('/courses/:id', deleteAdminCourse);
router.get("/revenue-statement", getRevenueStatement);
router.get("/mlm-leaderboard", getMlmLeaderboard);

module.exports = router;
