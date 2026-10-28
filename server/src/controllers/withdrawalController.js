const WithdrawalRequest = require('../models/WithdrawalRequest');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const catchAsync = require('../utils/catchAsync');
const { sendSuccess, sendPaginatedSuccess } = require('../utils/apiResponse');
const AppError = require('../utils/appError');

/**
 * @route   GET /api/wallet/payout-profile
 * @desc    Fetch saved Bank & UPI payout settings for logged-in user
 * @access  Private (Student / Teacher / User)
 */
const getPayoutProfile = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id).select('payoutProfile name mobile role');
  if (!user) {
    return next(new AppError('User not found.', 404));
  }

  return sendSuccess(res, 200, 'Payout profile retrieved successfully.', {
    payoutProfile: user.payoutProfile || {
      preferredMethod: 'BANK',
      bankAccount: {},
      upi: {},
      isConfigured: false
    }
  });
});

/**
 * @route   PUT /api/wallet/payout-profile
 * @desc    Save or update Bank & UPI payout settings for logged-in user
 * @access  Private (Student / Teacher / User)
 */
const updatePayoutProfile = catchAsync(async (req, res, next) => {
  const { preferredMethod, bankAccount, upi } = req.body;

  const user = await User.findById(req.user._id);
  if (!user) {
    return next(new AppError('User not found.', 404));
  }

  if (!user.payoutProfile) {
    user.payoutProfile = {};
  }

  if (preferredMethod) {
    user.payoutProfile.preferredMethod = preferredMethod;
  }

  if (bankAccount) {
    user.payoutProfile.bankAccount = {
      accountHolderName: (bankAccount.accountHolderName || '').trim(),
      accountNumber: (bankAccount.accountNumber || '').trim(),
      ifscCode: (bankAccount.ifscCode || '').trim().toUpperCase(),
      bankName: (bankAccount.bankName || '').trim()
    };
  }

  if (upi) {
    user.payoutProfile.upi = {
      upiId: (upi.upiId || '').trim().toLowerCase(),
      accountHolderName: (upi.accountHolderName || '').trim()
    };
  }

  user.payoutProfile.isConfigured = true;
  await user.save();

  return sendSuccess(res, 200, 'Payout settings saved successfully.', {
    payoutProfile: user.payoutProfile
  });
});

const { getUserWalletMetrics } = require('../utils/walletMetrics');

/**
 * @route   POST /api/wallet/withdraw
 * @desc    Submit new withdrawal request to Admin (Student or Teacher)
 * @access  Private (Student / Teacher / User)
 */
