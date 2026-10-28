const MLMNode = require("../models/MLMNode");
const MLMConfig = require("../models/MLMConfig");
const User = require("../models/User");
const MlmPayout = require("../models/MlmPayout");
const Wallet = require("../models/Wallet");
const Transaction = require("../models/Transaction");
const catchAsync = require("../utils/catchAsync");
const { getOrCreateMLMNode } = require("../utils/mlmService");
const { sendSuccess } = require("../utils/apiResponse");
const AppError = require("../utils/appError");
const { getUserWalletMetrics } = require("../utils/walletMetrics");
const WithdrawalRequest = require("../models/WithdrawalRequest");

/**
 * Recursive helper to populate binary tree hierarchy up to maxDepth
 */
const buildTreeHierarchy = async (nodeId, currentDepth = 1, maxDepth = 20) => {
  if (!nodeId || currentDepth > maxDepth) return null;

  const node = await MLMNode.findById(nodeId)
    .populate("user", "name userId role referralCode")
    .lean();

  if (!node) return null;

  const leftChild = node.leftLeg
    ? await buildTreeHierarchy(node.leftLeg, currentDepth + 1, maxDepth)
    : null;
  const rightChild = node.rightLeg
    ? await buildTreeHierarchy(node.rightLeg, currentDepth + 1, maxDepth)
    : null;

  return {
    id: node._id,
    userId: node.user ? node.user.userId : "VACANT",
    name: node.user ? node.user.name : "Empty Spot",
    referralCode: node.user ? node.user.referralCode : "",
    position: node.position || "ROOT",
    rank: node.rank || "BRONZE",
    leftVolume: node.leftVolume || 0,
    rightVolume: node.rightVolume || 0,
    carriedLeftVolume:
      node.carriedLeftVolume !== undefined
        ? node.carriedLeftVolume
        : node.leftVolume || 0,
    carriedRightVolume:
      node.carriedRightVolume !== undefined
        ? node.carriedRightVolume
        : node.rightVolume || 0,
    leftLeg: leftChild,
    rightLeg: rightChild,
  };
};

/**
 * @route   GET /api/mlm/tree
 * @desc    Fetch binary tree hierarchy for logged-in user up to depth 20
 * @access  Private (Student / User / Affiliate)
 */
const getBinaryTree = catchAsync(async (req, res) => {
  const rootNode = await getOrCreateMLMNode(req.user._id);
  const depth = req.query.depth ? parseInt(req.query.depth, 10) : 20;
  const treeData = await buildTreeHierarchy(rootNode._id, 1, depth);

  return sendSuccess(
    res,
    200,
    "Binary MLM tree hierarchy retrieved successfully.",
    {
      tree: treeData,
    },
  );
});

/**
 * @route   GET /api/mlm/stats
 * @desc    Fetch affiliate dashboard stats (leg volumes, carry forward, matching bonus, capping, deductions, referral link)
 * @access  Private (Student / User / Affiliate)
 */
