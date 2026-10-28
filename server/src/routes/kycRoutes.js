const express = require('express');
const {
  submitKYC,
  getKYCStatus,
  getAllKYCRequests,
  verifyKYCRequest
} = require('../controllers/kycController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');
const { uploadKycImage } = require('../middlewares/uploadMiddleware');
const {
  submitKycSchema,
  verifyKycSchema,
  validateRequest
} = require('../validators/authValidator');

const router = express.Router();

router.use(protect);

// Student / User KYC Endpoints (supports single HD image file upload up to 2MB)
router.post(
  '/submit',
  uploadKycImage.single('documentImage'),
  validateRequest(submitKycSchema),
  submitKYC
);
router.get('/status', getKYCStatus);

// Admin Protected KYC Endpoints
router.get('/admin/pending', restrictTo('ADMIN'), getAllKYCRequests);
router.get('/admin/all', restrictTo('ADMIN'), getAllKYCRequests);
router.put('/admin/verify/:id', restrictTo('ADMIN'), validateRequest(verifyKycSchema), verifyKYCRequest);

module.exports = router;
