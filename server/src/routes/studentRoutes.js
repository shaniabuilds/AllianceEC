const express = require('express');
const {
  getStudentDashboardStats,
  getMyEnrolledCourses,
  browsePlatformCourses,
  enrollInCourse,
  topUpStudentWallet,
  submitStudentQuiz,
  submitStudentKyc,
  getStudentPracticeMcqs,
  getCourseRichContents,
  getStudentPurchaseStatement
} = require('../controllers/studentController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');
const { uploadKycImage } = require('../middlewares/uploadMiddleware');

const router = express.Router();

// Strict RBAC Guard: Requires valid JWT and STUDENT or ADMIN role
router.use(protect);
router.use(restrictTo('STUDENT', 'ADMIN'));

router.get('/stats', getStudentDashboardStats);
router.get('/my-courses', getMyEnrolledCourses);
router.get('/browse-courses', browsePlatformCourses);
router.get('/mcqs', getStudentPracticeMcqs);
router.get('/courses/:courseId/content', getCourseRichContents);
router.get('/purchase-statement', getStudentPurchaseStatement);
router.post('/enroll/:courseId', enrollInCourse);
router.post('/wallet/topup', topUpStudentWallet);
router.post('/quiz/submit', submitStudentQuiz);
router.post(
  '/kyc',
  uploadKycImage.fields([
    { name: 'aadhaarScan', maxCount: 1 },
    { name: 'panScan', maxCount: 1 },
    { name: 'documentScan', maxCount: 1 }
  ]),
  submitStudentKyc
);

module.exports = router;
