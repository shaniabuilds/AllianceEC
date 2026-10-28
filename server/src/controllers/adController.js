const Ad = require('../models/Ad');
const catchAsync = require('../utils/catchAsync');
const { sendSuccess } = require('../utils/apiResponse');
const AppError = require('../utils/appError');

/**
 * @route   GET /api/ads
 * @desc    Fetch all active ads for student web and mobile app
 * @access  Public
 */
const getActiveAds = catchAsync(async (req, res) => {
  const query = { isActive: true };
  if (req.query.type) {
    query.type = req.query.type.toUpperCase();
  }
  if (req.query.placement) {
    query.placement = req.query.placement.toUpperCase();
  }

  const ads = await Ad.find(query)
    .sort({ priority: -1, createdAt: -1 })
    .lean();

  return sendSuccess(res, 200, 'Active ads retrieved successfully.', {
    count: ads.length,
    ads
  });
});

/**
 * @route   GET /api/ads/admin/all
 * @desc    Fetch all ads (active & inactive) with metrics for Super Admin
 * @access  Private (Super Admin)
 */
const getAllAdsAdmin = catchAsync(async (req, res) => {
  const [totalAds, activeAds, imageAds, videoAds, ads] = await Promise.all([
    Ad.countDocuments(),
    Ad.countDocuments({ isActive: true }),
    Ad.countDocuments({ type: 'IMAGE' }),
    Ad.countDocuments({ type: 'VIDEO' }),
    Ad.find().sort({ createdAt: -1 }).lean()
  ]);

  return sendSuccess(res, 200, 'All ads retrieved for admin inspection.', {
    stats: {
      totalAds,
      activeAds,
      inactiveAds: totalAds - activeAds,
      imageAds,
      videoAds
    },
    count: ads.length,
    ads
  });
});

/**
 * @route   POST /api/ads
 * @desc    Create a new advertisement (Image or Video)
 * @access  Private (Super Admin)
 */
const createAd = catchAsync(async (req, res, next) => {
  const { title, type, mediaUrl, targetUrl, description, placement, isActive, priority } = req.body;

  if (!title || !title.trim()) {
    return next(new AppError('Ad title is required.', 400));
  }
  if (!mediaUrl || !mediaUrl.trim()) {
    return next(new AppError('Ad media URL is required.', 400));
  }

  const adType = type ? type.toUpperCase() : 'IMAGE';
  if (!['IMAGE', 'VIDEO'].includes(adType)) {
    return next(new AppError("Invalid ad type. Must be 'IMAGE' or 'VIDEO'.", 400));
  }

  const newAd = await Ad.create({
    title: title.trim(),
    type: adType,
    mediaUrl: mediaUrl.trim(),
    targetUrl: targetUrl ? targetUrl.trim() : '',
    description: description ? description.trim() : '',
    placement: placement || 'HOME_HERO',
    isActive: isActive !== undefined ? isActive : true,
    priority: priority ? parseInt(priority, 10) : 0
  });

  return sendSuccess(res, 201, 'Advertisement created successfully.', {
    ad: newAd
  });
});

/**
 * @route   PUT /api/ads/:id
 * @desc    Update advertisement details
 * @access  Private (Super Admin)
 */
const updateAd = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { title, type, mediaUrl, targetUrl, description, placement, isActive, priority } = req.body;

  const ad = await Ad.findById(id);
  if (!ad) {
    return next(new AppError('Advertisement not found.', 404));
  }

  if (title !== undefined) ad.title = title.trim();
  if (type !== undefined) ad.type = type.toUpperCase();
  if (mediaUrl !== undefined) ad.mediaUrl = mediaUrl.trim();
  if (targetUrl !== undefined) ad.targetUrl = targetUrl.trim();
  if (description !== undefined) ad.description = description.trim();
  if (placement !== undefined) ad.placement = placement;
  if (isActive !== undefined) ad.isActive = Boolean(isActive);
  if (priority !== undefined) ad.priority = parseInt(priority, 10);

  await ad.save();

  return sendSuccess(res, 200, 'Advertisement updated successfully.', {
    ad
  });
});

/**
 * @route   PATCH /api/ads/:id/toggle-active
 * @desc    Toggle advertisement active/paused status
 * @access  Private (Super Admin)
 */
const toggleAdActive = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const ad = await Ad.findById(id);
  if (!ad) {
    return next(new AppError('Advertisement not found.', 404));
  }

  ad.isActive = !ad.isActive;
  await ad.save();

  return sendSuccess(res, 200, `Ad '${ad.title}' is now ${ad.isActive ? 'ACTIVE' : 'PAUSED'}.`, {
    ad
  });
});

/**
 * @route   DELETE /api/ads/:id
 * @desc    Delete advertisement
 * @access  Private (Super Admin)
 */
const deleteAd = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const ad = await Ad.findByIdAndDelete(id);
  if (!ad) {
    return next(new AppError('Advertisement not found.', 404));
  }

  return sendSuccess(res, 200, `Advertisement '${ad.title}' deleted successfully.`, {
    deletedId: id
  });
});

module.exports = {
  getActiveAds,
  getAllAdsAdmin,
  createAd,
  updateAd,
  toggleAdActive,
  deleteAd
};
