const express = require('express');
const {
  purchaseCourseWithWallet,
  purchaseEbookWithWallet,
  getMyCourses,
  getMyEbooks
} = require('../controllers/purchaseController');
const { protect } = require('../middlewares/authMiddleware');
const {
  purchaseCourseSchema,
  purchaseEbookSchema,
  validateRequest
} = require('../validators/walletValidator');

const router = express.Router();

router.use(protect);

router.post('/course', validateRequest(purchaseCourseSchema), purchaseCourseWithWallet);
router.post('/ebook', validateRequest(purchaseEbookSchema), purchaseEbookWithWallet);
router.get('/my-courses', getMyCourses);
router.get('/my-ebooks', getMyEbooks);

module.exports = router;
