const User = require("../models/User");
const KYC = require("../models/KYC");
const Course = require("../models/Course");
const Category = require("../models/Category");
const Transaction = require("../models/Transaction");
const Wallet = require("../models/Wallet");
const Purchase = require("../models/Purchase");
const MLMNode = require("../models/MLMNode");
const catchAsync = require("../utils/catchAsync");
const { uploadToCloudinary } = require("../utils/cloudinary");
const { sendSuccess, sendPaginatedSuccess } = require("../utils/apiResponse");
const AppError = require("../utils/appError");
const { parseRichContents } = require("../utils/sanitizeRichContent");
const { calcTeacherRoyalty } = require("../utils/walletMetrics");

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const REVENUE_CATEGORIES = ["COURSE_PURCHASE", "EBOOK_PURCHASE"];

// Shared date-range builder (from/to are YYYY-MM-DD strings)
const buildDateRange = (from, to) => {
  const range = {};
  if (from) {
    const d = new Date(from);
    if (!isNaN(d)) range.$gte = d;
  }
  if (to) {
    const d = new Date(to);
    if (!isNaN(d)) {
      d.setHours(23, 59, 59, 999);
      range.$lte = d;
    }
  }
  return Object.keys(range).length ? range : null;
};

/**
 * @route   GET /api/admin/stats
 * @desc    Fetch platform-wide overview metrics for Super Admin dashboard
 * @access  Private (Admin Only)
 */
