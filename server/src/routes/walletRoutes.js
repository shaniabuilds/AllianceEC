const express = require('express');
const {
  getWalletBalance,
  getTransactionHistory,
  createRazorpayTopupOrder,
  verifyRazorpayTopup
} = require('../controllers/walletController');
const {
  getPayoutProfile,
  updatePayoutProfile,
  requestWithdrawal,
  getMyWithdrawals,
  cancelMyWithdrawal
} = require('../controllers/withdrawalController');
const { protect } = require('../middlewares/authMiddleware');
const {
  topupOrderSchema,
  verifyPaymentSchema,
  validateRequest
} = require('../validators/walletValidator');

const router = express.Router();

router.use(protect);

router.get('/balance', getWalletBalance);
router.get('/transactions', getTransactionHistory);
router.post('/topup/order', validateRequest(topupOrderSchema), createRazorpayTopupOrder);
router.post('/topup/verify', validateRequest(verifyPaymentSchema), verifyRazorpayTopup);

// Payout Profile & Withdrawal Routes (Student & Teacher)
router.get('/payout-profile', getPayoutProfile);
router.put('/payout-profile', updatePayoutProfile);
router.post('/withdraw', requestWithdrawal);
router.get('/withdrawals', getMyWithdrawals);
router.post('/withdraw/:id/cancel', cancelMyWithdrawal);

module.exports = router;
