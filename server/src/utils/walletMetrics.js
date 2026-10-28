const Wallet = require("../models/Wallet");
const Transaction = require("../models/Transaction");
const MLMNode = require("../models/MLMNode");
const WithdrawalRequest = require("../models/WithdrawalRequest");
const Course = require("../models/Course");
const Purchase = require("../models/Purchase");

const TEACHER_ROYALTY_RATE = 0.7;
// Single source of truth: har purchase ka royalty yahin se nikle
const calcTeacherRoyalty = (gross) =>
  Math.round((Number(gross) || 0) * TEACHER_ROYALTY_RATE);

/**
 * Calculate user wallet balances:
 * - STUDENT:
 *   - totalBalance: Total usable balance for purchasing courses/materials
 *   - withdrawableBalance: Amount earned via Refer & Earn / Affiliate commissions eligible for cashout to Bank/UPI
 *   - purchaseBalance: Deposit/Top-Up balance reserved for course purchases (non-withdrawable)
 * - TEACHER:
 *   - courseRoyaltyEarned: 70% share from student course purchases
 *   - referralEarned: Income from Refer & Earn / MLM binary matching bonus
 *   - totalEarned: Combined lifetime earnings (Course Royalties + Referrals)
 *   - withdrawableBalance: Total available to cash out to Bank Account / UPI
 *   - totalWithdrawnOrPending: Previous or active withdrawals
 */
const getUserWalletMetrics = async (userId, userRole) => {
  let wallet = await Wallet.findOne({ user: userId });
  if (!wallet) {
    wallet = await Wallet.create({ user: userId, balance: 0 });
  }

  // TEACHER: Course Royalties (Course Sell) + Refer & Earn Commissions
  if (userRole === "TEACHER") {
    const teacherCourses = await Course.find({ instructor: userId }).select(
      "_id price",
    );
    const courseIds = teacherCourses.map((c) => c._id);
    const priceMap = {};
    teacherCourses.forEach((c) => (priceMap[String(c._id)] = c.price || 0));

    // Filter statement/roster jaisa hi rakha (SUCCESS ya status field nahi)
    const purchases = await Purchase.find({
      course: { $in: courseIds },
      $or: [{ status: "SUCCESS" }, { status: { $exists: false } }],
    }).select("course amountPaid");

    const courseRoyaltyEarned = purchases.reduce(
      (acc, p) =>
        acc +
        calcTeacherRoyalty(p.amountPaid || priceMap[String(p.course)] || 0),
      0,
    );

    // 2. Calculate Refer & Earn / MLM Commissions
    const referralTxns = await Transaction.aggregate([
      {
        $match: {
          user: userId,
          type: "CREDIT",
          category: { $in: ["AFFILIATE_COMMISSION"] },
          status: "SUCCESS",
        },
      },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const txnReferralEarned = referralTxns[0]?.total || 0;

    const mlmNode = await MLMNode.findOne({ user: userId });
    const nodeEarned = mlmNode?.totalEarnings || 0;
    const referralEarned = Math.round(Math.max(txnReferralEarned, nodeEarned));

    // 3. Calculate Withdrawals already requested or approved
    const withdrawalRequests = await WithdrawalRequest.aggregate([
      {
        $match: {
          user: userId,
          status: { $in: ["PENDING", "APPROVED"] },
        },
      },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const totalWithdrawnOrPending = withdrawalRequests[0]?.total || 0;

    const totalEarned = courseRoyaltyEarned + referralEarned;
    const withdrawableBalance = Math.max(
      0,
      totalEarned - totalWithdrawnOrPending,
    );

    // Sync wallet balance to match exact available balance
    if (wallet.balance !== withdrawableBalance) {
      wallet.balance = withdrawableBalance;
      await wallet.save();
    }

    return {
      totalBalance: withdrawableBalance,
      withdrawableBalance,
      purchaseBalance: 0,
      courseRoyaltyEarned,
      referralEarned,
      totalReferralEarned: referralEarned,
      totalEarned,
      totalWithdrawnOrPending,
      totalStudents: purchases.length,
      activeCoursesCount: teacherCourses.length,
    };
  }

  // STUDENT:
  // 1. Calculate total referral / affiliate commission earned
  const referralTxns = await Transaction.aggregate([
    {
      $match: {
        user: userId,
        type: "CREDIT",
        category: { $in: ["AFFILIATE_COMMISSION", "ROYALTY_PAYOUT"] },
        status: "SUCCESS",
      },
    },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);
  const txnReferralEarned = referralTxns[0]?.total || 0;

  const mlmNode = await MLMNode.findOne({ user: userId });
  const nodeEarned = mlmNode?.totalEarnings || 0;
  const totalReferralEarned = Math.max(txnReferralEarned, nodeEarned);

  // 2. Calculate total deposit top-ups made
  const topupTxns = await Transaction.aggregate([
    {
      $match: {
        user: userId,
        type: "CREDIT",
        category: { $in: ["TOPUP", "WALLET_TOPUP"] },
        status: "SUCCESS",
      },
    },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);
  const totalDeposited = topupTxns[0]?.total || 0;

  // 3. Calculate total withdrawals already requested or approved
  const withdrawalRequests = await WithdrawalRequest.aggregate([
    {
      $match: {
        user: userId,
        status: { $in: ["PENDING", "APPROVED"] },
      },
    },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);
  const totalWithdrawnOrPending = withdrawalRequests[0]?.total || 0;

  // 4. Calculate available referral earnings eligible for cashout
  const availableReferralEarnings = Math.max(
    0,
    totalReferralEarned - totalWithdrawnOrPending,
  );
  const totalBalance = Math.max(0, wallet.balance || 0);
  const withdrawableBalance = Math.min(totalBalance, availableReferralEarnings);
  const purchaseBalance = Math.max(0, totalBalance - withdrawableBalance);

  return {
    totalBalance,
    withdrawableBalance,
    purchaseBalance,
    totalReferralEarned,
    totalDeposited,
    totalWithdrawnOrPending,
  };
};

module.exports = {
  getUserWalletMetrics,
  calcTeacherRoyalty,
};