const getAdminOverviewStats = catchAsync(async (req, res) => {
  const [
    totalUsers,
    totalStudents,
    totalTeachers,
    totalAffiliates,
    totalMlmNodes,
    totalPendingKyc,
    totalCourses,
    revenueAgg,
    topupAgg,
  ] = await Promise.all([
    User.countDocuments({}),
    User.countDocuments({ role: "STUDENT" }),
    User.countDocuments({ role: "TEACHER" }),
    User.countDocuments({ referredBy: { $exists: true, $ne: null, $ne: "" } }),
    MLMNode.countDocuments({}),
    KYC.countDocuments({ status: "PENDING" }),
    Course.countDocuments({ active: true }),
    Transaction.aggregate([
      {
        $match: {
          category: { $in: ["COURSE_PURCHASE", "EBOOK_PURCHASE"] },
          status: "SUCCESS",
        },
      },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    Transaction.aggregate([
      { $match: { category: "TOPUP", status: "SUCCESS" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
  ]);

  const totalRevenue = revenueAgg.length > 0 ? revenueAgg[0].total : 0;
  const totalTopupVolume = topupAgg.length > 0 ? topupAgg[0].total : 0;

  return sendSuccess(res, 200, "Admin overview stats retrieved successfully.", {
    stats: {
      totalUsers,
      totalStudents,
      totalTeachers,
      totalAffiliates: totalMlmNodes || totalAffiliates,
      totalMlmNodes,
      totalPendingKyc,
      totalCourses,
      totalRevenue,
      totalTopupVolume,
    },
  });
});

/**
 * @route   GET /api/admin/users
 * @desc    Paginated user management list with search & role filters
 * @access  Private (Admin Only)
 */
const getAllUsers = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20; // Default 20 items per page
  const skip = (page - 1) * limit;

  const andConditions = [];

  if (req.query.role && req.query.role.toUpperCase() !== "ALL") {
    andConditions.push({ role: req.query.role.toUpperCase() });
  }

  if (req.query.stateCode && req.query.stateCode.toUpperCase() !== "ALL") {
    andConditions.push({ stateCode: req.query.stateCode.toUpperCase() });
  }

  if (req.query.kycStatus && req.query.kycStatus.toUpperCase() !== "ALL") {
    andConditions.push({ kycStatus: req.query.kycStatus.toUpperCase() });
  }

  if (
    req.query.boardOrGrade &&
    req.query.boardOrGrade.toUpperCase() !== "ALL"
  ) {
    const boardRegex = new RegExp(req.query.boardOrGrade, "i");
    andConditions.push({
      $or: [
        { "learningPreference.boardOrGrade": boardRegex },
        { "learningPreference.subCategoryTitle": boardRegex },
      ],
    });
  }

  if (req.query.subjectName && req.query.subjectName.toUpperCase() !== "ALL") {
    const subjRegex = new RegExp(req.query.subjectName, "i");
    andConditions.push({
      $or: [
        { "learningPreference.subjectName": subjRegex },
        { taughtSubjects: subjRegex },
      ],
    });
  }

  if (req.query.search) {
    const searchRegex = new RegExp(req.query.search, "i");
    andConditions.push({
      $or: [
        { name: searchRegex },
        { mobile: searchRegex },
        { email: searchRegex },
        { userId: searchRegex },
      ],
    });
  }

  const filter = andConditions.length > 0 ? { $and: andConditions } : {};

  // Dynamic sorting option
  let sortOption = { createdAt: -1 };
  if (req.query.sortBy) {
    const sortBy = req.query.sortBy;
    if (sortBy === "name") sortOption = { name: 1 };
    else if (sortBy === "-name") sortOption = { name: -1 };
    else if (sortBy === "role") sortOption = { role: 1, createdAt: -1 };
    else if (sortBy === "kycStatus")
      sortOption = { kycStatus: 1, createdAt: -1 };
    else if (sortBy === "createdAt") sortOption = { createdAt: 1 };
    else if (sortBy === "-createdAt") sortOption = { createdAt: -1 };
  }

  const [totalRecords, users] = await Promise.all([
    User.countDocuments(filter),
    User.find(filter)
      .select("-password -otp -otpExpires")
      .populate("selectedState", "code name")
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  // Attach enriched course enrollment & teaching data for Students and Teachers
  const enrichedUsers = await Promise.all(
    users.map(async (usr) => {
      if (usr.role === "TEACHER") {
        const courses = await Course.find({ instructor: usr._id })
          .select(
            "title subjectName boardOrGrade price totalStudents active thumbnail",
          )
          .lean();
        const subjects = Array.from(
          new Set(courses.map((c) => c.subjectName).filter(Boolean)),
        );
        return {
          ...usr,
          coursesTaught: courses,
          taughtSubjects:
            subjects.length > 0 ? subjects : usr.taughtSubjects || [],
          coursesCount: courses.length,
        };
      } else if (usr.role === "STUDENT") {
        const purchases = await Purchase.find({
          user: usr._id,
          itemType: "COURSE",
        })
          .populate("course", "title subjectName boardOrGrade price thumbnail")
          .lean();
        const enrolled = purchases.map((p) => p.course).filter(Boolean);
        return {
          ...usr,
          enrolledCourses: enrolled,
          enrolledCount: enrolled.length,
        };
      }
      return usr;
    }),
  );

  return sendPaginatedSuccess(
    res,
    200,
    "Users list retrieved successfully.",
    enrichedUsers,
    page,
    limit,
    totalRecords,
  );
});

/**
 * @route   PUT /api/admin/users/:userId/role-status
 * @desc    Update user role or toggle account active/blocked status
 * @access  Private (Admin Only)
 */
const updateUserRoleStatus = catchAsync(async (req, res, next) => {
  const { userId } = req.params;
  const { role, isMobileVerified, isBlocked, status } = req.body;

  const user = await User.findById(userId);
  if (!user) {
    return next(new AppError("Target user account not found.", 404));
  }

  if (role) {
    user.role = role.toUpperCase();
  }

  if (typeof isMobileVerified === "boolean") {
    user.isMobileVerified = isMobileVerified;
  }

  if (typeof isBlocked === "boolean") {
    user.isBlocked = isBlocked;
    user.status = isBlocked ? "BLOCKED" : "ACTIVE";
  } else if (status) {
    user.status = status.toUpperCase();
    user.isBlocked = user.status === "BLOCKED";
  }

  await user.save({ validateBeforeSave: false });

  return sendSuccess(
    res,
    200,
    "User role and account status updated successfully.",
    {
      user: {
        id: user._id,
        name: user.name,
        mobile: user.mobile,
        role: user.role,
        status: user.status,
        isBlocked: user.isBlocked,
        isMobileVerified: user.isMobileVerified,
      },
    },
  );
});

/**
 * @route   GET /api/admin/payouts
 * @desc    Fetch pending payouts queue for affiliate commissions & teacher royalties
 * @access  Private (Admin Only)
 */
const getPendingPayouts = catchAsync(async (req, res) => {
  const pendingTransactions = await Transaction.find({
    category: { $in: ["ROYALTY_PAYOUT", "AFFILIATE_COMMISSION"] },
    status: "PENDING",
  })
    .populate("user", "name mobile userId role")
    .sort({ createdAt: -1 })
    .lean();

  return sendSuccess(
    res,
    200,
    "Pending payouts queue retrieved successfully.",
    {
      count: pendingTransactions.length,
      payouts: pendingTransactions,
    },
  );
});

/**
 * @route   POST /api/admin/payouts/:transactionId/approve
 * @desc    Approve and release pending payout to user wallet
 * @access  Private (Admin Only)
 */
const approvePayout = catchAsync(async (req, res, next) => {
  const { transactionId } = req.params;

  const txn = await Transaction.findById(transactionId);
  if (!txn) {
    return next(new AppError("Payout transaction record not found.", 404));
  }

  if (txn.status === "SUCCESS") {
    return next(
      new AppError(
        "This payout transaction has already been approved and released.",
        400,
      ),
    );
  }

  txn.status = "SUCCESS";
  await txn.save();

  // Credit user wallet balance
  let wallet = await Wallet.findOne({ user: txn.user });
  if (!wallet) {
    wallet = await Wallet.create({ user: txn.user, balance: 0 });
  }

  wallet.balance += txn.amount;
  await wallet.save();

  return sendSuccess(
    res,
    200,
    "Payout approved and credited to user wallet successfully.",
    {
      transaction: txn,
      updatedWalletBalance: wallet.balance,
    },
  );
});

/**
 * @route   GET /api/admin/courses
 * @desc    Fetch platform courses for Super Admin management (with pagination, search & sorting)
 * @access  Private (Admin Only)
 */
const getAllCourses = catchAsync(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 20));
  const skip = (page - 1) * limit;

  const filter = {};

  if (req.query.courseMode && req.query.courseMode !== "ALL") {
    filter.courseMode = req.query.courseMode;
  }

  if (req.query.stateCode && req.query.stateCode !== "ALL") {
    filter.stateCode = req.query.stateCode.toUpperCase();
  }

  if (req.query.search) {
    const searchRegex = new RegExp(req.query.search.trim(), "i");
    filter.$or = [
      { title: searchRegex },
      { description: searchRegex },
      { boardOrGrade: searchRegex },
      { subjectName: searchRegex },
      { subCategoryTitle: searchRegex },
    ];
  }

  // Dynamic sorting option
  let sortOption = { createdAt: -1 };
  if (req.query.sortBy) {
    const sortBy = req.query.sortBy;
    if (sortBy === "title") sortOption = { title: 1 };
    else if (sortBy === "-title") sortOption = { title: -1 };
    else if (sortBy === "price") sortOption = { price: 1 };
    else if (sortBy === "-price") sortOption = { price: -1 };
    else if (sortBy === "createdAt") sortOption = { createdAt: 1 };
    else if (sortBy === "-createdAt") sortOption = { createdAt: -1 };
    else if (sortBy === "courseMode")
      sortOption = { courseMode: 1, createdAt: -1 };
  }

  const [totalRecords, courses] = await Promise.all([
    Course.countDocuments(filter),
    Course.find(filter)
      .populate("category", "name slug")
      .populate("instructor", "name email mobile userId")
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  const courseIds = courses.map((c) => c._id);
  const purchaseCounts = await Purchase.aggregate([
    {
      $match: {
        course: { $in: courseIds },
        $or: [{ status: "SUCCESS" }, { status: { $exists: false } }],
      },
    },
    {
      $group: {
        _id: "$course",
        count: { $sum: 1 },
      },
    },
  ]);

  const countMap = {};
  purchaseCounts.forEach((p) => {
    countMap[String(p._id)] = p.count;
  });

  const coursesWithCounts = courses.map((c) => ({
    ...c,
    totalStudents: countMap[String(c._id)] || 0,
    totalEnrolled: countMap[String(c._id)] || 0,
  }));

  return sendPaginatedSuccess(
    res,
    200,
    "Platform courses retrieved successfully.",
    coursesWithCounts,
    page,
    limit,
    totalRecords,
  );
});

/**
 * @route   PUT /api/admin/courses/:courseId/toggle-active
 * @desc    Toggle course active/published status by Super Admin
 * @access  Private (Admin Only)
 */
const toggleCourseStatus = catchAsync(async (req, res, next) => {
  const { courseId } = req.params;
  const course = await Course.findById(courseId);
  if (!course) {
    return next(new AppError("Course not found.", 404));
  }

  course.active =
    typeof req.body.active === "boolean" ? req.body.active : !course.active;
  await course.save();

  return sendSuccess(
    res,
    200,
    `Course ${course.active ? "published" : "unpublished"} successfully.`,
    {
      course,
    },
  );
});

/**
 * @route   POST /api/admin/courses
 * @desc    Create a new course directly by Super Admin
 * @access  Private (Admin Only)
 */
const createAdminCourse = catchAsync(async (req, res, next) => {
  const {
    title,
    description,
    price,
    originalPrice,
    stateCode,
    boardOrGrade,
    categoryId,
    subCategory,
    subCategoryTitle,
    stream,
    subjectName,
    subjects,
    validityDays,
    courseMode,
    liveMeetingUrl,
    lectureVideoUrl,
    demoVideoUrl,
    liveSchedule,
    ebookTitle,
    ebookPdfUrl,
    syllabusTopics,
    inclusions,
    curriculum,
    studyMaterials,
    mockTests,
    richContents,
    thumbnail,
  } = req.body;

  if (!title || !title.trim()) {
    return next(new AppError("Course title is required.", 400));
  }

  // Parse subjects if passed as array, JSON string, or comma-separated
  let parsedSubjects = [];
  if (subjects) {
    try {
      parsedSubjects =
        typeof subjects === "string" ? JSON.parse(subjects) : subjects;
    } catch {
      parsedSubjects =
        typeof subjects === "string"
          ? subjects.split(",").map((s) => s.trim())
          : Array.isArray(subjects)
            ? subjects
            : [subjects];
    }
  } else if (subjectName) {
    parsedSubjects =
      typeof subjectName === "string"
        ? subjectName
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [subjectName];
  }
  if (!Array.isArray(parsedSubjects)) {
    parsedSubjects = [parsedSubjects];
  }
  parsedSubjects = parsedSubjects.map((s) => String(s).trim()).filter(Boolean);

  const finalSubjectName =
    parsedSubjects.length > 0
      ? parsedSubjects.join(", ")
      : subjectName && String(subjectName).trim()
        ? String(subjectName).trim()
        : "All Subjects";

  const finalSubjects =
    parsedSubjects.length > 0 ? parsedSubjects : [finalSubjectName];

  let finalThumbnail = thumbnail
    ? thumbnail.trim()
    : "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800";

  if (req.file) {
    const cloudinaryResult = await uploadToCloudinary(
      req.file.buffer,
      "course_thumbnails",
    );
    finalThumbnail = cloudinaryResult.secure_url;
  }

  // Parse topics and inclusions if passed as JSON strings
  let parsedTopics = [];
  if (syllabusTopics) {
    try {
      parsedTopics =
        typeof syllabusTopics === "string"
          ? JSON.parse(syllabusTopics)
          : syllabusTopics;
    } catch {
      parsedTopics = Array.isArray(syllabusTopics)
        ? syllabusTopics
        : [syllabusTopics];
    }
  }

  let parsedMaterials = [];
  if (studyMaterials) {
    try {
      parsedMaterials =
        typeof studyMaterials === "string"
          ? JSON.parse(studyMaterials)
          : studyMaterials;
    } catch {
      parsedMaterials = Array.isArray(studyMaterials) ? studyMaterials : [];
    }
  }

  let parsedMockTests = [];
  if (mockTests) {
    try {
      parsedMockTests =
        typeof mockTests === "string" ? JSON.parse(mockTests) : mockTests;
    } catch {
      parsedMockTests = Array.isArray(mockTests) ? mockTests : [];
    }
  }

  let parsedInclusions = {
    totalLectures: 0,
    totalHours: 0,
    totalEbooks: 0,
    totalLiveSessions: 0,
    totalMockTests: 0,
    hasCertificate: true,
    hasDoubtSupport: true,
    hasDownloadableNotes: true,
    hasLifetimeAccess: false,
  };
  if (inclusions) {
    try {
      const incObj =
        typeof inclusions === "string" ? JSON.parse(inclusions) : inclusions;
      parsedInclusions = { ...parsedInclusions, ...incObj };
    } catch {
      // fallback
    }
  }

  let parsedCurriculum = [];
  if (curriculum) {
    try {
      parsedCurriculum =
        typeof curriculum === "string" ? JSON.parse(curriculum) : curriculum;
    } catch {
      // fallback
    }
  }

  // Bulletproof Category Resolution: Guarantee valid ObjectId for MongoDB Schema
  const mongoose = require("mongoose");
  let categoryObj = null;

  if (categoryId) {
    if (mongoose.Types.ObjectId.isValid(categoryId)) {
      categoryObj = await Category.findById(categoryId).lean();
    }
    if (!categoryObj) {
      categoryObj = await Category.findOne({
        code: String(categoryId).trim().toUpperCase(),
      }).lean();
    }
    if (!categoryObj) {
      categoryObj = await Category.findOne({
        $or: [
          { code: new RegExp(String(categoryId).trim(), "i") },
          { title: new RegExp(String(categoryId).trim(), "i") },
        ],
      }).lean();
    }
  }

  if (!categoryObj) {
    categoryObj = await Category.findOne({}).lean();
  }

  if (!categoryObj) {
    categoryObj = await Category.create({
      code: "SCHOOL_K12",
      title: "I. School Education (Class 1 to 12)",
      description: "Default School Category",
    });
  }

  const course = await Course.create({
    title: title.trim(),
    description: description ? description.trim() : "",
    price: Number(price) || 0,
    originalPrice: Number(originalPrice) || Number(price) || 0,
    stateCode: stateCode ? stateCode.toUpperCase() : "GLOBAL",
    boardOrGrade: boardOrGrade || subCategoryTitle || "General Batch",
    subCategory: subCategory || "",
    subCategoryTitle: subCategoryTitle || "",
    stream: stream || "",
    subjectName: finalSubjectName,
    subjects: finalSubjects,
    category: categoryObj._id,
    instructor: req.user._id,
    validityDays: Number(validityDays) || 365,
    courseMode: courseMode || "RECORDED_VIDEO",
    liveMeetingUrl: liveMeetingUrl ? liveMeetingUrl.trim() : "",
    lectureVideoUrl: lectureVideoUrl ? lectureVideoUrl.trim() : "",
    demoVideoUrl: demoVideoUrl ? demoVideoUrl.trim() : "",
    liveSchedule: liveSchedule ? liveSchedule.trim() : "",
    ebookTitle: ebookTitle ? ebookTitle.trim() : "",
    ebookPdfUrl: ebookPdfUrl ? ebookPdfUrl.trim() : "",
    syllabusTopics: Array.isArray(parsedTopics) ? parsedTopics : [],
    inclusions: parsedInclusions,
    curriculum: Array.isArray(parsedCurriculum) ? parsedCurriculum : [],
    studyMaterials: Array.isArray(parsedMaterials) ? parsedMaterials : [],
    mockTests: Array.isArray(parsedMockTests) ? parsedMockTests : [],
    richContents: parseRichContents(richContents),
    thumbnail: finalThumbnail,
    active: true,
    isFeatured: true,
  });

  return sendSuccess(
    res,
    201,
    "New course published successfully by Super Admin.",
    {
      course,
    },
  );
});

/**
 * @route   POST /api/admin/courses/bulk
 * @desc    Bulk create courses from Excel/CSV parsed JSON by Super Admin
 * @access  Private (Admin Only)
 */
const bulkCreateAdminCourses = catchAsync(async (req, res, next) => {
  const { courses } = req.body;

  if (!Array.isArray(courses) || courses.length === 0) {
    return next(
      new AppError("Courses array is required for bulk upload.", 400),
    );
  }

  const createdCourses = [];
  const errors = [];

  const defaultCategory = await Category.findOne({}).lean();
  const fallbackCatId = defaultCategory ? defaultCategory._id : null;

  for (let i = 0; i < courses.length; i++) {
    const item = courses[i];
    const rowNum = i + 1;

    if (!item.title || !String(item.title).trim()) {
      errors.push({ row: rowNum, error: "Title is required." });
      continue;
    }

    let categoryObj = null;
    const catSearch = item.categoryCode || item.categoryId || item.category;
    if (catSearch) {
      const searchStr = String(catSearch).trim();
      const mongoose = require("mongoose");
      if (mongoose.Types.ObjectId.isValid(searchStr)) {
        categoryObj = await Category.findById(searchStr).lean();
      }
      if (!categoryObj) {
        categoryObj = await Category.findOne({
          code: searchStr.toUpperCase(),
        }).lean();
      }
      if (!categoryObj) {
        categoryObj = await Category.findOne({
          $or: [
            { code: new RegExp(searchStr, "i") },
            { title: new RegExp(searchStr, "i") },
          ],
        }).lean();
      }
    }

    const catId = categoryObj ? categoryObj._id : fallbackCatId;
    if (!catId) {
      errors.push({ row: rowNum, error: "Valid Category is required." });
      continue;
    }

    const finalThumbnail =
      item.thumbnail && String(item.thumbnail).trim()
        ? String(item.thumbnail).trim()
        : "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800";

    try {
      const created = await Course.create({
        title: String(item.title).trim(),
        description: item.description ? String(item.description).trim() : "",
        price: Number(item.price) || 0,
        originalPrice: Number(item.originalPrice) || Number(item.price) || 0,
        stateCode: item.stateCode
          ? String(item.stateCode).toUpperCase().trim()
          : "GLOBAL",
        boardOrGrade:
          item.boardOrGrade || item.subCategoryTitle || "General Batch",
        subCategory: item.subCategory ? String(item.subCategory).trim() : "",
        subCategoryTitle: item.subCategoryTitle
          ? String(item.subCategoryTitle).trim()
          : item.boardOrGrade || "",
        stream: item.stream ? String(item.stream).trim() : "",
        subjectName: item.subjectName
          ? String(item.subjectName).trim()
          : "All Subjects",
        subjects:
          Array.isArray(item.subjects) && item.subjects.length > 0
            ? item.subjects.map((s) => String(s).trim()).filter(Boolean)
            : item.subjectName
              ? String(item.subjectName)
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean)
              : ["All Subjects"],
        category: catId,
        instructor: req.user._id,
        validityDays: Number(item.validityDays) || 365,
        courseMode: ["LIVE_ONLINE", "RECORDED_VIDEO", "HYBRID"].includes(
          item.courseMode,
        )
          ? item.courseMode
          : "RECORDED_VIDEO",
        liveMeetingUrl: item.liveMeetingUrl
          ? String(item.liveMeetingUrl).trim()
          : "",
        lectureVideoUrl: item.lectureVideoUrl
          ? String(item.lectureVideoUrl).trim()
          : "",
        thumbnail: finalThumbnail,
        active: true,
        isFeatured: true,
      });
      createdCourses.push(created);
    } catch (err) {
      errors.push({ row: rowNum, error: err.message });
    }
  }

  return sendSuccess(
    res,
    201,
    `${createdCourses.length} courses created successfully in bulk.`,
    {
      totalRequested: courses.length,
      createdCount: createdCourses.length,
      failedCount: errors.length,
      createdCourses,
      errors,
    },
  );
});

/**
 * @route   POST /api/admin/users/bulk
 * @desc    Bulk create users (Students & Teachers) from Excel/CSV parsed JSON by Super Admin
 * @access  Private (Admin Only)
 */
const bulkCreateAdminUsers = catchAsync(async (req, res, next) => {
  const { users } = req.body;

  if (!Array.isArray(users) || users.length === 0) {
    return next(new AppError("Users array is required for bulk upload.", 400));
  }

  const createdUsers = [];
  const errors = [];

  for (let i = 0; i < users.length; i++) {
    const item = users[i];
    const rowNum = i + 1;

    const name = item.name ? String(item.name).trim() : "";
    const mobile = item.mobile
      ? String(item.mobile)
          .trim()
          .replace(/[^0-9]/g, "")
      : "";
    const roleStr = item.role
      ? String(item.role).trim().toUpperCase()
      : "STUDENT";
    const role = ["STUDENT", "TEACHER"].includes(roleStr) ? roleStr : "STUDENT";
    const email =
      item.email && String(item.email).trim()
        ? String(item.email).trim().toLowerCase()
        : undefined;
    const password =
      item.password && String(item.password).trim()
        ? String(item.password).trim()
        : "123456";

    if (!name) {
      errors.push({ row: rowNum, error: "Name is required." });
      continue;
    }

    if (!mobile || mobile.length !== 10) {
      errors.push({
        row: rowNum,
        error: `Invalid 10-digit mobile number (${item.mobile || "blank"}).`,
      });
      continue;
    }

    // Check existing user by mobile
    const existingMobile = await User.findOne({ mobile });
    if (existingMobile) {
      errors.push({
        row: rowNum,
        error: `Mobile number ${mobile} is already registered.`,
      });
      continue;
    }

    // Check existing user by email if provided
    if (email) {
      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        errors.push({
          row: rowNum,
          error: `Email address ${email} is already registered.`,
        });
        continue;
      }
    }

    const stateCode = item.stateCode
      ? String(item.stateCode).toUpperCase().trim()
      : "UP";
    const referredBy = item.referredBy
      ? String(item.referredBy).trim().toUpperCase()
      : "";

    const learningPreference = {
      stateCode: stateCode,
      categoryCode: item.categoryCode ? String(item.categoryCode).trim() : "",
      subCategory: item.subCategory ? String(item.subCategory).trim() : "",
      subCategoryTitle: item.subCategoryTitle || item.boardOrGrade || "",
      stream: item.stream ? String(item.stream).trim() : "",
      boardOrGrade: item.boardOrGrade
        ? String(item.boardOrGrade).trim()
        : "General Grade",
      subjectName: item.subjectName
        ? String(item.subjectName).trim()
        : "All Subjects",
      isPreferenceSet: true,
    };

    try {
      const userDoc = await User.create({
        name,
        mobile,
        email,
        password,
        role,
        stateCode,
        learningPreference,
        referredBy,
        isMobileVerified: true,
        isEmailVerified: !!email,
        status: "ACTIVE",
        isBlocked: false,
      });
      createdUsers.push(userDoc);
    } catch (err) {
      errors.push({ row: rowNum, error: err.message });
    }
  }

  return sendSuccess(
    res,
    201,
    `${createdUsers.length} users created successfully in bulk.`,
    {
      totalRequested: users.length,
      createdCount: createdUsers.length,
      failedCount: errors.length,
      createdUsers,
      errors,
    },
  );
});

/**
 * @route   POST /api/admin/upload-thumbnail
 * @desc    Upload course thumbnail image file (up to 2MB) directly to Cloudinary
 * @access  Private (Admin Only)
 */
const uploadCourseThumbnail = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(
      new AppError("Thumbnail image file (up to 2MB) is required.", 400),
    );
  }

  const cloudinaryResult = await uploadToCloudinary(
    req.file.buffer,
    "course_thumbnails",
  );
  return sendSuccess(
    res,
    200,
    "Thumbnail image uploaded successfully to Cloudinary.",
    {
      thumbnailUrl: cloudinaryResult.secure_url,
    },
  );
});