const getAffiliateStats = catchAsync(async (req, res) => {
  const node = await getOrCreateMLMNode(req.user._id);

  const metrics = await getUserWalletMetrics(req.user._id, req.user.role);

  // Fetch dynamic MLM config configured by admin
  const config = await MLMConfig.getConfig();
  const matchingRate =
    (config.matchingRatePercentage !== undefined
      ? config.matchingRatePercentage
      : 10) / 100;
  const dailyCappingLimit = config.dailyCappingLimit || 25000;
  const adminFeePct =
    (config.adminFeePercentage !== undefined ? config.adminFeePercentage : 5) /
    100;
  const tdsPct =
    (config.tdsPercentage !== undefined ? config.tdsPercentage : 5) / 100;

  // Count direct referrals sponsored by this user
  const directReferralsCount = await User.countDocuments({
    referredBy: req.user.referralCode,
  });

  // Carry Forward PV Logic
  const carriedLeftPV =
    node.carriedLeftVolume !== undefined
      ? node.carriedLeftVolume
      : node.leftVolume || 0;
  const carriedRightPV =
    node.carriedRightVolume !== undefined
      ? node.carriedRightVolume
      : node.rightVolume || 0;

  // 1:1 Pair Matching on Weaker Leg
  const matchedPV = Math.min(carriedLeftPV, carriedRightPV);
  const grossMatchingBonus = Math.round(matchedPV * matchingRate);

  // Financial Rules & Deductions
  const cappedGrossBonus = Math.min(grossMatchingBonus, dailyCappingLimit);
  const isCapped = grossMatchingBonus > dailyCappingLimit;

  const adminFee = Math.round(cappedGrossBonus * adminFeePct);
  const tdsDeduction = Math.round(cappedGrossBonus * tdsPct);
  const netPayableBonus = cappedGrossBonus - adminFee - tdsDeduction;

  const hostOrigin =
    req.headers.origin ||
    (req.headers.referer
      ? new URL(req.headers.referer).origin
      : "http://localhost:3000");
  const referralLink = `${hostOrigin}/register?ref=${req.user.referralCode || req.user.userId}`;

  return sendSuccess(res, 200, "Affiliate stats retrieved successfully.", {
    stats: {
      userId: req.user.userId,
      referralCode: req.user.referralCode,
      referralLink,
      rank: node.rank,
      placementPreference: node.placementPreference,
      leftVolume: node.leftVolume,
      rightVolume: node.rightVolume,
      carriedLeftPV,
      carriedRightPV,
      totalVolume: node.leftVolume + node.rightVolume,
      matchedPV,
      grossMatchingBonus,
      dailyCappingLimit,
      cappedGrossBonus,
      isCapped,
      adminFee,
      tdsDeduction,
      netPayableBonus,
      totalMatchedVolume: node.totalMatchedVolume || 0,
      totalEarnings: node.totalEarnings || 0,
      lastPayoutDate: node.lastPayoutDate || null,
      directReferralsCount,
      withdrawableBalance: metrics.withdrawableBalance,
      config: {
        perReferralPV: config.perReferralPV,
        directReferralBonus: config.directReferralBonus,
        matchingRatePercentage: config.matchingRatePercentage,
        dailyCappingLimit: config.dailyCappingLimit,
        adminFeePercentage: config.adminFeePercentage,
        tdsPercentage: config.tdsPercentage,
      },
    },
  });
});

/**
 * @route   PUT /api/mlm/preference
 * @desc    Update leg placement preference (AUTO, LEFT, RIGHT)
 * @access  Private (Student / User / Affiliate)
 */
const updatePlacementPreference = catchAsync(async (req, res) => {
  const { placementPreference } = req.body;
  const node = await getOrCreateMLMNode(req.user._id);

  node.placementPreference = placementPreference;
  await node.save();

  return sendSuccess(
    res,
    200,
    `Leg placement preference updated to '${placementPreference}'.`,
    {
      placementPreference: node.placementPreference,
    },
  );
});

/**
 * @route   POST /api/mlm/payout/execute
 * @desc    Execute Binary MLM Payout Settlement Cycle (Admin only)
 *          Calculates 1:1 pair matching, applies ₹25k capping limit, deducts 5% Admin + 5% TDS,
 *          credits net payout to user's wallet, flushes matched PV, and rolls over carry-forward volume.
 * @access  Private (Super Admin)
 */
