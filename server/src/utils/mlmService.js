const MLMNode = require('../models/MLMNode');
const MLMConfig = require('../models/MLMConfig');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');

/**
 * Gets or initializes an MLM node for a user
 */
const getOrCreateMLMNode = async (userId, sponsorUserId = null) => {
  let node = await MLMNode.findOne({ user: userId });
  if (!node) {
    node = await MLMNode.create({
      user: userId,
      sponsor: sponsorUserId || undefined,
      ancestors: []
    });
  }
  return node;
};

/**
 * Traverses extreme left leg to find next available left spot
 */
const findAvailableLeftSpot = async (startNodeId) => {
  let current = await MLMNode.findById(startNodeId);
  while (current.leftLeg) {
    current = await MLMNode.findById(current.leftLeg);
  }
  return { parentNode: current, position: 'LEFT' };
};

/**
 * Traverses extreme right leg to find next available right spot
 */
const findAvailableRightSpot = async (startNodeId) => {
  let current = await MLMNode.findById(startNodeId);
  while (current.rightLeg) {
    current = await MLMNode.findById(current.rightLeg);
  }
  return { parentNode: current, position: 'RIGHT' };
};

/**
 * Finds available spot using Auto-Balance algorithm (weaker volume leg)
 */
const findAutoBalanceSpot = async (sponsorNode) => {
  if (!sponsorNode.leftLeg) {
    return { parentNode: sponsorNode, position: 'LEFT' };
  }
  if (!sponsorNode.rightLeg) {
    return { parentNode: sponsorNode, position: 'RIGHT' };
  }

  // If both direct legs are filled, place in weaker volume leg
  if (sponsorNode.leftVolume <= sponsorNode.rightVolume) {
    return await findAvailableLeftSpot(sponsorNode.leftLeg);
  } else {
    return await findAvailableRightSpot(sponsorNode.rightLeg);
  }
};

/**
 * Propagates volume up the ancestor chain
 */
const propagateVolumeToAncestors = async (newNodeId, volumeAmount = 100) => {
  const newNode = await MLMNode.findById(newNodeId);
  if (!newNode || !newNode.ancestors || newNode.ancestors.length === 0) return;

  let currentChildId = newNode._id;

  for (let i = newNode.ancestors.length - 1; i >= 0; i--) {
    const ancestorId = newNode.ancestors[i];
    const ancestor = await MLMNode.findById(ancestorId);
    if (!ancestor) continue;

    if (ancestor.leftLeg && ancestor.leftLeg.equals(currentChildId)) {
      ancestor.leftVolume += volumeAmount;
      ancestor.carriedLeftVolume = (ancestor.carriedLeftVolume || 0) + volumeAmount;
    } else if (ancestor.rightLeg && ancestor.rightLeg.equals(currentChildId)) {
      ancestor.rightVolume += volumeAmount;
      ancestor.carriedRightVolume = (ancestor.carriedRightVolume || 0) + volumeAmount;
    }

    // Rank evaluation update
    const totalVolume = ancestor.leftVolume + ancestor.rightVolume;
    if (totalVolume >= 50000) ancestor.rank = 'CROWN_AMBASSADOR';
    else if (totalVolume >= 20000) ancestor.rank = 'DIAMOND';
    else if (totalVolume >= 5000) ancestor.rank = 'GOLD';
    else if (totalVolume >= 1000) ancestor.rank = 'SILVER';

    await ancestor.save();
    currentChildId = ancestor._id;
  }
};

/**
 * Places a newly registered user into the sponsor's binary tree
 */
const placeNodeInBinaryTree = async (sponsorUserId, newUserId) => {
  const sponsorNode = await getOrCreateMLMNode(sponsorUserId);
  const existingNewNode = await MLMNode.findOne({ user: newUserId });
  if (existingNewNode && existingNewNode.parent) {
    return existingNewNode; // Already placed in tree
  }

  let spot;
  const pref = sponsorNode.placementPreference || 'AUTO';

  if (pref === 'LEFT') {
    spot = await findAvailableLeftSpot(sponsorNode._id);
  } else if (pref === 'RIGHT') {
    spot = await findAvailableRightSpot(sponsorNode._id);
  } else {
    spot = await findAutoBalanceSpot(sponsorNode);
  }

  const { parentNode, position } = spot;
  const ancestorIds = [...(parentNode.ancestors || []), parentNode._id];

  let newNode;
  if (existingNewNode) {
    existingNewNode.sponsor = sponsorUserId;
    existingNewNode.parent = parentNode._id;
    existingNewNode.position = position;
    existingNewNode.ancestors = ancestorIds;
    newNode = await existingNewNode.save();
  } else {
    newNode = await MLMNode.create({
      user: newUserId,
      sponsor: sponsorUserId,
      parent: parentNode._id,
      position,
      ancestors: ancestorIds
    });
  }

  if (position === 'LEFT') {
    parentNode.leftLeg = newNode._id;
  } else {
    parentNode.rightLeg = newNode._id;
  }
  await parentNode.save();

  // Fetch dynamic MLM config configured by admin
  const config = await MLMConfig.getConfig();
  const volumeToAdd = config.perReferralPV || 100;

  // Propagate signup business volume up the upline
  await propagateVolumeToAncestors(newNode._id, volumeToAdd);

  // If direct referral cash bonus is configured (> 0), credit sponsor's wallet
  if (config.directReferralBonus && config.directReferralBonus > 0 && sponsorUserId) {
    try {
      let sponsorWallet = await Wallet.findOne({ user: sponsorUserId });
      if (!sponsorWallet) {
        sponsorWallet = await Wallet.create({ user: sponsorUserId, balance: 0 });
      }
      sponsorWallet.balance += config.directReferralBonus;
      await sponsorWallet.save();

      await Transaction.create({
        wallet: sponsorWallet._id,
        user: sponsorUserId,
        amount: config.directReferralBonus,
        type: 'CREDIT',
        category: 'AFFILIATE_COMMISSION',
        status: 'SUCCESS',
        description: `Direct Referral Cash Bonus for onboarding new user (₹${config.directReferralBonus})`
      });
    } catch (err) {
      console.error('Direct referral bonus credit error:', err);
    }
  }

  return newNode;
};

module.exports = {
  getOrCreateMLMNode,
  placeNodeInBinaryTree,
  propagateVolumeToAncestors
};