/**
 * @route   POST /api/admin/upload-material
 * @desc    Upload course study material document (PDF, Word, PPT, Notes up to 25MB) directly to Cloudinary
 * @access  Private (Admin & Teacher)
 */
const uploadStudyMaterialDocument = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(
      new AppError(
        "Document file (PDF, DOC, DOCX, PPT, TXT, or Image up to 25MB) is required.",
        400,
      ),
    );
  }

  const originalName = req.file.originalname || "document.pdf";
  const ext = originalName.split(".").pop() || "pdf";

  const cloudinaryResult = await uploadToCloudinary(
    req.file.buffer,
    "course_study_materials",
    {
      originalName,
      ext,
    },
  );

  return sendSuccess(
    res,
    200,
    "Study material document uploaded successfully to Cloudinary.",
    {
      fileUrl: cloudinaryResult.secure_url,
      originalName,
      format: cloudinaryResult.format || ext,
      sizeBytes: req.file.size,
    },
  );
});

/**
 * @route   PUT /api/admin/courses/:id
 * @desc    Update existing course details by Admin
 * @access  Private (Admin Only)
 */
const updateAdminCourse = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const course = await Course.findById(id);
  if (!course) {
    return next(new AppError("Course batch not found.", 404));
  }

  const {
    title,
    description,
    price,
    originalPrice,
    stateCode,
    boardOrGrade,
    categoryId,
    subCategory,
    subCategoryTitle,
    stream,
    subjectName,
    subjects,
    validityDays,
    courseMode,
    liveMeetingUrl,
    lectureVideoUrl,
    demoVideoUrl,
    liveSchedule,
    ebookTitle,
    ebookPdfUrl,
    syllabusTopics,
    inclusions,
    curriculum,
    studyMaterials,
    mockTests,
    richContents,
    thumbnail,
  } = req.body;

  if (title) course.title = title.trim();
  if (description !== undefined) course.description = description.trim();
  if (price !== undefined) course.price = Number(price);
  if (originalPrice !== undefined) course.originalPrice = Number(originalPrice);
  if (stateCode) course.stateCode = stateCode.toUpperCase();
  if (boardOrGrade) course.boardOrGrade = boardOrGrade;
  if (subCategory) course.subCategory = subCategory;
  if (subCategoryTitle) course.subCategoryTitle = subCategoryTitle;
  if (stream !== undefined) course.stream = stream;

  if (subjects !== undefined) {
    let parsedSubjects = [];
    try {
      parsedSubjects =
        typeof subjects === "string" ? JSON.parse(subjects) : subjects;
    } catch {
      parsedSubjects =
        typeof subjects === "string"
          ? subjects.split(",").map((s) => s.trim())
          : Array.isArray(subjects)
            ? subjects
            : [subjects];
    }
    if (!Array.isArray(parsedSubjects)) {
      parsedSubjects = [parsedSubjects];
    }
    parsedSubjects = parsedSubjects
      .map((s) => String(s).trim())
      .filter(Boolean);
    course.subjects = parsedSubjects;
    if (parsedSubjects.length > 0) {
      course.subjectName = parsedSubjects.join(", ");
    } else if (subjectName) {
      course.subjectName = subjectName.trim();
      course.subjects = [subjectName.trim()];
    }
  } else if (subjectName !== undefined) {
    course.subjectName = subjectName ? subjectName.trim() : "All Subjects";
    course.subjects = subjectName
      ? subjectName
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];
  }
  if (validityDays) course.validityDays = Number(validityDays);
  if (courseMode) course.courseMode = courseMode;
  if (liveMeetingUrl !== undefined)
    course.liveMeetingUrl = liveMeetingUrl.trim();
  if (lectureVideoUrl !== undefined)
    course.lectureVideoUrl = lectureVideoUrl.trim();
  if (demoVideoUrl !== undefined) course.demoVideoUrl = demoVideoUrl.trim();
  if (liveSchedule !== undefined) course.liveSchedule = liveSchedule.trim();
  if (ebookTitle !== undefined) course.ebookTitle = ebookTitle.trim();
  if (ebookPdfUrl !== undefined) course.ebookPdfUrl = ebookPdfUrl.trim();
  if (thumbnail) course.thumbnail = thumbnail.trim();

  if (syllabusTopics !== undefined) {
    try {
      course.syllabusTopics =
        typeof syllabusTopics === "string"
          ? JSON.parse(syllabusTopics)
          : syllabusTopics;
    } catch {
      course.syllabusTopics = Array.isArray(syllabusTopics)
        ? syllabusTopics
        : [syllabusTopics];
    }
  }

  if (inclusions !== undefined) {
    try {
      const incObj =
        typeof inclusions === "string" ? JSON.parse(inclusions) : inclusions;
      course.inclusions = { ...course.inclusions, ...incObj };
    } catch {
      // fallback
    }
  }

  if (curriculum !== undefined) {
    try {
      course.curriculum =
        typeof curriculum === "string" ? JSON.parse(curriculum) : curriculum;
    } catch {
      // fallback
    }
  }

  if (studyMaterials !== undefined) {
    try {
      course.studyMaterials =
        typeof studyMaterials === "string"
          ? JSON.parse(studyMaterials)
          : studyMaterials;
    } catch {
      course.studyMaterials = Array.isArray(studyMaterials)
        ? studyMaterials
        : [];
    }
  }

  if (mockTests !== undefined) {
    try {
      course.mockTests =
        typeof mockTests === "string" ? JSON.parse(mockTests) : mockTests;
    } catch {
      course.mockTests = Array.isArray(mockTests) ? mockTests : [];
    }
  }

  if (richContents !== undefined) {
    course.richContents = parseRichContents(richContents);
  }

  if (categoryId) {
    const mongoose = require("mongoose");
    let categoryObj = null;
    if (mongoose.Types.ObjectId.isValid(categoryId)) {
      categoryObj = await Category.findById(categoryId).lean();
    }
    if (!categoryObj) {
      categoryObj = await Category.findOne({
        code: String(categoryId).trim().toUpperCase(),
      }).lean();
    }
    if (categoryObj) {
      course.category = categoryObj._id;
    }
  }

  await course.save();

  return sendSuccess(res, 200, "Course batch updated successfully by Admin.", {
    course,
  });
});

