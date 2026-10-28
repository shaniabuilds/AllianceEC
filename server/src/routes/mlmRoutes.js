const express = require('express');
const {
  getBinaryTree,
  getAffiliateStats,
  updatePlacementPreference,
  executeBinaryPayoutSettlement,
  getPayoutHistory,
  getMLMConfig,
  updateMLMConfig,
  seedMLMNetwork,
  getMlmStatement
} = require('../controllers/mlmController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');
const {
  preferenceSchema,
  validateRequest
} = require('../validators/mlmValidator');

const router = express.Router();

router.post('/seed', seedMLMNetwork);

router.use(protect);

router.get('/tree', getBinaryTree);
router.get('/stats', getAffiliateStats);
router.put('/preference', validateRequest(preferenceSchema), updatePlacementPreference);

// Dynamic MLM Configuration Routes (Admin can increase/decrease any rates)
router.get('/config', getMLMConfig);
router.put('/config', restrictTo('ADMIN'), updateMLMConfig);

// Binary MLM Payout Engine Routes
router.post('/payout/execute', restrictTo('ADMIN'), executeBinaryPayoutSettlement);
router.get('/payout/history', getPayoutHistory);
router.get('/statement', getMlmStatement);

module.exports = router;