const requestWithdrawal = catchAsync(async (req, res, next) => {
  const { amount, payoutMethod, bankDetails, upiDetails, saveAsDefault } = req.body;

  const withdrawalAmount = Number(amount);
  if (isNaN(withdrawalAmount) || withdrawalAmount < 50) {
    return next(new AppError('Minimum withdrawal amount is ₹50.', 400));
  }

  const metrics = await getUserWalletMetrics(req.user._id, req.user.role);
  let wallet = await Wallet.findOne({ user: req.user._id });

  if (!wallet || wallet.balance < withdrawalAmount) {
    return next(
      new AppError(
        `Insufficient wallet balance. Total available balance: ₹${wallet ? wallet.balance : 0}.`,
        400
      )
    );
  }

  // Student specific financial validation: only refer & earn commissions can be withdrawn
  if (req.user.role === 'STUDENT') {
    if (metrics.withdrawableBalance < 50) {
      return next(
        new AppError(
          `You have ₹${metrics.withdrawableBalance} withdrawable earnings from Refer & Earn. Minimum withdrawal is ₹50. Note: Wallet top-up balance is non-withdrawable and reserved for course purchases.`,
          400
        )
      );
    }

    if (withdrawalAmount > metrics.withdrawableBalance) {
      return next(
        new AppError(
          `You can only withdraw earnings from Refer & Earn (Affiliate / MLM) commissions. Your current withdrawable referral earnings are ₹${metrics.withdrawableBalance.toLocaleString('en-IN')}. Money added via Wallet Top-up is reserved for course purchases.`,
          400
        )
      );
    }
  } else {
    // Teachers / Admins
    if (withdrawalAmount > metrics.withdrawableBalance) {
      return next(
        new AppError(
          `Insufficient royalty balance. Available royalty balance: ₹${metrics.withdrawableBalance.toLocaleString('en-IN')}.`,
          400
        )
      );
    }
  }

  // Validate payout method details
  if (payoutMethod === 'BANK') {
    if (
      !bankDetails ||
      !bankDetails.accountHolderName ||
      !bankDetails.accountNumber ||
      !bankDetails.ifscCode
    ) {
      return next(
        new AppError(
          'Please provide complete bank details: Account Holder Name, Account Number, and IFSC Code.',
          400
        )
      );
    }
  } else if (payoutMethod === 'UPI') {
    if (!upiDetails || !upiDetails.upiId) {
      return next(new AppError('Please provide a valid UPI ID (e.g., username@bank).', 400));
    }
  } else {
    return next(new AppError('Invalid payout method. Must be BANK or UPI.', 400));
  }

  // Deduct/hold balance from wallet to prevent double-spending
  wallet.balance -= withdrawalAmount;
  await wallet.save();

  // Create Withdrawal Request
  const withdrawal = await WithdrawalRequest.create({
    user: req.user._id,
    userRole: req.user.role,
    wallet: wallet._id,
    amount: withdrawalAmount,
    payoutMethod,
    bankDetails: payoutMethod === 'BANK' ? {
      accountHolderName: bankDetails.accountHolderName.trim(),
      accountNumber: bankDetails.accountNumber.trim(),
      ifscCode: bankDetails.ifscCode.trim().toUpperCase(),
      bankName: (bankDetails.bankName || '').trim()
    } : undefined,
    upiDetails: payoutMethod === 'UPI' ? {
      upiId: upiDetails.upiId.trim().toLowerCase(),
      accountHolderName: (upiDetails.accountHolderName || req.user.name || '').trim()
    } : undefined,
    status: 'PENDING'
  });

  // Create audit transaction log
  const txn = await Transaction.create({
    wallet: wallet._id,
    user: req.user._id,
    amount: withdrawalAmount,
    type: 'DEBIT',
    category: 'WITHDRAWAL',
    status: 'PENDING',
    description: `Withdrawal request (${withdrawal.withdrawalId}) via ${
      payoutMethod === 'BANK' ? 'Bank Transfer' : 'UPI'
    }`
  });

  // Optionally save profile as default
  if (saveAsDefault) {
    const user = await User.findById(req.user._id);
    if (user) {
      if (!user.payoutProfile) user.payoutProfile = {};
      user.payoutProfile.preferredMethod = payoutMethod;
      if (payoutMethod === 'BANK') {
        user.payoutProfile.bankAccount = {
          accountHolderName: bankDetails.accountHolderName.trim(),
          accountNumber: bankDetails.accountNumber.trim(),
          ifscCode: bankDetails.ifscCode.trim().toUpperCase(),
          bankName: (bankDetails.bankName || '').trim()
        };
      } else if (payoutMethod === 'UPI') {
        user.payoutProfile.upi = {
          upiId: upiDetails.upiId.trim().toLowerCase(),
          accountHolderName: (upiDetails.accountHolderName || req.user.name || '').trim()
        };
      }
      user.payoutProfile.isConfigured = true;
      await user.save();
    }
  }

  return sendSuccess(res, 201, 'Withdrawal request submitted successfully to Admin.', {
    withdrawal,
    newBalance: wallet.balance,
    transaction: txn
  });
});

/**
 * @route   GET /api/wallet/withdrawals
 * @desc    Fetch logged-in user's withdrawal request history
 * @access  Private (Student / Teacher / User)
 */
const getMyWithdrawals = catchAsync(async (req, res) => {
  const withdrawals = await WithdrawalRequest.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .lean();

  return sendSuccess(res, 200, 'Withdrawals history retrieved successfully.', {
    count: withdrawals.length,
    withdrawals
  });
});

/**
 * @route   POST /api/wallet/withdraw/:id/cancel
 * @desc    Cancel a pending withdrawal request and refund wallet balance immediately
 * @access  Private (Owner only)
 */
const cancelMyWithdrawal = catchAsync(async (req, res, next) => {
  const withdrawal = await WithdrawalRequest.findOne({
    _id: req.params.id,
    user: req.user._id
  });

  if (!withdrawal) {
    return next(new AppError('Withdrawal request not found.', 404));
  }

  if (withdrawal.status !== 'PENDING') {
    return next(
      new AppError(`Cannot cancel a withdrawal that is already ${withdrawal.status}.`, 400)
    );
  }

  withdrawal.status = 'CANCELLED';
  withdrawal.rejectionReason = 'Cancelled by user before processing';
  await withdrawal.save();

  // Refund wallet
  const wallet = await Wallet.findById(withdrawal.wallet);
  if (wallet) {
    wallet.balance += withdrawal.amount;
    await wallet.save();

    await Transaction.create({
      wallet: wallet._id,
      user: req.user._id,
      amount: withdrawal.amount,
      type: 'CREDIT',
      category: 'WITHDRAWAL_REFUND',
      status: 'SUCCESS',
      description: `Refund for cancelled withdrawal (${withdrawal.withdrawalId})`
    });
  }

  return sendSuccess(res, 200, 'Withdrawal request cancelled and balance refunded to wallet.', {
    withdrawal,
    refundedAmount: withdrawal.amount,
    newBalance: wallet ? wallet.balance : 0
  });
});

