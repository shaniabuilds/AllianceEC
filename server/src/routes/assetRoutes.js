const express = require('express');
const {
  getAssetsByChapter,
  createAsset
} = require('../controllers/assetController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');
const {
  createAssetSchema,
  validateRequest
} = require('../validators/learningValidator');

const router = express.Router();

router.get('/', getAssetsByChapter);

// Protected Educator / Admin Asset Creation
router.post(
  '/',
  protect,
  restrictTo('TEACHER', 'ADMIN'),
  validateRequest(createAssetSchema),
  createAsset
);

module.exports = router;