const executeBinaryPayoutSettlement = catchAsync(async (req, res) => {
  // Fetch dynamic MLM config configured by admin
  const config = await MLMConfig.getConfig();
  const matchingRate =
    (config.matchingRatePercentage !== undefined
      ? config.matchingRatePercentage
      : 10) / 100;
  const dailyCappingLimit = config.dailyCappingLimit || 25000;
  const adminFeePct =
    (config.adminFeePercentage !== undefined ? config.adminFeePercentage : 5) /
    100;
  const tdsPct =
    (config.tdsPercentage !== undefined ? config.tdsPercentage : 5) / 100;

  // Find all MLM nodes that have matched volume on carried legs
  const allNodes = await MLMNode.find({}).populate("user");
  const payoutResults = [];

  for (const node of allNodes) {
    if (!node.user) continue;

    const carriedLeft =
      node.carriedLeftVolume !== undefined
        ? node.carriedLeftVolume
        : node.leftVolume || 0;
    const carriedRight =
      node.carriedRightVolume !== undefined
        ? node.carriedRightVolume
        : node.rightVolume || 0;

    const matchedPV = Math.min(carriedLeft, carriedRight);
    if (matchedPV <= 0) continue; // Skip if no pairs matched

    const grossBonus = Math.round(matchedPV * matchingRate);
    const cappedGrossBonus = Math.min(grossBonus, dailyCappingLimit);

    const adminFee = Math.round(cappedGrossBonus * adminFeePct);
    const tdsDeduction = Math.round(cappedGrossBonus * tdsPct);
    const netPayout = cappedGrossBonus - adminFee - tdsDeduction;

    const carriedLeftAfter = carriedLeft - matchedPV;
    const carriedRightAfter = carriedRight - matchedPV;

    // 1. Update MLM Node carry forward and totals
    node.carriedLeftVolume = carriedLeftAfter;
    node.carriedRightVolume = carriedRightAfter;
    node.totalMatchedVolume = (node.totalMatchedVolume || 0) + matchedPV;
    node.totalEarnings = (node.totalEarnings || 0) + netPayout;
    node.lastPayoutDate = new Date();
    await node.save();

    // 2. Credit User Wallet
    let wallet = await Wallet.findOne({ user: node.user._id });
    if (!wallet) {
      wallet = await Wallet.create({ user: node.user._id, balance: 0 });
    }
    wallet.balance += netPayout;
    await wallet.save();

    // 3. Create Transaction Record
    await Transaction.create({
      wallet: wallet._id,
      user: node.user._id,
      amount: netPayout,
      type: "CREDIT",
      category: "AFFILIATE_COMMISSION",
      status: "SUCCESS",
      description: `Binary MLM Matching Bonus Payout (Matched: ${matchedPV} PV, Net: ₹${netPayout})`,
    });

    // 4. Create Audit Log Payout Record
    const payoutRecord = await MlmPayout.create({
      user: node.user._id,
      mlmNode: node._id,
      cycleDate: new Date(),
      matchedVolume: matchedPV,
      matchingRatePercentage: config.matchingRatePercentage,
      grossBonus,
      cappingLimit: dailyCappingLimit,
      cappedGrossBonus,
      adminFee,
      tdsDeduction,
      netPayout,
      carriedLeftAfter,
      carriedRightAfter,
      status: "PAID",
    });

    payoutResults.push({
      userId: node.user.userId,
      name: node.user.name,
      matchedPV,
      grossBonus,
      cappedGrossBonus,
      adminFee,
      tdsDeduction,
      netPayout,
      carriedLeftAfter,
      carriedRightAfter,
      payoutId: payoutRecord._id,
    });
  }

  return sendSuccess(
    res,
    200,
    `Binary MLM Payout Settlement completed successfully. ${payoutResults.length} accounts credited.`,
    {
      processedCount: payoutResults.length,
      payoutResults,
    },
  );
});

/**
 * @route   GET /api/mlm/payout/history
 * @desc    Fetch past binary payout statements for logged-in user or admin
 * @access  Private (Student / User / Affiliate / Admin)
 */
const getPayoutHistory = catchAsync(async (req, res) => {
  const query = req.user.role === "ADMIN" ? {} : { user: req.user._id };
  const history = await MlmPayout.find(query)
    .populate("user", "name userId email mobile")
    .sort({ cycleDate: -1 })
    .lean();

  return sendSuccess(
    res,
    200,
    "Binary MLM payout history retrieved successfully.",
    {
      count: history.length,
      history,
    },
  );
});

/**
 * @route   GET /api/mlm/statement
 * @desc    MLM statement: member joins, direct bonus, binary bonus, withdrawals
 *          Query: page, limit, from, to, type (ALL|JOIN|DIRECT|BINARY|WITHDRAWAL)
 */
