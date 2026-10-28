const Course = require("../models/Course");
const Category = require("../models/Category");
const McqQuestion = require("../models/McqQuestion");
const McqAttempt = require("../models/McqAttempt");
const Purchase = require("../models/Purchase");
const Transaction = require("../models/Transaction");
const Wallet = require("../models/Wallet");
const WithdrawalRequest = require("../models/WithdrawalRequest");
const User = require("../models/User");
const catchAsync = require("../utils/catchAsync");
const { uploadToCloudinary } = require("../utils/cloudinary");
const { sendSuccess } = require("../utils/apiResponse");
const AppError = require("../utils/appError");
const { parseRichContents } = require("../utils/sanitizeRichContent");

const {
  getUserWalletMetrics,
  calcTeacherRoyalty,
} = require("../utils/walletMetrics");

/**
 * @route   GET /api/teacher/stats
 * @desc    Fetch instructor metrics overview (Course sales royalty, Refer & Earn commissions, wallet balance) - 100% Dynamic
 * @access  Private (Teacher / Admin)
 */
const getTeacherStats = catchAsync(async (req, res) => {
  const teacherId = req.user._id;
  const metrics = await getUserWalletMetrics(teacherId, "TEACHER");

  return sendSuccess(
    res,
    200,
    "Teacher analytics overview retrieved successfully.",
    {
      stats: {
        totalRevenue: metrics.totalEarned,
        courseRoyaltyEarnings: metrics.courseRoyaltyEarned,
        referralEarnings: metrics.referralEarned,
        totalStudents: metrics.totalStudents,
        activeCoursesCount: metrics.activeCoursesCount,
        walletBalance: metrics.withdrawableBalance,
        withdrawableBalance: metrics.withdrawableBalance,
        totalWithdrawn: metrics.totalWithdrawnOrPending,
      },
    },
  );
});

/**
 * @route   GET /api/teacher/courses
 * @desc    Fetch all courses created by the logged-in teacher
 * @access  Private (Teacher / Admin)
 */
const getTeacherCourses = catchAsync(async (req, res) => {
  const teacherId = req.user._id;
  const courses = await Course.find({ instructor: teacherId })
    .populate("category", "name slug")
    .sort({ createdAt: -1 })
    .lean();

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

  return sendSuccess(res, 200, "Instructor courses retrieved successfully.", {
    count: coursesWithCounts.length,
    courses: coursesWithCounts,
  });
});

/**
 * @route   POST /api/teacher/courses
 * @desc    Create a new course by Teacher (with 2MB Cloudinary Thumbnail upload)
 * @access  Private (Teacher / Admin)
 */
const createTeacherCourse = catchAsync(async (req, res, next) => {
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

  // Parse topics and inclusions if passed as JSON strings (e.g. from FormData)
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
    validityDays: 365,
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
    isFeatured: false,
  });

  return sendSuccess(
    res,
    201,
    "New course published successfully by Instructor.",
    {
      course,
    },
  );
});

/**
 * @route   POST /api/teacher/courses/bulk
 * @desc    Bulk create courses from Excel/CSV parsed JSON by Teacher/Instructor
 * @access  Private (Teacher / Admin)
 */
