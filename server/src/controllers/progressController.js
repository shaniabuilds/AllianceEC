const mongoose = require('mongoose');
const UserProgress = require('../models/UserProgress');
const LearningAsset = require('../models/LearningAsset');
const catchAsync = require('../utils/catchAsync');
const { sendSuccess } = require('../utils/apiResponse');
const AppError = require('../utils/appError');

/**
 * @route   GET /api/progress/:subjectId
 * @desc    Get user completion progress & completed asset IDs for a subject
 * @access  Private (Student / User)
 */
const getUserProgress = catchAsync(async (req, res, next) => {
  const { subjectId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(subjectId)) {
    return next(new AppError('Invalid subjectId format.', 400));
  }

  let progress = await UserProgress.findOne({
    user: req.user._id,
    subject: subjectId
  }).lean();

  if (!progress) {
    progress = {
      user: req.user._id,
      subject: subjectId,
      completedAssets: [],
      progressPercentage: 0
    };
  }

  return sendSuccess(res, 200, 'User subject progress fetched successfully.', {
    progress
  });
});

/**
 * @route   POST /api/progress/complete-asset
 * @desc    Mark a learning asset as completed and recalculate subject progress percentage
 * @access  Private (Student / User)
 */
const completeAsset = catchAsync(async (req, res, next) => {
  const { subjectId, assetId } = req.body;

  if (!mongoose.Types.ObjectId.isValid(subjectId) || !mongoose.Types.ObjectId.isValid(assetId)) {
    return next(new AppError('Invalid subjectId or assetId format.', 400));
  }

  let progress = await UserProgress.findOne({
    user: req.user._id,
    subject: subjectId
  });

  if (!progress) {
    progress = new UserProgress({
      user: req.user._id,
      subject: subjectId,
      completedAssets: [],
      progressPercentage: 0
    });
  }

  const assetObjectId = new mongoose.Types.ObjectId(assetId);
  const alreadyCompleted = progress.completedAssets.some((id) => id.equals(assetObjectId));

  if (!alreadyCompleted) {
    progress.completedAssets.push(assetObjectId);
  }

  // Calculate total assets in subject to compute progress percentage
  const totalSubjectAssets = await LearningAsset.countDocuments({ subject: subjectId });
  const completedCount = progress.completedAssets.length;
  progress.progressPercentage =
    totalSubjectAssets > 0 ? Math.min(100, Math.round((completedCount / totalSubjectAssets) * 100)) : 100;

  await progress.save();

  return sendSuccess(res, 200, 'Asset marked as completed successfully.', {
    progressPercentage: progress.progressPercentage,
    completedAssetsCount: completedCount,
    totalSubjectAssets,
    progress
  });
});

module.exports = {
  getUserProgress,
  completeAsset
};