const getMlmStatement = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 20));
  const type = (req.query.type || "ALL").toUpperCase();
  const fmt = (n) => Number(n || 0).toLocaleString("en-IN");

  const me = await getOrCreateMLMNode(userId);
  const config = await MLMConfig.getConfig();
  const pv = config.perReferralPV || 100;

  const [payouts, directTxns, members, withdrawals] = await Promise.all([
    MlmPayout.find({ user: userId }).lean(),
    Transaction.find({
      user: userId,
      type: "CREDIT",
      category: "AFFILIATE_COMMISSION",
      status: "SUCCESS",
      description: /^Direct Referral/i,
    }).lean(),
    MLMNode.find({ ancestors: me._id })
      .populate("user", "name userId lastLoginAt")
      .populate("sponsor", "name userId")
      .sort({ createdAt: 1 })
      .lean(),
    WithdrawalRequest.find({ user: userId }).lean(),
  ]);

  const ledger = [];

  // 1) Member joins (no money, only PV)
  const idSet = new Set();
  members.forEach((m) =>
    (m.ancestors || []).forEach((a) => idSet.add(String(a))),
  );
  const upNodes = await MLMNode.find({ _id: { $in: [...idSet] } })
    .populate("user", "name userId")
    .lean();
  const nodeMap = {};
  upNodes.forEach((n) => (nodeMap[String(n._id)] = n));
  const leftId = me.leftLeg ? String(me.leftLeg) : null;
  const rightId = me.rightLeg ? String(me.rightLeg) : null;

  members.forEach((m) => {
    const anc = (m.ancestors || []).map(String);
    const idx = anc.indexOf(String(me._id));
    const childOfMe = anc[idx + 1] || String(m._id);
    const leg =
      childOfMe === leftId ? "Left" : childOfMe === rightId ? "Right" : "-";
    const parentNode = nodeMap[anc[anc.length - 1]];
    const parentLabel = parentNode?.user
      ? `${parentNode.user.name} (${parentNode.user.userId})`
      : "Vacant";
    const isDirect = m.sponsor && String(m.sponsor._id) === String(userId);

    const lines = [
      `${isDirect ? "Direct" : "Spillover"} · Under ${parentLabel} · +${fmt(pv)} PV`,
    ];
    if (m.user?.lastLoginAt) {
      lines.push(
        `Last login: ${new Date(m.user.lastLoginAt).toLocaleString("en-IN")}`,
      );
    }

    ledger.push({
      id: String(m._id),
      date: m.createdAt,
      type: "MEMBER_JOIN",
      typeLabel: `Joined · ${leg}`,
      title: `${m.user?.name || "New member"} (${m.user?.userId || "-"})`,
      explanation: lines,
      pv,
      amount: 0,
    });
  });

  // 2) Direct referral bonus
  directTxns.forEach((t) => {
    ledger.push({
      id: String(t._id),
      date: t.createdAt,
      type: "DIRECT_REFERRAL",
      typeLabel: "Direct Bonus",
      title: `Direct referral bonus ₹${fmt(t.amount)}`,
      explanation: [
        `New member joined with your referral code · ₹${fmt(t.amount)} credited (no fee/TDS)`,
      ],
      pv: 0,
      amount: t.amount || 0,
    });
  });

  // 3) Binary matching bonus
  payouts.forEach((p) => {
    const matched = p.matchedVolume || 0;
    const leftBefore = (p.carriedLeftAfter || 0) + matched;
    const rightBefore = (p.carriedRightAfter || 0) + matched;
    const gross = p.grossBonus || 0;
    const isCapped = gross > (p.cappingLimit || 0);

    ledger.push({
      id: String(p._id),
      date: p.cycleDate,
      type: "BINARY_BONUS",
      typeLabel: "Binary Bonus",
      title: `${fmt(matched)} PV matched · Net ₹${fmt(p.netPayout)}`,
      explanation: [
        `Left ${fmt(leftBefore)} | Right ${fmt(rightBefore)} → matched ${fmt(matched)} PV × ${p.matchingRatePercentage}% = ₹${fmt(gross)}${isCapped ? ` (capped at ₹${fmt(p.cappingLimit)})` : ""}`,
        `Admin fee ₹${fmt(p.adminFee)} + TDS ₹${fmt(p.tdsDeduction)} deducted · Carry forward: Left ${fmt(p.carriedLeftAfter)} | Right ${fmt(p.carriedRightAfter)}`,
      ],
      pv: matched,
      amount: p.netPayout || 0,
    });
  });

  // 4) Withdrawals (negative while PENDING/APPROVED, no effect when REJECTED/CANCELLED)
  withdrawals.forEach((w) => {
    const counts = w.status === "PENDING" || w.status === "APPROVED";
    const via =
      w.payoutMethod === "BANK"
        ? `Bank ••••${String(w.bankDetails?.accountNumber || "").slice(-4)}`
        : `UPI ${w.upiDetails?.upiId || ""}`;
    const note =
      w.status === "APPROVED"
        ? `Paid${w.utrNumber ? ` · UTR ${w.utrNumber}` : ""}`
        : w.status === "PENDING"
          ? "Awaiting admin approval"
          : w.status === "REJECTED"
            ? `Rejected${w.rejectionReason ? ` · ${w.rejectionReason}` : ""} · Refunded`
            : "Cancelled · Refunded";

    ledger.push({
      id: String(w._id),
      date: w.createdAt,
      type: "WITHDRAWAL",
      typeLabel: `Withdrawal · ${w.status}`,
      title: `₹${fmt(w.amount)} via ${via}`,
      explanation: [note],
      pv: 0,
      amount: counts ? -(w.amount || 0) : 0,
    });
  });

  // Filters
  const typeMap = {
    BINARY: "BINARY_BONUS",
    DIRECT: "DIRECT_REFERRAL",
    JOIN: "MEMBER_JOIN",
    WITHDRAWAL: "WITHDRAWAL",
  };
  let from = null;
  let to = null;
  if (req.query.from && !isNaN(new Date(req.query.from)))
    from = new Date(req.query.from);
  if (req.query.to && !isNaN(new Date(req.query.to))) {
    to = new Date(req.query.to);
    to.setHours(23, 59, 59, 999);
  }
  const filtered = ledger
    .filter((e) => {
      if (typeMap[type] && e.type !== typeMap[type]) return false;
      const d = new Date(e.date);
      if (from && d < from) return false;
      if (to && d > to) return false;
      return true;
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const summary = {
    totalProfit: filtered
      .filter((e) => e.amount > 0)
      .reduce((s, e) => s + e.amount, 0),
    binaryTotal: filtered
      .filter((e) => e.type === "BINARY_BONUS")
      .reduce((s, e) => s + e.amount, 0),
    directTotal: filtered
      .filter((e) => e.type === "DIRECT_REFERRAL")
      .reduce((s, e) => s + e.amount, 0),
    withdrawn: filtered
      .filter((e) => e.type === "WITHDRAWAL")
      .reduce((s, e) => s + Math.abs(e.amount), 0),
    totalMembers: members.length,
    totalCount: filtered.length,
  };

  return sendSuccess(res, 200, "MLM statement retrieved successfully.", {
    summary,
    entries: filtered.slice((page - 1) * limit, page * limit),
    pagination: {
      page,
      limit,
      totalRecords: filtered.length,
      totalPages: Math.max(1, Math.ceil(filtered.length / limit)),
    },
  });
});

