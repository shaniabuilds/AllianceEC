const KYC = require('../models/KYC');
const User = require('../models/User');
const catchAsync = require('../utils/catchAsync');
const { uploadToCloudinary } = require('../utils/cloudinary');
const { sendSuccess, sendPaginatedSuccess } = require('../utils/apiResponse');
const AppError = require('../utils/appError');

/**
 * @route   POST /api/kyc/submit
 * @desc    Submit Aadhaar / PAN HD image scan (up to 2MB) uploaded to Cloudinary
 * @access  Private (Student/User)
 */
const submitKYC = catchAsync(async (req, res, next) => {
  const { documentType, documentNumber } = req.body;
  let documentScanUrl = req.body.documentScanUrl;
  let cloudinaryPublicId = null;

  if (req.file) {
    const cloudinaryResult = await uploadToCloudinary(req.file.buffer, 'kyc_scans');
    documentScanUrl = cloudinaryResult.secure_url;
    cloudinaryPublicId = cloudinaryResult.public_id;
  } else if (!documentScanUrl) {
    return next(new AppError('HD image document scan file (up to 2MB) is required.', 400));
  }

  let kycRecord = await KYC.findOne({ user: req.user._id });

  if (kycRecord) {
    if (kycRecord.status === 'VERIFIED') {
      return next(new AppError('Your KYC has already been verified and approved.', 400));
    }
    kycRecord.documentType = documentType;
    kycRecord.documentNumber = documentNumber;
    kycRecord.documentScanUrl = documentScanUrl;
    if (cloudinaryPublicId) kycRecord.cloudinaryPublicId = cloudinaryPublicId;
    kycRecord.status = 'PENDING';
    kycRecord.rejectionReason = undefined;
    await kycRecord.save();
  } else {
    kycRecord = await KYC.create({
      user: req.user._id,
      documentType,
      documentNumber,
      documentScanUrl,
      cloudinaryPublicId,
      status: 'PENDING'
    });
  }

  await User.findByIdAndUpdate(req.user._id, { kycStatus: 'PENDING' });

  return sendSuccess(res, 200, 'KYC document scan uploaded to Cloudinary successfully. Verification pending.', {
    kycRecord
  });
});

/**
 * @route   GET /api/kyc/status
 * @desc    Check KYC verification status for current user
 * @access  Private (Student/User)
 */
const getKYCStatus = catchAsync(async (req, res) => {
  const kycRecord = await KYC.findOne({ user: req.user._id })
    .populate('user', 'name mobile userId kycStatus')
    .lean();

  return sendSuccess(res, 200, 'KYC status retrieved successfully.', {
    kycStatus: req.user.kycStatus,
    kycRecord: kycRecord || null
  });
});

/**
 * @route   GET /api/kyc/admin/all
 * @desc    Get paginated KYC verification queue for Super Admin
 * @access  Private (Super Admin)
 */
const getAllKYCRequests = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 50;
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.status) {
    filter.status = req.query.status;
  }

  const [totalRecords, requests] = await Promise.all([
    KYC.countDocuments(filter),
    KYC.find(filter)
      .populate('user', 'name mobile userId stateCode kycStatus role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
  ]);

  return sendPaginatedSuccess(
    res,
    200,
    'KYC queue requests fetched successfully.',
    requests,
    page,
    limit,
    totalRecords
  );
});

/**
 * @route   PUT /api/kyc/admin/verify/:id
 * @desc    Approve or Reject student KYC verification request
 * @access  Private (Super Admin)
 */
const verifyKYCRequest = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { status, rejectionReason } = req.body;

  const kycRecord = await KYC.findById(id);
  if (!kycRecord) {
    return next(new AppError('KYC record not found.', 404));
  }

  const targetStatus = (status === 'APPROVED' || status === 'VERIFIED') ? 'VERIFIED' : 'REJECTED';
  kycRecord.status = targetStatus;
  if (targetStatus === 'REJECTED') {
    kycRecord.rejectionReason = rejectionReason || 'Aadhaar/PAN document scan details did not match government database.';
  } else {
    kycRecord.rejectionReason = undefined;
  }

  kycRecord.verifiedBy = req.user._id;
  kycRecord.verifiedAt = new Date();
  await kycRecord.save();

  await User.findByIdAndUpdate(kycRecord.user, { kycStatus: targetStatus });

  return sendSuccess(res, 200, `KYC request ${targetStatus.toLowerCase()} successfully.`, {
    kycRecord
  });
});

module.exports = {
  submitKYC,
  getKYCStatus,
  getAllKYCRequests,
  verifyKYCRequest
};