const bulkCreateTeacherCourses = catchAsync(async (req, res, next) => {
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
        isFeatured: false,
      });
      createdCourses.push(created);
    } catch (err) {
      errors.push({ row: rowNum, error: err.message });
    }
  }

  return sendSuccess(
    res,
    201,
    `${createdCourses.length} courses created successfully in bulk by Instructor.`,
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
 * @route   GET /api/teacher/mcqs
 * @desc    Fetch all MCQ questions created by this instructor or in bank
 * @access  Private (Teacher / Admin)
 */
const getTeacherMcqs = catchAsync(async (req, res) => {
  const teacherId = req.user._id;
  const mcqs = await McqQuestion.find({
    $or: [{ author: teacherId }, { author: { $exists: false } }],
  })
    .populate("course", "title stateCode boardOrGrade subjectName price")
    .select("+correctOption")
    .sort({ createdAt: -1 })
    .lean();

  return sendSuccess(
    res,
    200,
    "Instructor MCQ question bank retrieved successfully.",
    {
      count: mcqs.length,
      mcqs,
    },
  );
});

/**
 * @route   GET /api/teacher/mcq-attempts
 * @desc    Fetch student quiz attempts & scores for teacher inspection
 * @access  Private (Teacher / Admin)
 */
const getTeacherMcqAttempts = catchAsync(async (req, res) => {
  const attempts = await McqAttempt.find({})
    .populate("user", "name mobile email userId")
    .populate("subject", "title")
    .populate("course", "title stateCode boardOrGrade subjectName")
    .sort({ createdAt: -1 })
    .lean();

  return sendSuccess(
    res,
    200,
    "Student quiz attempts retrieved successfully.",
    {
      count: attempts.length,
      attempts,
    },
  );
});

/**
 * @route   POST /api/teacher/mcqs
 * @desc    Add a new MCQ question to the question bank (linked to Course Batch, Class, State, Subject)
 * @access  Private (Teacher / Admin)
 */
const createTeacherMcq = catchAsync(async (req, res, next) => {
  const {
    courseId,
    quizSetTitle,
    stateCode,
    boardOrGrade,
    subCategory,
    subjectName,
    questions,
    questionText,
    optionA,
    optionB,
    optionC,
    optionD,
    correctOptionIndex,
    explanation,
    marks,
  } = req.body;

  let courseObj = null;
  const mongoose = require("mongoose");
  if (courseId) {
    if (mongoose.Types.ObjectId.isValid(courseId)) {
      courseObj = await Course.findById(courseId).lean();
    }
  }

  const finalStateCode =
    stateCode || (courseObj ? courseObj.stateCode : "GLOBAL");
  const finalBoardOrGrade =
    boardOrGrade || (courseObj ? courseObj.boardOrGrade : "General Batch");
  const finalSubCategory =
    subCategory || (courseObj ? courseObj.subCategory : "");
  const finalSubjectName =
    subjectName || (courseObj ? courseObj.subjectName : "All Subjects");
  const finalQuizSetTitle =
    (quizSetTitle || "").trim() || "Practice Test Set #1";
  const finalQuizSetId = `set_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  // Handle Bulk Array of Questions for Test Paper Set (from Form or CSV/Excel Upload)
  if (Array.isArray(questions) && questions.length > 0) {
    // Pre-cache courses for rows that specify their own courseId
    const distinctCourseIds = [
      ...new Set(
        questions.map((q) => (q.courseId || "").trim()).filter(Boolean),
      ),
    ];
    const courseMap = {};
    if (courseObj) {
      courseMap[courseObj._id.toString()] = courseObj;
    }
    if (distinctCourseIds.length > 0) {
      const validIds = distinctCourseIds.filter((id) =>
        mongoose.Types.ObjectId.isValid(id),
      );
      if (validIds.length > 0) {
        const foundCourses = await Course.find({
          _id: { $in: validIds },
        }).lean();
        foundCourses.forEach((c) => {
          courseMap[c._id.toString()] = c;
        });
      }
    }

    const docsToCreate = questions
      .map((q) => {
        const opts = [
          (q.optionA || "").trim(),
          (q.optionB || "").trim(),
          (q.optionC || "").trim(),
          (q.optionD || "").trim(),
        ];
        const rowCourseId = (q.courseId || "").trim();
        const rowCourse = courseMap[rowCourseId] || courseObj;
        const rowSetTitle = (q.quizSetTitle || "").trim() || finalQuizSetTitle;

        return {
          author: req.user._id,
          course: rowCourse
            ? rowCourse._id
            : courseObj
              ? courseObj._id
              : undefined,
          quizSetTitle: rowSetTitle,
          quizSetId: q.quizSetId || finalQuizSetId,
          stateCode:
            q.stateCode || (rowCourse ? rowCourse.stateCode : finalStateCode),
          boardOrGrade:
            q.boardOrGrade ||
            (rowCourse ? rowCourse.boardOrGrade : finalBoardOrGrade),
          subCategory:
            q.subCategory ||
            (rowCourse ? rowCourse.subCategory : finalSubCategory),
          subjectName:
            q.subjectName ||
            (rowCourse ? rowCourse.subjectName : finalSubjectName),
          questionText: (q.questionText || "").trim(),
          options: opts,
          correctOption: Number(q.correctOptionIndex) || 0,
          explanation: (q.explanation || "").trim(),
          marks: Number(q.marks) || 1,
        };
      })
      .filter(
        (d) =>
          d.questionText.length > 0 && d.options.every((o) => o.length > 0),
      );

    if (docsToCreate.length === 0) {
      return next(
        new AppError(
          "Please fill in complete details for at least 1 question (Question text + all 4 options).",
          400,
        ),
      );
    }

    const createdMcqs = await McqQuestion.insertMany(docsToCreate);
    return sendSuccess(
      res,
      201,
      `Successfully published ${createdMcqs.length} MCQ questions for Test Set "${finalQuizSetTitle}"!`,
      {
        count: createdMcqs.length,
        quizSetId: finalQuizSetId,
        quizSetTitle: finalQuizSetTitle,
        mcqs: createdMcqs,
      },
    );
  }

  // Handle Single Question Payload
  if (!questionText || !questionText.trim()) {
    return next(new AppError("Question text is required.", 400));
  }
  if (!optionA || !optionB || !optionC || !optionD) {
    return next(
      new AppError("All 4 MCQ options (A, B, C, D) are required.", 400),
    );
  }

  const mcq = await McqQuestion.create({
    author: req.user._id,
    course: courseObj ? courseObj._id : undefined,
    quizSetTitle: finalQuizSetTitle,
    quizSetId: finalQuizSetId,
    stateCode: finalStateCode,
    boardOrGrade: finalBoardOrGrade,
    subCategory: finalSubCategory,
    subjectName: finalSubjectName,
    questionText: questionText.trim(),
    options: [optionA.trim(), optionB.trim(), optionC.trim(), optionD.trim()],
    correctOption: Number(correctOptionIndex) || 0,
    explanation: explanation ? explanation.trim() : "",
    marks: Number(marks) || 1,
  });

  return sendSuccess(
    res,
    201,
    "MCQ Question added to question bank successfully.",
    {
      quizSetId: finalQuizSetId,
      quizSetTitle: finalQuizSetTitle,
      mcq,
    },
  );
});

/**
 * @route   DELETE /api/teacher/mcqs/:id
 * @desc    Delete an MCQ question from question bank
 * @access  Private (Teacher / Admin)
 */
const deleteTeacherMcq = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const teacherId = req.user._id;

  const mcq = await McqQuestion.findById(id);
  if (!mcq) {
    return next(new AppError("MCQ question not found.", 404));
  }

  // Admin can delete any question, Teacher can delete their own or legacy bank
  if (
    req.user.role !== "ADMIN" &&
    mcq.author &&
    mcq.author.toString() !== teacherId.toString()
  ) {
    return next(new AppError("Not authorized to delete this question.", 403));
  }

  await McqQuestion.findByIdAndDelete(id);
  return sendSuccess(
    res,
    200,
    "MCQ Question deleted from question bank successfully.",
  );
});

/**
 * @route   POST /api/teacher/payouts/request
 * @desc    Submit a royalty earnings payout withdrawal request
 * @access  Private (Teacher / Admin)
 */
const requestTeacherPayout = catchAsync(async (req, res, next) => {
  const {
    amount,
    payoutMethod = "BANK",
    bankDetails,
    upiDetails,
    saveAsDefault,
  } = req.body;
  const payoutAmount = Number(amount);

  if (isNaN(payoutAmount) || payoutAmount < 50) {
    return next(
      new AppError(
        "Please enter a valid payout withdrawal amount (Minimum ₹50).",
        400,
      ),
    );
  }

  let wallet = await Wallet.findOne({ user: req.user._id });
  if (!wallet || wallet.balance < payoutAmount) {
    return next(
      new AppError(
        `Insufficient wallet balance for withdrawal. Current balance: ₹${wallet ? wallet.balance : 0}`,
        400,
      ),
    );
  }

  // Deduct/hold wallet balance
  wallet.balance -= payoutAmount;
  await wallet.save();

  // Create WithdrawalRequest
  const withdrawal = await WithdrawalRequest.create({
    user: req.user._id,
    userRole: "TEACHER",
    wallet: wallet._id,
    amount: payoutAmount,
    payoutMethod,
    bankDetails:
      payoutMethod === "BANK" && bankDetails
        ? {
            accountHolderName: (bankDetails.accountHolderName || "").trim(),
            accountNumber: (bankDetails.accountNumber || "").trim(),
            ifscCode: (bankDetails.ifscCode || "").trim().toUpperCase(),
            bankName: (bankDetails.bankName || "").trim(),
          }
        : undefined,
    upiDetails:
      payoutMethod === "UPI" && upiDetails
        ? {
            upiId: (upiDetails.upiId || "").trim().toLowerCase(),
            accountHolderName: (
              upiDetails.accountHolderName ||
              req.user.name ||
              ""
            ).trim(),
          }
        : undefined,
    status: "PENDING",
  });

  // Create pending payout transaction
  const transaction = await Transaction.create({
    wallet: wallet._id,
    user: req.user._id,
    amount: payoutAmount,
    type: "DEBIT",
    category: "ROYALTY_PAYOUT",
    status: "PENDING",
    description: `Instructor royalty payout request (${withdrawal.withdrawalId}) via ${payoutMethod}`,
  });

  if (saveAsDefault) {
    const user = await User.findById(req.user._id);
    if (user) {
      if (!user.payoutProfile) user.payoutProfile = {};
      user.payoutProfile.preferredMethod = payoutMethod;
      if (payoutMethod === "BANK" && bankDetails) {
        user.payoutProfile.bankAccount = {
          accountHolderName: (bankDetails.accountHolderName || "").trim(),
          accountNumber: (bankDetails.accountNumber || "").trim(),
          ifscCode: (bankDetails.ifscCode || "").trim().toUpperCase(),
          bankName: (bankDetails.bankName || "").trim(),
        };
      } else if (payoutMethod === "UPI" && upiDetails) {
        user.payoutProfile.upi = {
          upiId: (upiDetails.upiId || "").trim().toLowerCase(),
          accountHolderName: (
            upiDetails.accountHolderName ||
            req.user.name ||
            ""
          ).trim(),
        };
      }
      user.payoutProfile.isConfigured = true;
      await user.save();
    }
  }

  return sendSuccess(
    res,
    201,
    "Royalty payout withdrawal request submitted to Super Admin for approval.",
    {
      withdrawal,
      transaction,
      currentWalletBalance: wallet.balance,
    },
  );
});

/**
 * @route   PUT /api/teacher/courses/:id
 * @desc    Update existing course batch by Teacher/Instructor
 * @access  Private (Teacher / Admin)
 */
const updateTeacherCourse = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const course = await Course.findById(id);
  if (!course) {
    return next(new AppError("Course batch not found.", 404));
  }

  // Ensure teacher owns this course or is Admin
  if (
    req.user.role !== "ADMIN" &&
    course.instructor.toString() !== req.user._id.toString()
  ) {
    return next(
      new AppError(
        "You do not have permission to edit this course batch.",
        403,
      ),
    );
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

  return sendSuccess(res, 200, "Course batch updated successfully.", {
    course,
  });
});

/**
 * @route   DELETE /api/teacher/courses/:id
 * @desc    Delete course batch by Teacher/Instructor
 * @access  Private (Teacher / Admin)
 */
const deleteTeacherCourse = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const course = await Course.findById(id);
  if (!course) {
    return next(new AppError("Course batch not found.", 404));
  }

  // Ensure teacher owns this course or is Admin
  if (
    req.user.role !== "ADMIN" &&
    course.instructor.toString() !== req.user._id.toString()
  ) {
    return next(
      new AppError(
        "You do not have permission to delete this course batch.",
        403,
      ),
    );
  }

  await Course.findByIdAndDelete(id);

  return sendSuccess(res, 200, "Course batch deleted successfully.", {
    courseId: id,
  });
});

/**
 * @route   GET /api/teacher/courses/:courseId/students
 * @desc    Fetch enrolled students roster and educator royalty earnings for a teacher's course
 * @access  Private (Teacher / Admin)
 */
const getTeacherCourseStudents = catchAsync(async (req, res, next) => {
  const { courseId } = req.params;
  const teacherId = req.user._id;

  const course = await Course.findById(courseId).lean();
  if (!course) {
    return next(new AppError("Course batch not found.", 404));
  }

  // Ensure teacher owns this course or is Admin
  if (
    req.user.role !== "ADMIN" &&
    String(course.instructor) !== String(teacherId)
  ) {
    return next(
      new AppError("Unauthorized access to course student roster.", 403),
    );
  }

  const purchases = await Purchase.find({
    course: courseId,
    $or: [{ status: "SUCCESS" }, { status: { $exists: false } }],
  })
    .populate("user", "name email mobile userId stateCode role kycStatus")
    .sort({ createdAt: -1 })
    .lean();

  const enrolledStudents = purchases.map((p) => {
    const paid = p.amountPaid || course.price;
    const royalty = calcTeacherRoyalty(paid);
    return {
      purchaseId: p._id,
      student: p.user,
      amountPaid: paid,
      teacherRoyaltyEarned: royalty,
      enrolledAt: p.createdAt,
    };
  });

  const totalEnrolled = enrolledStudents.length;
  const totalRoyaltyEarned = enrolledStudents.reduce(
    (sum, item) => sum + item.teacherRoyaltyEarned,
    0,
  );

  return sendSuccess(
    res,
    200,
    "Teacher course enrolled students roster retrieved successfully.",
    {
      course: {
        ...course,
        totalEnrolled,
        totalRoyaltyEarned,
      },
      enrolledStudents,
    },
  );
});

module.exports = {
  getTeacherStats,
  getTeacherCourses,
  createTeacherCourse,
  bulkCreateTeacherCourses,
  getTeacherMcqs,
  getTeacherMcqAttempts,
  createTeacherMcq,
  deleteTeacherMcq,
  requestTeacherPayout,
  updateTeacherCourse,
  deleteTeacherCourse,
  getTeacherCourseStudents,
};