/**
 * @route   GET /api/mlm/config
 * @desc    Fetch current active dynamic MLM configuration (PV, matching rate, capping, deductions)
 * @access  Private (All authenticated users)
 */
const getMLMConfig = catchAsync(async (req, res) => {
  const config = await MLMConfig.getConfig();
  return sendSuccess(res, 200, "MLM configuration retrieved successfully.", {
    config,
  });
});

/**
 * @route   PUT /api/mlm/config
 * @desc    Update dynamic MLM configuration (PV, matching rate, capping, deductions)
 * @access  Private (Admin only)
 */
const updateMLMConfig = catchAsync(async (req, res) => {
  const {
    perReferralPV,
    directReferralBonus,
    matchingRatePercentage,
    dailyCappingLimit,
    adminFeePercentage,
    tdsPercentage,
  } = req.body;

  let config = await MLMConfig.findOne({ isActive: true }).sort({
    createdAt: -1,
  });
  if (!config) {
    config = new MLMConfig();
  }

  if (perReferralPV !== undefined)
    config.perReferralPV = Math.max(1, Number(perReferralPV));
  if (directReferralBonus !== undefined)
    config.directReferralBonus = Math.max(0, Number(directReferralBonus));
  if (matchingRatePercentage !== undefined)
    config.matchingRatePercentage = Math.max(
      0,
      Math.min(100, Number(matchingRatePercentage)),
    );
  if (dailyCappingLimit !== undefined)
    config.dailyCappingLimit = Math.max(100, Number(dailyCappingLimit));
  if (adminFeePercentage !== undefined)
    config.adminFeePercentage = Math.max(
      0,
      Math.min(50, Number(adminFeePercentage)),
    );
  if (tdsPercentage !== undefined)
    config.tdsPercentage = Math.max(0, Math.min(50, Number(tdsPercentage)));
  config.updatedBy = req.user._id;

  await config.save();

  return sendSuccess(
    res,
    200,
    "MLM & Referral configuration updated successfully.",
    {
      config,
    },
  );
});

/**
 * @route   POST /api/mlm/seed
 * @desc    Seed a sample 7-node binary network tree for testing
 * @access  Public / Admin
 */
const seedMLMNetwork = catchAsync(async (req, res) => {
  let rootUser =
    req.user && req.user._id ? req.user : await User.findOne({}).lean();
  if (!rootUser) {
    throw new AppError(
      "No user found. Create an admin account before seeding the MLM network.",
      400,
    );
  }
  const rootNode = await getOrCreateMLMNode(rootUser._id);

  rootNode.leftVolume = 12500;
  rootNode.rightVolume = 9800;
  rootNode.carriedLeftVolume = 12500;
  rootNode.carriedRightVolume = 9800;
  rootNode.rank = "GOLD";
  await rootNode.save();

  return sendSuccess(
    res,
    201,
    "Binary MLM sample network tree seeded successfully.",
    {
      rootNode,
    },
  );
});

module.exports = {
  getBinaryTree,
  getAffiliateStats,
  updatePlacementPreference,
  executeBinaryPayoutSettlement,
  getPayoutHistory,
  getMLMConfig,
  updateMLMConfig,
  seedMLMNetwork,
  getMlmStatement,
};