/**
 * @route   DELETE /api/admin/courses/:id
 * @desc    Delete course batch by Admin
 * @access  Private (Admin Only)
 */
const deleteAdminCourse = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const course = await Course.findById(id);
  if (!course) {
    return next(new AppError("Course batch not found.", 404));
  }

  await Course.findByIdAndDelete(id);

  return sendSuccess(
    res,
    200,
    "Course batch deleted successfully from platform.",
    {
      courseId: id,
    },
  );
});

/**
 * @route   GET /api/admin/users/analytics
 * @desc    Fetch server-side aggregated granular metrics for User Management
 *          (Student distribution by Board, Grade, Subject, State, KYC + Teacher distribution by Subject, Grade, Courses taught)
 * @access  Private (Admin Only)
 */
const getAdminGranularUserAnalytics = catchAsync(async (req, res) => {
  // 1. Student Distribution by Board/Category (State Board, CBSE, ICSE, PUC, Entrance, Jobs, etc.)
  const studentsByBoard = await User.aggregate([
    { $match: { role: "STUDENT" } },
    {
      $group: {
        _id: {
          $ifNull: [
            "$learningPreference.boardOrGrade",
            "General / State Board",
          ],
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
  ]);

  // 2. Student Distribution by Subject (Chemistry, Physics, Mathematics, Biology, General Studies, etc.)
  const studentsBySubject = await User.aggregate([
    { $match: { role: "STUDENT" } },
    {
      $group: {
        _id: { $ifNull: ["$learningPreference.subjectName", "All Subjects"] },
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
  ]);

  // 3. Student Distribution by State Region (KA, DL, MH, UP, TN, WB, etc.)
  const studentsByState = await User.aggregate([
    { $match: { role: "STUDENT" } },
    { $group: { _id: { $ifNull: ["$stateCode", "KA"] }, count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  // 4. Student Distribution by KYC Verification Status
  const studentsByKyc = await User.aggregate([
    { $match: { role: "STUDENT" } },
    {
      $group: {
        _id: { $ifNull: ["$kycStatus", "NOT_SUBMITTED"] },
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
  ]);

  // 5. Grade & Subject Matrix Breakdown (e.g. Class 12 Chemistry, Class 10 Science, NEET Biology)
  const gradeSubjectMatrix = await Course.aggregate([
    {
      $group: {
        _id: {
          boardOrGrade: "$boardOrGrade",
          subjectName: "$subjectName",
        },
        coursesCount: { $sum: 1 },
        totalStudentsEnrolled: { $sum: "$totalStudents" },
      },
    },
    { $sort: { totalStudentsEnrolled: -1 } },
  ]);

  // 6. Teacher Distribution by Taught Subject
  const teachersBySubject = await Course.aggregate([
    { $match: { active: true } },
    {
      $group: {
        _id: "$subjectName",
        teachersCount: { $addToSet: "$instructor" },
        coursesCount: { $sum: 1 },
        totalEnrolled: { $sum: "$totalStudents" },
      },
    },
    {
      $project: {
        _id: 1,
        teachersCount: { $size: "$teachersCount" },
        coursesCount: 1,
        totalEnrolled: 1,
      },
    },
    { $sort: { totalEnrolled: -1 } },
  ]);

  // 7. Teacher Distribution by Board / Grade Level Taught
  const teachersByGrade = await Course.aggregate([
    { $match: { active: true } },
    {
      $group: {
        _id: "$boardOrGrade",
        teachersCount: { $addToSet: "$instructor" },
        coursesCount: { $sum: 1 },
        totalEnrolled: { $sum: "$totalStudents" },
      },
    },
    {
      $project: {
        _id: 1,
        teachersCount: { $size: "$teachersCount" },
        coursesCount: 1,
        totalEnrolled: 1,
      },
    },
    { $sort: { totalEnrolled: -1 } },
  ]);

  // 8. Individual Teacher Matrix with Taught Subject, Taught Grade, Active Courses, and Enrolled Students
  const teachersMatrix = await User.aggregate([
    { $match: { role: "TEACHER" } },
    {
      $lookup: {
        from: "courses",
        localField: "_id",
        foreignField: "instructor",
        as: "coursesTaught",
      },
    },
    {
      $project: {
        _id: 1,
        userId: 1,
        name: 1,
        mobile: 1,
        email: 1,
        stateCode: 1,
        kycStatus: 1,
        createdAt: 1,
        coursesCount: { $size: "$coursesTaught" },
        taughtSubjects: { $setUnion: ["$coursesTaught.subjectName", []] },
        taughtGrades: { $setUnion: ["$coursesTaught.boardOrGrade", []] },
        totalStudentsEnrolled: { $sum: "$coursesTaught.totalStudents" },
        courses: {
          $map: {
            input: "$coursesTaught",
            as: "crs",
            in: {
              _id: "$$crs._id",
              title: "$$crs.title",
              price: "$$crs.price",
              totalStudents: "$$crs.totalStudents",
              boardOrGrade: "$$crs.boardOrGrade",
              subjectName: "$$crs.subjectName",
              active: "$$crs.active",
            },
          },
        },
      },
    },
    { $sort: { totalStudentsEnrolled: -1 } },
  ]);

  // 9. Interactive Grouped Student Preferences (Grouped by Category + Grade + Stream + Subject + State) with Full Server-Side Lookups
  const groupedStudentPreferences = await User.aggregate([
    { $match: { role: "STUDENT" } },
    {
      $lookup: {
        from: "purchases",
        localField: "_id",
        foreignField: "user",
        as: "studentPurchases",
      },
    },
    {
      $lookup: {
        from: "kycs",
        localField: "_id",
        foreignField: "user",
        as: "kycRecords",
      },
    },
    {
      $project: {
        _id: 1,
        userId: 1,
        name: 1,
        mobile: 1,
        email: 1,
        stateCode: 1,
        kycStatus: 1,
        learningPreference: 1,
        referralCode: 1,
        referredBy: 1,
        createdAt: 1,
        isMobileVerified: 1,
        isBlocked: 1,
        totalPurchasesCount: { $size: "$studentPurchases" },
        totalSpentAmount: { $sum: "$studentPurchases.price" },
        kycDocType: { $arrayElemAt: ["$kycRecords.documentType", 0] },
        kycDocNumber: { $arrayElemAt: ["$kycRecords.documentNumber", 0] },
      },
    },
    {
      $group: {
        _id: {
          categoryCode: {
            $ifNull: ["$learningPreference.categoryCode", "CAT-GENERAL"],
          },
          subCategoryTitle: {
            $ifNull: ["$learningPreference.subCategoryTitle", "General Stream"],
          },
          boardOrGrade: {
            $ifNull: [
              "$learningPreference.boardOrGrade",
              "General State Board",
            ],
          },
          subjectName: {
            $ifNull: ["$learningPreference.subjectName", "All Subjects"],
          },
          stream: { $ifNull: ["$learningPreference.stream", "General"] },
          stateCode: { $ifNull: ["$stateCode", "KA"] },
        },
        count: { $sum: 1 },
        totalGroupRevenue: { $sum: "$totalSpentAmount" },
        verifiedStudentsCount: {
          $sum: { $cond: [{ $eq: ["$kycStatus", "VERIFIED"] }, 1, 0] },
        },
        students: {
          $push: {
            _id: "$_id",
            userId: "$userId",
            name: "$name",
            mobile: "$mobile",
            email: "$email",
            stateCode: "$stateCode",
            kycStatus: "$kycStatus",
            learningPreference: "$learningPreference",
            referralCode: "$referralCode",
            referredBy: "$referredBy",
            createdAt: "$createdAt",
            isMobileVerified: "$isMobileVerified",
            isBlocked: "$isBlocked",
            totalPurchasesCount: "$totalPurchasesCount",
            totalSpentAmount: "$totalSpentAmount",
            kycDocType: "$kycDocType",
            kycDocNumber: "$kycDocNumber",
          },
        },
      },
    },
    { $sort: { count: -1 } },
  ]);

  // 10. Interactive Course Purchase Drilldown (Grouped by Purchased Course Batch with Buyer Students List)
  const groupedCoursePurchases = await Purchase.aggregate([
    { $match: { itemType: "COURSE" } },
    {
      $group: {
        _id: "$course",
        count: { $sum: 1 },
        studentIds: { $push: "$user" },
      },
    },
    {
      $lookup: {
        from: "courses",
        localField: "_id",
        foreignField: "_id",
        as: "courseDetails",
      },
    },
    { $unwind: { path: "$courseDetails", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "users",
        localField: "studentIds",
        foreignField: "_id",
        as: "students",
      },
    },
    {
      $project: {
        _id: 1,
        count: 1,
        courseTitle: { $ifNull: ["$courseDetails.title", "Course Batch"] },
        boardOrGrade: {
          $ifNull: ["$courseDetails.boardOrGrade", "General Grade"],
        },
        subjectName: {
          $ifNull: ["$courseDetails.subjectName", "All Subjects"],
        },
        price: { $ifNull: ["$courseDetails.price", 0] },
        students: {
          $map: {
            input: "$students",
            as: "std",
            in: {
              _id: "$$std._id",
              userId: "$$std.userId",
              name: "$$std.name",
              mobile: "$$std.mobile",
              email: "$$std.email",
              stateCode: "$$std.stateCode",
              kycStatus: "$$std.kycStatus",
            },
          },
        },
      },
    },
    { $sort: { count: -1 } },
  ]);

  return sendSuccess(
    res,
    200,
    "Granular user analytics retrieved successfully from server aggregations.",
    {
      analytics: {
        studentsByBoard,
        studentsBySubject,
        studentsByState,
        studentsByKyc,
        gradeSubjectMatrix,
        teachersBySubject,
        teachersByGrade,
        teachersMatrix,
        groupedStudentPreferences,
        groupedCoursePurchases,
      },
    },
  );
});

/**
 * @route   GET /api/admin/courses/:courseId/students
 * @desc    Fetch complete enrolled students roster, teacher info, and gross/royalty revenue breakdown for a course
 * @access  Private (Admin Only)
 */
const getCourseEnrolledStudents = catchAsync(async (req, res, next) => {
  const { courseId } = req.params;

  const course = await Course.findById(courseId)
    .populate("instructor", "name email mobile userId stateCode role")
    .populate("category", "title code")
    .lean();

  if (!course) {
    return next(new AppError("Course not found.", 404));
  }

  const purchases = await Purchase.find({
    course: courseId,
    $or: [{ status: "SUCCESS" }, { status: { $exists: false } }],
  })
    .populate(
      "user",
      "name email mobile userId stateCode role kycStatus referralCode",
    )
    .sort({ createdAt: -1 })
    .lean();

  const enrolledStudents = purchases.map((p) => {
    const paid = p.amountPaid || course.price;
    return {
      purchaseId: p._id,
      student: p.user,
      amountPaid: paid,
      teacherRoyaltyEarned: calcTeacherRoyalty(paid),
      paymentMethod: p.paymentMethod || "WALLET",
      enrolledAt: p.createdAt,
    };
  });

  const totalEnrolled = enrolledStudents.length;
  const totalGrossRevenue = enrolledStudents.reduce(
    (sum, item) => sum + (item.amountPaid || 0),
    0,
  );
  const teacherRoyaltyShare = enrolledStudents.reduce(
    (sum, item) => sum + item.teacherRoyaltyEarned,
    0,
  );

  const platformRevenueShare = totalGrossRevenue - teacherRoyaltyShare;

  return sendSuccess(
    res,
    200,
    "Course enrolled students roster retrieved successfully.",
    {
      course: {
        ...course,
        totalEnrolled,
        totalGrossRevenue,
        teacherRoyaltyShare,
        platformRevenueShare,
      },
      enrolledStudents,
    },
  );
});

/**
 * @route   GET /api/admin/revenue-statement
 * @desc    Itemised platform revenue ledger (every successful course/e-book purchase)
 *          Query: page, limit, from, to, category (COURSE_PURCHASE|EBOOK_PURCHASE), search
 * @access  Private (Admin Only)
 */
const getRevenueStatement = catchAsync(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 20));
  const skip = (page - 1) * limit;

  // Same filter as getAdminOverviewStats -> ledger total == dashboard total
  const match = { category: { $in: REVENUE_CATEGORIES }, status: "SUCCESS" };

  const cat = (req.query.category || "").toUpperCase();
  if (REVENUE_CATEGORIES.includes(cat)) match.category = cat;

  const range = buildDateRange(req.query.from, req.query.to);
  if (range) match.createdAt = range;

  if (req.query.search && req.query.search.trim()) {
    const rx = new RegExp(escapeRegex(req.query.search.trim()), "i");
    const users = await User.find({
      $or: [{ name: rx }, { mobile: rx }, { email: rx }, { userId: rx }],
    })
      .select("_id")
      .lean();
    match.$or = [
      { description: rx },
      { user: { $in: users.map((u) => u._id) } },
    ];
  }

  const [groupAgg, rows] = await Promise.all([
    Transaction.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$category",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]),
    Transaction.find(match)
      .populate("user", "name mobile userId role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  const byCategory = {};
  let totalAmount = 0;
  let totalCount = 0;
  groupAgg.forEach((g) => {
    byCategory[g._id] = { total: g.total, count: g.count };
    totalAmount += g.total;
    totalCount += g.count;
  });

  const entries = rows.map((t) => ({
    id: t._id,
    date: t.createdAt,
    type: t.category,
    typeLabel: t.category === "EBOOK_PURCHASE" ? "E-Book Sale" : "Course Sale",
    title: t.description || "Purchase",
    // Agar Transaction schema mein course/reference field hai to yahan populate karke dikha sakte ho
    party: t.user
      ? { name: t.user.name, userId: t.user.userId, mobile: t.user.mobile }
      : null,
    amount: t.amount,
    status: t.status,
  }));

  return sendSuccess(res, 200, "Revenue statement retrieved successfully.", {
    summary: { totalAmount, totalCount, byCategory },
    entries,
    pagination: {
      page,
      limit,
      totalRecords: totalCount,
      totalPages: Math.max(1, Math.ceil(totalCount / limit)),
    },
  });
});

/**
 * @route   GET /api/admin/mlm-leaderboard
 * @desc    Fetch comprehensive MLM binary network leaderboard with leg counts, volumes & earnings
 * @access  Private (Admin Only)
 */
const getMlmLeaderboard = catchAsync(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 20));
  const sortBy = String(req.query.sortBy || "TEAM").toUpperCase();
  const searchRaw = typeof req.query.search === "string" ? req.query.search.trim() : "";

  // 1. Single query: load all MLM nodes with lean() and required fields
  const allNodes = await MLMNode.find(
    {},
    "user sponsor parent position leftLeg rightLeg leftVolume rightVolume totalMatchedVolume totalEarnings"
  ).lean();

  if (!allNodes || allNodes.length === 0) {
    return sendSuccess(res, 200, "MLM leaderboard retrieved successfully.", {
      summary: {
        totalMembers: 0,
        totalDirectReferrals: 0,
        totalMatchedPV: 0,
        topPerformer: null,
      },
      members: [],
      pagination: {
        page,
        limit,
        totalRecords: 0,
        totalPages: 1,
      },
    });
  }

  // 2. Single query: fetch all associated users with required fields
  const userIds = allNodes.map((n) => n.user).filter((u) => u != null);
  const users = await User.find(
    { _id: { $in: userIds } },
    "name userId mobile role referralCode"
  ).lean();

  const userMap = new Map();
  for (const u of users) {
    userMap.set(String(u._id), u);
  }

  // Filter out nodes whose user document does not exist in the DB
  const validNodes = allNodes.filter((n) => n.user && userMap.has(String(n.user)));

  const nodeMap = new Map();
  for (const n of validNodes) {
    nodeMap.set(String(n._id), n);
  }

  // 3. Compute directCount by grouping MLMNode.sponsor in one single pass
  const directCountMap = new Map();
  for (const n of validNodes) {
    if (n.sponsor) {
      const sId = String(n.sponsor);
      directCountMap.set(sId, (directCountMap.get(sId) || 0) + 1);
    }
  }

  // 4. Compute leg descendant counts using cycle-safe iterative post-order traversal (no recursion)
  const subtreeSizes = new Map(); // nodeId -> total subtree size including self
  const leftCountMap = new Map(); // nodeId -> left leg descendant count
  const rightCountMap = new Map(); // nodeId -> right leg descendant count
  const inStack = new Set(); // guard against cycles

  for (const startNode of validNodes) {
    const startId = String(startNode._id);
    if (subtreeSizes.has(startId)) continue;

    const stack = [{ id: startId, state: 0 }];

    while (stack.length > 0) {
      const top = stack[stack.length - 1];
      const currId = top.id;

      if (top.state === 0) {
        if (subtreeSizes.has(currId)) {
          stack.pop();
          continue;
        }

        inStack.add(currId);
        top.state = 1;

        const node = nodeMap.get(currId);
        if (!node) continue;

        // Push children that exist in nodeMap and are not yet evaluated
        const children = [];
        if (node.rightLeg) {
          const rId = String(node.rightLeg);
          if (nodeMap.has(rId) && !subtreeSizes.has(rId)) {
            if (!inStack.has(rId)) {
              children.push(rId);
            }
          }
        }
        if (node.leftLeg) {
          const lId = String(node.leftLeg);
          if (nodeMap.has(lId) && !subtreeSizes.has(lId)) {
            if (!inStack.has(lId)) {
              children.push(lId);
            }
          }
        }

        for (const childId of children) {
          stack.push({ id: childId, state: 0 });
        }
      } else {
        stack.pop();
        inStack.delete(currId);

        const node = nodeMap.get(currId);
        let leftDescendants = 0;
        let rightDescendants = 0;

        if (node) {
          if (node.leftLeg) {
            const lId = String(node.leftLeg);
            if (nodeMap.has(lId)) {
              leftDescendants = subtreeSizes.get(lId) || 0;
            }
          }
          if (node.rightLeg) {
            const rId = String(node.rightLeg);
            if (nodeMap.has(rId)) {
              rightDescendants = subtreeSizes.get(rId) || 0;
            }
          }
        }

        leftCountMap.set(currId, leftDescendants);
        rightCountMap.set(currId, rightDescendants);
        subtreeSizes.set(currId, 1 + leftDescendants + rightDescendants);
      }
    }
  }

  // 5. Build member entries with exact fields
  let searchRegex = null;
  if (searchRaw) {
    searchRegex = new RegExp(escapeRegex(searchRaw), "i");
  }

  const allMembers = [];

  for (const node of validNodes) {
    const user = userMap.get(String(node.user));
    const nodeIdStr = String(node._id);

    // Parent resolution (placement parent via node.parent -> its user { name, userId })
    let parent = null;
    if (node.parent) {
      const parentNode = nodeMap.get(String(node.parent));
      if (parentNode && parentNode.user) {
        const parentUser = userMap.get(String(parentNode.user));
        if (parentUser) {
          parent = {
            name: parentUser.name || "Unknown",
            userId: parentUser.userId || "",
          };
        }
      }
    }

    const directCount = directCountMap.get(String(user._id)) || 0;
    const leftCount = leftCountMap.get(nodeIdStr) || 0;
    const rightCount = rightCountMap.get(nodeIdStr) || 0;
    const teamSize = leftCount + rightCount;
    const leftPV = Number(node.leftVolume) || 0;
    const rightPV = Number(node.rightVolume) || 0;
    const matchedPV = Number(node.totalMatchedVolume) || 0;
    const totalEarnings = Number(node.totalEarnings) || 0;

    const memberEntry = {
      id: nodeIdStr,
      name: user.name || "",
      userId: user.userId || "",
      mobile: user.mobile || "",
      role: user.role || "STUDENT",
      referralCode: user.referralCode || "",
      parent,
      directCount,
      leftCount,
      rightCount,
      teamSize,
      leftPV,
      rightPV,
      matchedPV,
      totalEarnings,
    };

    // Filter by search: name, mobile, userId, referralCode (case-insensitive)
    if (searchRegex) {
      const matches =
        searchRegex.test(memberEntry.name) ||
        searchRegex.test(memberEntry.mobile) ||
        searchRegex.test(memberEntry.userId) ||
        searchRegex.test(memberEntry.referralCode);
      if (!matches) continue;
    }

    allMembers.push(memberEntry);
  }

  // 6. Compute summary on the FULL search-filtered set
  const totalMembers = allMembers.length;
  let totalDirectReferrals = 0;
  let totalMatchedPV = 0;

  for (const m of allMembers) {
    totalDirectReferrals += m.directCount;
    totalMatchedPV += m.matchedPV;
  }

  let topPerformer = null;
  if (totalMembers > 0) {
    const sortedForTop = [...allMembers].sort((a, b) => {
      const diff = b.teamSize - a.teamSize;
      if (diff !== 0) return diff;
      return (a.name || "").localeCompare(b.name || "", undefined, { sensitivity: "base" });
    });
    topPerformer = {
      name: sortedForTop[0].name,
      userId: sortedForTop[0].userId,
      teamSize: sortedForTop[0].teamSize,
    };
  }

  const summary = {
    totalMembers,
    totalDirectReferrals,
    totalMatchedPV,
    topPerformer,
  };

  // 7. Sort allMembers based on sortBy (default TEAM, tie-break by name ascending)
  const sortKeys = {
    TEAM: "teamSize",
    DIRECT: "directCount",
    LEFT: "leftCount",
    RIGHT: "rightCount",
    MATCHED: "matchedPV",
    EARNINGS: "totalEarnings",
  };
  const sortKey = sortKeys[sortBy] || "teamSize";

  allMembers.sort((a, b) => {
    const diff = (b[sortKey] || 0) - (a[sortKey] || 0);
    if (diff !== 0) return diff;
    return (a.name || "").localeCompare(b.name || "", undefined, { sensitivity: "base" });
  });

  // 8. Paginate and map to response shape
  const totalRecords = totalMembers;
  const totalPages = Math.max(1, Math.ceil(totalRecords / limit));
  const startIndex = (page - 1) * limit;
  const pageSlice = allMembers.slice(startIndex, startIndex + limit);

  const members = pageSlice.map((m, idx) => ({
    rank: startIndex + idx + 1,
    id: m.id,
    name: m.name,
    userId: m.userId,
    mobile: m.mobile,
    role: m.role,
    parent: m.parent,
    directCount: m.directCount,
    leftCount: m.leftCount,
    rightCount: m.rightCount,
    teamSize: m.teamSize,
    leftPV: m.leftPV,
    rightPV: m.rightPV,
    matchedPV: m.matchedPV,
    totalEarnings: m.totalEarnings,
  }));

  const pagination = {
    page,
    limit,
    totalRecords,
    totalPages,
  };

  return sendSuccess(res, 200, "MLM leaderboard retrieved successfully.", {
    summary,
    members,
    pagination,
  });
});

module.exports = {
  getAdminOverviewStats,
  getAllUsers,
  getAdminGranularUserAnalytics,
  bulkCreateAdminUsers,
  updateUserRoleStatus,
  getPendingPayouts,
  approvePayout,
  getAllCourses,
  toggleCourseStatus,
  createAdminCourse,
  bulkCreateAdminCourses,
  uploadCourseThumbnail,
  uploadStudyMaterialDocument,
  updateAdminCourse,
  deleteAdminCourse,
  getCourseEnrolledStudents,
  getRevenueStatement,
  getMlmLeaderboard,
};
