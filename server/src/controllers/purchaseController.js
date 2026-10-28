const mongoose = require('mongoose');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const Purchase = require('../models/Purchase');
const Course = require('../models/Course');
const Ebook = require('../models/Ebook');
const catchAsync = require('../utils/catchAsync');
const { sendSuccess } = require('../utils/apiResponse');
const AppError = require('../utils/appError');

/**
 * @route   POST /api/purchases/course
 * @desc    Purchase course using student digital wallet balance
 * @access  Private (Student / User)
 */
const purchaseCourseWithWallet = catchAsync(async (req, res, next) => {
  const { courseId } = req.body;

  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    return next(new AppError('Invalid courseId format.', 400));
  }

  const course = await Course.findById(courseId).lean();
  if (!course) {
    return next(new AppError('Target course not found.', 404));
  }

  // Check if user has already purchased/enrolled in this course
  const existingPurchase = await Purchase.findOne({
    user: req.user._id,
    course: course._id,
    validUntil: { $gt: new Date() }
  }).lean();

  if (existingPurchase) {
    return next(new AppError('You are already enrolled in this course.', 400));
  }

  // Get user wallet & verify balance
  let wallet = await Wallet.findOne({ user: req.user._id });
  if (!wallet) {
    wallet = await Wallet.create({ user: req.user._id, balance: 0 });
  }

  if (wallet.balance < course.price) {
    return next(
      new AppError(
        `Insufficient wallet balance (₹${wallet.balance}). Course price is ₹${course.price}. Please top up your wallet.`,
        400
      )
    );
  }

  // Perform atomic wallet debit
  wallet.balance -= course.price;
  await wallet.save();

  // Create Purchase record (1 year validity)
  const purchase = await Purchase.create({
    user: req.user._id,
    itemType: 'COURSE',
    course: course._id,
    amountPaid: course.price,
    paymentMethod: 'WALLET'
  });

  // Log DEBIT Transaction
  await Transaction.create({
    wallet: wallet._id,
    user: req.user._id,
    amount: course.price,
    type: 'DEBIT',
    category: 'COURSE_PURCHASE',
    status: 'SUCCESS',
    description: `Purchased Course: ${course.title}`
  });

  return sendSuccess(res, 200, `Successfully enrolled in '${course.title}'.`, {
    purchase,
    newBalance: wallet.balance
  });
});

/**
 * @route   POST /api/purchases/ebook
 * @desc    Purchase digital e-book using student digital wallet balance
 * @access  Private (Student / User)
 */
const purchaseEbookWithWallet = catchAsync(async (req, res, next) => {
  const { ebookId } = req.body;

  if (!mongoose.Types.ObjectId.isValid(ebookId)) {
    return next(new AppError('Invalid ebookId format.', 400));
  }

  const ebook = await Ebook.findById(ebookId).select('+fullPdfUrl').lean();
  if (!ebook) {
    return next(new AppError('Digital e-book not found.', 404));
  }

  // Check if user has already purchased this e-book
  const existingPurchase = await Purchase.findOne({
    user: req.user._id,
    ebook: ebook._id
  }).lean();

  if (existingPurchase) {
    return sendSuccess(res, 200, 'You already own this e-book.', {
      purchase: existingPurchase,
      fullPdfUrl: ebook.fullPdfUrl
    });
  }

  // Get user wallet & verify balance
  let wallet = await Wallet.findOne({ user: req.user._id });
  if (!wallet) {
    wallet = await Wallet.create({ user: req.user._id, balance: 0 });
  }

  if (wallet.balance < ebook.price) {
    return next(
      new AppError(
        `Insufficient wallet balance (₹${wallet.balance}). E-book price is ₹${ebook.price}. Please top up your wallet.`,
        400
      )
    );
  }

  // Perform atomic wallet debit
  wallet.balance -= ebook.price;
  await wallet.save();

  // Create Purchase record
  const purchase = await Purchase.create({
    user: req.user._id,
    itemType: 'EBOOK',
    ebook: ebook._id,
    amountPaid: ebook.price,
    paymentMethod: 'WALLET'
  });

  // Log DEBIT Transaction
  await Transaction.create({
    wallet: wallet._id,
    user: req.user._id,
    amount: ebook.price,
    type: 'DEBIT',
    category: 'EBOOK_PURCHASE',
    status: 'SUCCESS',
    description: `Purchased E-Book: ${ebook.title}`
  });

  return sendSuccess(res, 200, `Successfully purchased e-book '${ebook.title}'.`, {
    purchase,
    newBalance: wallet.balance,
    fullPdfUrl: ebook.fullPdfUrl
  });
});

/**
 * @route   GET /api/purchases/my-courses
 * @desc    Fetch all active enrolled courses for current student
 * @access  Private (Student / User)
 */
const getMyCourses = catchAsync(async (req, res) => {
  const purchases = await Purchase.find({
    user: req.user._id,
    itemType: 'COURSE',
    validUntil: { $gt: new Date() }
  })
    .populate({
      path: 'course',
      select: 'title thumbnail boardOrGrade stateCode category price'
    })
    .sort({ createdAt: -1 })
    .lean();

  const courses = purchases.map((p) => p.course).filter(Boolean);

  return sendSuccess(res, 200, 'Enrolled courses retrieved successfully.', {
    count: courses.length,
    courses
  });
});

/**
 * @route   GET /api/purchases/my-ebooks
 * @desc    Fetch all purchased e-books with unlocked full PDF links
 * @access  Private (Student / User)
 */
const getMyEbooks = catchAsync(async (req, res) => {
  const purchases = await Purchase.find({
    user: req.user._id,
    itemType: 'EBOOK'
  })
    .populate({
      path: 'ebook',
      select: 'title author coverImage pages samplePdfUrl +fullPdfUrl'
    })
    .sort({ createdAt: -1 })
    .lean();

  const ebooks = purchases.map((p) => p.ebook).filter(Boolean);

  return sendSuccess(res, 200, 'Purchased e-books retrieved successfully.', {
    count: ebooks.length,
    ebooks
  });
});

module.exports = {
  purchaseCourseWithWallet,
  purchaseEbookWithWallet,
  getMyCourses,
  getMyEbooks
};
