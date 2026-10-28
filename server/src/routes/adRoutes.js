const express = require('express');
const {
  getActiveAds,
  getAllAdsAdmin,
  createAd,
  updateAd,
  toggleAdActive,
  deleteAd
} = require('../controllers/adController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');

const router = express.Router();

// Public endpoint for students (Web & Mobile app)
router.get('/', getActiveAds);

// Super Admin protected management endpoints
router.get('/admin/all', protect, restrictTo('ADMIN'), getAllAdsAdmin);
router.post('/', protect, restrictTo('ADMIN'), createAd);
router.put('/:id', protect, restrictTo('ADMIN'), updateAd);
router.patch('/:id/toggle-active', protect, restrictTo('ADMIN'), toggleAdActive);
router.delete('/:id', protect, restrictTo('ADMIN'), deleteAd);

module.exports = router;
