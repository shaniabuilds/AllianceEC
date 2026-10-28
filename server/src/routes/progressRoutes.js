const express = require('express');
const {
  getUserProgress,
  completeAsset
} = require('../controllers/progressController');
const { protect } = require('../middlewares/authMiddleware');
const {
  completeAssetSchema,
  validateRequest
} = require('../validators/learningValidator');

const router = express.Router();

router.use(protect);

router.get('/:subjectId', getUserProgress);
router.post('/complete-asset', validateRequest(completeAssetSchema), completeAsset);

module.exports = router;