/**
 * @route   GET /api/admin/withdrawals
 * @desc    Fetch all withdrawal requests for Super Admin management
 * @access  Private (Admin Only)
 */
const getAdminWithdrawals = catchAsync(async (req, res) => {
  const { status, role, search } = req.query;

  const filter = {};
  if (status && status !== 'ALL') {
    filter.status = status;
  }
  if (role && role !== 'ALL') {
    filter.userRole = role;
  }

  let userIds = null;
  if (search && search.trim()) {
    const q = search.trim();
    const regex = new RegExp(q, 'i');
    const matchedUsers = await User.find({
      $or: [{ name: regex }, { mobile: regex }, { userId: regex }, { email: regex }]
    }).select('_id');
    userIds = matchedUsers.map((u) => u._id);
    filter.$or = [
      { user: { $in: userIds } },
      { withdrawalId: regex },
      { utrNumber: regex },
      { 'bankDetails.accountNumber': regex },
      { 'upiDetails.upiId': regex }
    ];
  }

  const withdrawals = await WithdrawalRequest.find(filter)
    .populate('user', 'name mobile userId role email kycStatus')
    .sort({ createdAt: -1 })
    .lean();

  return sendSuccess(res, 200, 'Withdrawal requests retrieved successfully.', {
    count: withdrawals.length,
    withdrawals
  });
});

/**
 * @route   POST /api/admin/withdrawals/:id/approve
 * @desc    Approve a pending withdrawal request and record UTR / transaction proof
 * @access  Private (Admin Only)
 */
const approveAdminWithdrawal = catchAsync(async (req, res, next) => {
  const { utrNumber, adminRemarks } = req.body;

  const withdrawal = await WithdrawalRequest.findById(req.params.id).populate('user', 'name mobile role');
  if (!withdrawal) {
    return next(new AppError('Withdrawal request not found.', 404));
  }

  if (withdrawal.status !== 'PENDING') {
    return next(
      new AppError(`This withdrawal request is already ${withdrawal.status}.`, 400)
    );
  }

  withdrawal.status = 'APPROVED';
  withdrawal.utrNumber = (utrNumber || `UTR-${Date.now()}`).trim();
  withdrawal.adminRemarks = (adminRemarks || 'Withdrawal paid successfully via IMPS / UPI.').trim();
  withdrawal.processedBy = req.user._id;
  withdrawal.processedAt = new Date();
  await withdrawal.save();

  // Update corresponding transaction if found
  await Transaction.findOneAndUpdate(
    {
      user: withdrawal.user._id,
      category: 'WITHDRAWAL',
      status: 'PENDING',
      amount: withdrawal.amount
    },
    {
      status: 'SUCCESS',
      description: `Withdrawal paid (${withdrawal.withdrawalId}) - UTR: ${withdrawal.utrNumber}`
    }
  );

  return sendSuccess(res, 200, 'Withdrawal request marked as APPROVED & PAID.', {
    withdrawal
  });
});

/**
 * @route   POST /api/admin/withdrawals/:id/reject
 * @desc    Reject a pending withdrawal request and refund money back to user wallet
 * @access  Private (Admin Only)
 */
const rejectAdminWithdrawal = catchAsync(async (req, res, next) => {
  const { rejectionReason } = req.body;

  const withdrawal = await WithdrawalRequest.findById(req.params.id).populate('user', 'name mobile role');
  if (!withdrawal) {
    return next(new AppError('Withdrawal request not found.', 404));
  }

  if (withdrawal.status !== 'PENDING') {
    return next(
      new AppError(`This withdrawal request is already ${withdrawal.status}.`, 400)
    );
  }

  const reason = (rejectionReason || 'Withdrawal request rejected by Admin.').trim();

  withdrawal.status = 'REJECTED';
  withdrawal.rejectionReason = reason;
  withdrawal.processedBy = req.user._id;
  withdrawal.processedAt = new Date();
  await withdrawal.save();

  // Refund money back to user wallet
  const wallet = await Wallet.findById(withdrawal.wallet);
  if (wallet) {
    wallet.balance += withdrawal.amount;
    await wallet.save();

    await Transaction.create({
      wallet: wallet._id,
      user: withdrawal.user._id,
      amount: withdrawal.amount,
      type: 'CREDIT',
      category: 'WITHDRAWAL_REFUND',
      status: 'SUCCESS',
      description: `Refund for rejected withdrawal (${withdrawal.withdrawalId}): ${reason}`
    });
  }

  return sendSuccess(res, 200, 'Withdrawal request REJECTED and funds refunded to user wallet.', {
    withdrawal,
    refundedBalance: wallet ? wallet.balance : 0
  });
});

module.exports = {
  getPayoutProfile,
  updatePayoutProfile,
  requestWithdrawal,
  getMyWithdrawals,
  cancelMyWithdrawal,
  getAdminWithdrawals,
  approveAdminWithdrawal,
  rejectAdminWithdrawal
};
