const mongoose = require('mongoose');
const LearningAsset = require('../models/LearningAsset');
const Chapter = require('../models/Chapter');
const Subject = require('../models/Subject');
const catchAsync = require('../utils/catchAsync');
const { sendSuccess } = require('../utils/apiResponse');
const AppError = require('../utils/appError');

/**
 * @route   GET /api/assets
 * @desc    Fetch ordered multimodal learning assets under a chapter
 * @access  Public
 */
const getAssetsByChapter = catchAsync(async (req, res, next) => {
  const { chapterId } = req.query;

  if (!chapterId || !mongoose.Types.ObjectId.isValid(chapterId)) {
    return next(new AppError('Please provide a valid chapterId query parameter.', 400));
  }

  const assets = await LearningAsset.find({ chapter: chapterId })
    .sort({ sequence: 1 })
    .lean();

  return sendSuccess(res, 200, 'Chapter learning assets fetched successfully.', {
    count: assets.length,
    assets
  });
});

/**
 * @route   POST /api/assets
 * @desc    Publish a new Multimodal Learning Asset (Level 6: DRM Video, PDF, Lesson Text, MCQ Test)
 * @access  Private (Teacher / Educator / Admin)
 */
const createAsset = catchAsync(async (req, res, next) => {
  const {
    title,
    assetType,
    chapterId,
    subjectId,
    contentUrl,
    textContent,
    durationSeconds,
    sequence,
    isFreePreview
  } = req.body;

  if (!mongoose.Types.ObjectId.isValid(chapterId) || !mongoose.Types.ObjectId.isValid(subjectId)) {
    return next(new AppError('Invalid chapterId or subjectId format.', 400));
  }

  const chapterObj = await Chapter.findById(chapterId);
  if (!chapterObj) {
    return next(new AppError('Parent chapter not found.', 404));
  }

  const newAsset = await LearningAsset.create({
    title,
    assetType,
    chapter: chapterObj._id,
    subject: subjectId,
    contentUrl,
    textContent,
    durationSeconds: durationSeconds || 0,
    sequence: sequence || 1,
    isFreePreview: isFreePreview || false
  });

  // Increment total assets count in parent Chapter
  chapterObj.totalAssets = (chapterObj.totalAssets || 0) + 1;
  await chapterObj.save();

  return sendSuccess(res, 201, 'Learning asset published successfully.', { asset: newAsset });
});

module.exports = {
  getAssetsByChapter,
  createAsset
};
