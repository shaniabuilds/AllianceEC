const mongoose = require("mongoose");

const User = require("../models/User");
const Course = require("../models/Course");
const Purchase = require("../models/Purchase");
const McqQuestion = require("../models/McqQuestion");
const McqAttempt = require("../models/McqAttempt");
const KYC = require("../models/KYC");
const Wallet = require("../models/Wallet");
const Transaction = require("../models/Transaction");
const catchAsync = require("../utils/catchAsync");
const { uploadToCloudinary } = require("../utils/cloudinary");
const { sendSuccess } = require("../utils/apiResponse");
const AppError = require("../utils/appError");

const {
  getUserWalletMetrics,
  calcTeacherRoyalty,
} = require("../utils/walletMetrics");

/**
 * @route   GET /api/student/stats
 * @desc    Fetch 100% dynamic student dashboard metrics overview
 * @access  Private (Student / Admin)
 */
const getStudentDashboardStats = catchAsync(async (req, res) => {
  const studentId = req.user._id;

  // 1. Enrolled courses count from successful purchases
  const enrolledCount = await Purchase.countDocuments({
    user: studentId,
    status: "SUCCESS",
  });

  // 2. Completed quiz attempts count
  const quizAttemptsCount = await McqAttempt.countDocuments({
    user: studentId,
  });

  // 3. Student Wallet balance & breakdown
  let wallet = await Wallet.findOne({ user: studentId });
  if (!wallet) {
    wallet = await Wallet.create({ user: studentId, balance: 0 });
  } else if (enrolledCount === 0 && wallet.balance === 5000) {
    // Reset legacy mock seed balance in MongoDB Atlas if student has 0 purchases
    wallet.balance = 0;
    await wallet.save();
  }

  const metrics = await getUserWalletMetrics(studentId, "STUDENT");

  // 4. KYC Status
  const kycRecord = await KYC.findOne({ user: studentId });

  return sendSuccess(
    res,
    200,
    "Student metrics overview retrieved successfully.",
    {
      stats: {
        enrolledCoursesCount: enrolledCount,
        quizAttemptsCount: quizAttemptsCount,
        walletBalance: metrics.totalBalance,
        withdrawableBalance: metrics.withdrawableBalance,
        purchaseBalance: metrics.purchaseBalance,
        totalReferralEarned: metrics.totalReferralEarned,
        totalDeposited: metrics.totalDeposited,
        kycStatus: kycRecord
          ? kycRecord.status
          : req.user.kycStatus || "NOT_SUBMITTED",
        kycDocumentType: kycRecord ? kycRecord.documentType : null,
        kycRejectionReason: kycRecord ? kycRecord.rejectionReason : null,
      },
    },
  );
});

/**
 * @route   GET /api/student/my-courses
 * @desc    Fetch all courses purchased/enrolled by logged-in student
 * @access  Private (Student / Admin)
 */
const getMyEnrolledCourses = catchAsync(async (req, res) => {
  const studentId = req.user._id;
  const purchases = await Purchase.find({
    user: studentId,
    $or: [{ status: "SUCCESS" }, { status: { $exists: false } }],
  })
    .populate({
      path: "course",
      select: "-richContents",
      populate: { path: "instructor", select: "name email mobile" },
    })
    .sort({ createdAt: -1 })
    .lean();

  const enrolledCourses = purchases
    .map((p) => p.course)
    .filter((c) => c !== null);

  return sendSuccess(res, 200, "Enrolled courses retrieved successfully.", {
    count: enrolledCourses.length,
    courses: enrolledCourses,
  });
});

/**
 * @route   GET /api/student/browse-courses
 * @desc    Fetch all active published courses available for enrollment
 * @access  Private (Student / Admin)
 */
const browsePlatformCourses = catchAsync(async (req, res) => {
  const { subCategory, stateCode, stream, subjectName, categoryCode, showAll } =
    req.query;
  const filter = { active: true };

  // If explicit query params provided, use those for filtering
  if (subCategory) {
    filter.subCategory = subCategory;
  }
  if (stateCode && stateCode !== "GLOBAL") {
    filter.stateCode = { $in: [stateCode, "GLOBAL"] };
  }
  if (stream) {
    filter.stream = stream;
  }
  if (subjectName && !subjectName.includes("All Subjects")) {
    filter.$or = [
      { subjects: subjectName },
      { subjectName: subjectName },
      { subjectName: { $regex: subjectName, $options: "i" } },
    ];
  }

  // If NO explicit params AND student has learningPreference set AND showAll is NOT true,
  // auto-filter by their saved preference
  if (
    !subCategory &&
    !stateCode &&
    !stream &&
    !subjectName &&
    showAll !== "true"
  ) {
    const student = await User.findById(req.user._id).lean();
    if (student?.learningPreference?.isPreferenceSet) {
      const pref = student.learningPreference;
      if (pref.subCategory) {
        filter.subCategory = pref.subCategory;
      }
      if (pref.stateCode && pref.stateCode !== "GLOBAL") {
        filter.stateCode = { $in: [pref.stateCode, "GLOBAL"] };
      }
      if (pref.stream) {
        filter.stream = pref.stream;
      }
      if (pref.subjectName && !pref.subjectName.includes("All Subjects")) {
        filter.$or = [
          { subjects: pref.subjectName },
          { subjectName: pref.subjectName },
          { subjectName: { $regex: pref.subjectName, $options: "i" } },
        ];
      }
    }
  }

  const courses = await Course.find(filter)
    .select("-richContents")
    .populate("instructor", "name email mobile")
    .populate("category", "title code")
    .sort({ isFeatured: -1, createdAt: -1 })
    .lean();

  return sendSuccess(res, 200, "Platform courses retrieved successfully.", {
    count: courses.length,
    courses,
  });
});

/**
 * @route   POST /api/student/enroll/:courseId
 * @desc    1-Click Course Purchase & Enrollment (Deducts student wallet, credits teacher royalty)
 * @access  Private (Student / Admin)
 */
const enrollInCourse = catchAsync(async (req, res, next) => {
  const studentId = req.user._id;
  const { courseId } = req.params;

  const course = await Course.findById(courseId);
  if (!course) {
    return next(new AppError("Course not found.", 404));
  }

  // Check if student already enrolled
  const existingPurchase = await Purchase.findOne({
    user: studentId,
    course: courseId,
    status: "SUCCESS",
  });
  if (existingPurchase) {
    return next(
      new AppError("You are already enrolled in this course batch!", 400),
    );
  }

  // Check student wallet balance
  let studentWallet = await Wallet.findOne({ user: studentId });
  if (!studentWallet) {
    studentWallet = await Wallet.create({ user: studentId, balance: 0 });
  }

  if (studentWallet.balance < course.price) {
    return next(
      new AppError(
        `Insufficient wallet balance (₹${studentWallet.balance}). Course price is ₹${course.price}. Please top up your wallet.`,
        400,
      ),
    );
  }

  // 1. Deduct course price from student wallet
  studentWallet.balance -= course.price;
  await studentWallet.save();

  // 2. Create Purchase record
  const purchase = await Purchase.create({
    user: studentId,
    itemType: "COURSE",
    course: courseId,
    amountPaid: course.price,
    paymentMethod: "WALLET",
    status: "SUCCESS",
  });

  // Create DEBIT Transaction record
  await Transaction.create({
    wallet: studentWallet._id,
    user: studentId,
    amount: course.price,
    type: "DEBIT",
    category: "COURSE_PURCHASE",
    status: "SUCCESS",
    description: `Enrolled in course batch: ${course.title}`,
  });

  // 3. Increment course totalStudents count
  course.totalStudents = (course.totalStudents || 0) + 1;
  await course.save();

  // 4. Credit 70% instructor royalty share to teacher wallet
  if (course.instructor) {
    const teacherRoyalty = calcTeacherRoyalty(purchase.amountPaid);
    let teacherWallet = await Wallet.findOne({ user: course.instructor });
    if (!teacherWallet) {
      teacherWallet = await Wallet.create({
        user: course.instructor,
        balance: teacherRoyalty,
      });
    } else {
      teacherWallet.balance += teacherRoyalty;
      await teacherWallet.save();
    }

    await Transaction.create({
      wallet: teacherWallet._id,
      user: course.instructor,
      amount: teacherRoyalty,
      type: "CREDIT",
      category: "ROYALTY_PAYOUT",
      status: "SUCCESS",
      description: `Educator 70% Royalty share for course enrollment: ${course.title}`,
    });
  }

  return sendSuccess(
    res,
    201,
    `🎉 Congratulations! You have successfully enrolled in ${course.title}.`,
    {
      purchase,
      updatedWalletBalance: studentWallet.balance,
      course,
    },
  );
});

/**
 * @route   POST /api/student/wallet/topup
 * @desc    Top-up student wallet balance dynamically
 * @access  Private (Student / Admin)
 */
const topUpStudentWallet = catchAsync(async (req, res, next) => {
  const studentId = req.user._id;
  const { amount } = req.body;
  const topUpAmount = Number(amount);

  if (isNaN(topUpAmount) || topUpAmount <= 0) {
    return next(
      new AppError(
        "Please enter a valid positive top-up amount (e.g. ₹500, ₹1000).",
        400,
      ),
    );
  }

  let wallet = await Wallet.findOne({ user: studentId });
  if (!wallet) {
    wallet = await Wallet.create({ user: studentId, balance: topUpAmount });
  } else {
    wallet.balance += topUpAmount;
    await wallet.save();
  }

  await Transaction.create({
    wallet: wallet._id,
    user: studentId,
    amount: topUpAmount,
    type: "CREDIT",
    category: "WALLET_TOPUP",
    status: "SUCCESS",
    description: `Student wallet top-up of ₹${topUpAmount}`,
  });

  return sendSuccess(
    res,
    200,
    `🎉 Wallet successfully topped up with ₹${topUpAmount}. Current Balance: ₹${wallet.balance}`,
    {
      walletBalance: wallet.balance,
    },
  );
});

/**
 * @route   POST /api/student/quiz/submit
 * @desc    Submit student quiz attempt, evaluate score, and save attempt record
 * @access  Private (Student / Admin)
 */
const submitStudentQuiz = catchAsync(async (req, res, next) => {
  const studentId = req.user._id;
  const { quizSetId, quizSetTitle, courseId, answers } = req.body; // Array of { questionId, selectedOptionIndex }

  if (!answers || !Array.isArray(answers) || answers.length === 0) {
    return next(
      new AppError("Please submit answers for at least 1 question.", 400),
    );
  }

  // Enforce single permanent test attempt guard PER QUIZ SET
  let existingAttempt = null;
  let targetSetId = quizSetId;

  if (!targetSetId && answers[0]?.questionId) {
    const firstQ = await McqQuestion.findById(answers[0].questionId).lean();
    if (firstQ?.quizSetId) {
      targetSetId = firstQ.quizSetId;
    }
  }

  if (targetSetId) {
    existingAttempt = await McqAttempt.findOne({
      user: studentId,
      quizSetId: targetSetId,
    });
  } else {
    existingAttempt = await McqAttempt.findOne({ user: studentId });
  }

  if (existingAttempt) {
    return next(
      new AppError(
        "You have already completed and submitted this test paper set! Official test records are permanently recorded and retakes are not permitted.",
        400,
      ),
    );
  }

  let totalScore = 0;
  let totalMarks = answers.length;
  const processedAnswers = [];
  let detectedQuizSetId = targetSetId;
  let detectedQuizSetTitle = quizSetTitle;
  let detectedCourseId = courseId;

  for (const item of answers) {
    const question = await McqQuestion.findById(item.questionId).select(
      "+correctOption",
    );
    if (question) {
      if (!detectedQuizSetId && question.quizSetId)
        detectedQuizSetId = question.quizSetId;
      if (!detectedQuizSetTitle && question.quizSetTitle)
        detectedQuizSetTitle = question.quizSetTitle;
      if (!detectedCourseId && question.course)
        detectedCourseId = question.course;

      const isCorrect = question.correctOption === item.selectedOptionIndex;
      if (isCorrect) totalScore += question.marks || 1;

      processedAnswers.push({
        question: question._id,
        selectedOption: item.selectedOptionIndex,
        isCorrect,
      });
    }
  }

  const percentage = Math.round((totalScore / (totalMarks || 1)) * 100);
  const passed = percentage >= 50;

  const attempt = await McqAttempt.create({
    user: studentId,
    quizSetId: detectedQuizSetId,
    quizSetTitle: detectedQuizSetTitle || "Practice Test Set",
    course: detectedCourseId,
    answers: processedAnswers,
    score: totalScore,
    totalMarks,
    percentage,
    passed,
  });

  return sendSuccess(
    res,
    201,
    `Quiz completed! Score: ${totalScore}/${totalMarks} (${percentage}%). Status: ${passed ? "PASSED" : "NEEDS IMPROVEMENT"}.`,
    {
      attempt,
    },
  );
});

/**
 * @route   POST /api/student/kyc
 * @desc    Submit Aadhaar & PAN document scans (up to 2MB Cloudinary image upload for each)
 * @access  Private (Student / Admin)
 */
const submitStudentKyc = catchAsync(async (req, res, next) => {
  const studentId = req.user._id;
  const { aadhaarNumber, panNumber, documentType, documentNumber } = req.body;

  let aadhaarScanUrl = req.body.aadhaarScanUrl;
  let panScanUrl = req.body.panScanUrl;
  let documentScanUrl = req.body.documentScanUrl;

  // Process uploaded files if passed via multer fields or single
  if (req.files) {
    if (req.files.aadhaarScan && req.files.aadhaarScan[0]) {
      const uploadRes = await uploadToCloudinary(
        req.files.aadhaarScan[0].buffer,
        "student_kyc",
      );
      aadhaarScanUrl = uploadRes.secure_url;
    }
    if (req.files.panScan && req.files.panScan[0]) {
      const uploadRes = await uploadToCloudinary(
        req.files.panScan[0].buffer,
        "student_kyc",
      );
      panScanUrl = uploadRes.secure_url;
    }
    if (req.files.documentScan && req.files.documentScan[0]) {
      const uploadRes = await uploadToCloudinary(
        req.files.documentScan[0].buffer,
        "student_kyc",
      );
      documentScanUrl = uploadRes.secure_url;
    }
  } else if (req.file) {
    const uploadRes = await uploadToCloudinary(req.file.buffer, "student_kyc");
    documentScanUrl = uploadRes.secure_url;
    if (documentType === "PAN") panScanUrl = uploadRes.secure_url;
    else aadhaarScanUrl = uploadRes.secure_url;
  }

  const finalAadhaarNum =
    aadhaarNumber || (documentType === "AADHAAR" ? documentNumber : undefined);
  const finalPanNum =
    panNumber || (documentType === "PAN" ? documentNumber : undefined);
  const finalAadhaarScan =
    aadhaarScanUrl ||
    (documentType === "AADHAAR" ? documentScanUrl : undefined);
  const finalPanScan =
    panScanUrl || (documentType === "PAN" ? documentScanUrl : undefined);

  if (!finalAadhaarNum && !finalPanNum && !documentNumber) {
    return next(
      new AppError(
        "Aadhaar Number or PAN Number is required for KYC submission.",
        400,
      ),
    );
  }

  let kycRecord = await KYC.findOne({ user: studentId });
  if (kycRecord) {
    if (kycRecord.status === "APPROVED" || kycRecord.status === "VERIFIED") {
      return next(
        new AppError(
          "Your KYC documents have already been verified and approved.",
          400,
        ),
      );
    }
    kycRecord.documentType =
      finalAadhaarNum && finalPanNum ? "BOTH" : documentType || "BOTH";
    kycRecord.aadhaarNumber = finalAadhaarNum || kycRecord.aadhaarNumber;
    kycRecord.aadhaarScanUrl = finalAadhaarScan || kycRecord.aadhaarScanUrl;
    kycRecord.panNumber = finalPanNum || kycRecord.panNumber;
    kycRecord.panScanUrl = finalPanScan || kycRecord.panScanUrl;

    const numLabel =
      finalAadhaarNum && finalPanNum
        ? `Aadhaar: ${finalAadhaarNum} | PAN: ${finalPanNum}`
        : finalAadhaarNum
          ? `Aadhaar: ${finalAadhaarNum}`
          : `PAN: ${finalPanNum}`;
    kycRecord.documentNumber = numLabel;
    kycRecord.documentScanUrl =
      finalAadhaarScan ||
      finalPanScan ||
      documentScanUrl ||
      kycRecord.documentScanUrl;
    kycRecord.status = "PENDING";
    kycRecord.rejectionReason = undefined;
    await kycRecord.save();
  } else {
    const numLabel =
      finalAadhaarNum && finalPanNum
        ? `Aadhaar: ${finalAadhaarNum} | PAN: ${finalPanNum}`
        : finalAadhaarNum
          ? `Aadhaar: ${finalAadhaarNum}`
          : `PAN: ${finalPanNum}`;

    kycRecord = await KYC.create({
      user: studentId,
      documentType:
        finalAadhaarNum && finalPanNum ? "BOTH" : documentType || "BOTH",
      aadhaarNumber: finalAadhaarNum,
      aadhaarScanUrl: finalAadhaarScan,
      panNumber: finalPanNum,
      panScanUrl: finalPanScan,
      documentNumber: numLabel,
      documentScanUrl: finalAadhaarScan || finalPanScan || documentScanUrl,
      status: "PENDING",
    });
  }

  await User.findByIdAndUpdate(studentId, { kycStatus: "PENDING" });

  return sendSuccess(
    res,
    201,
    "Aadhaar & PAN KYC documents submitted successfully for Admin approval.",
    {
      kycRecord,
    },
  );
});

/**
 * @route   GET /api/student/mcqs
 * @desc    Fetch Practice MCQs exclusively for courses in which the student is ENROLLED
 * @access  Private (Student / Admin)
 */
const getStudentPracticeMcqs = catchAsync(async (req, res) => {
  const studentId = req.user._id;

  // 1. Fetch all active non-failed purchases of this student
  const purchases = await Purchase.find({
    user: studentId,
    status: { $ne: "FAILED" },
  })
    .select("course itemType")
    .lean();

  const enrolledCourseIds = purchases
    .filter((p) => p.course)
    .map((p) => p.course);

  if (enrolledCourseIds.length === 0) {
    return sendSuccess(
      res,
      200,
      "No enrolled courses found. Please enroll in a course batch to unlock practice MCQs.",
      {
        count: 0,
        quizSets: [],
        mcqs: [],
        isEnrolled: false,
        message:
          "🔒 Practice MCQs are locked to your enrolled classroom batches. Please enroll in a batch to attempt practice quizzes!",
      },
    );
  }

  const enrolledCourses = await Course.find({ _id: { $in: enrolledCourseIds } })
    .select("_id title stateCode boardOrGrade subjectName subjects instructor")
    .lean();

  const enrolledSubjects = enrolledCourses.flatMap((c) => {
    if (Array.isArray(c.subjects) && c.subjects.length > 0) {
      return c.subjects;
    }

    if (c.subjectName) {
      return c.subjectName
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }

    return [];
  });

  const enrolledInstructorIds = enrolledCourses
    .map((c) => c.instructor)
    .filter(Boolean);

  const enrolledGrades = enrolledCourses
    .map((c) => c.boardOrGrade)
    .filter(Boolean);
  // 3. Fetch questions matching enrolled courses OR enrolled teachers OR enrolled subjects/classes
  const mcqs = await McqQuestion.find({
    $or: [
      { course: { $in: enrolledCourseIds } },
      { author: { $in: enrolledInstructorIds } },
      {
        $and: [
          { subjectName: { $in: enrolledSubjects } },
          { boardOrGrade: { $in: enrolledGrades } },
        ],
      },
    ],
  })
    .populate("course", "title stateCode boardOrGrade subjectName price")
    .sort({ createdAt: -1 })
    .lean();

  // 4. Fetch all attempts by this student
  const attempts = await McqAttempt.find({ user: studentId })
    .sort({ createdAt: -1 })
    .lean();

  const attemptMapByQuizSetId = {};
  attempts.forEach((att) => {
    if (att.quizSetId && !attemptMapByQuizSetId[att.quizSetId]) {
      attemptMapByQuizSetId[att.quizSetId] = att;
    }
  });

  // 5. Group questions set-wise
  const quizSetsMap = {};
  mcqs.forEach((q) => {
    const setId = q.quizSetId || `set_legacy_${q.course?._id || "general"}`;
    const setTitle =
      q.quizSetTitle ||
      (q.course ? `${q.course.title} - Quiz Set` : "Practice Test Set #1");

    if (!quizSetsMap[setId]) {
      const setAttempt =
        attemptMapByQuizSetId[setId] ||
        (attempts.length > 0 && !q.quizSetId ? attempts[0] : null);
      quizSetsMap[setId] = {
        quizSetId: setId,
        quizSetTitle: setTitle,
        courseId: q.course?._id || null,
        courseTitle: q.course?.title || "General Batch",
        subjectName: q.subjectName || "All Subjects",
        boardOrGrade: q.boardOrGrade || "General Batch",
        count: 0,
        hasAttempted: Boolean(setAttempt),
        lastAttempt: setAttempt || null,
        mcqs: [],
      };
    }

    quizSetsMap[setId].mcqs.push(q);
    quizSetsMap[setId].count = quizSetsMap[setId].mcqs.length;
  });

  const quizSets = Object.values(quizSetsMap);

  return sendSuccess(
    res,
    200,
    "Student practice MCQs retrieved successfully based on enrolled classroom batches.",
    {
      count: mcqs.length,
      quizSets,
      mcqs,
      hasAttempted:
        quizSets.length > 0 ? quizSets.every((s) => s.hasAttempted) : false,
      lastAttempt: attempts[0] || null,
      isEnrolled: true,
      enrolledCoursesCount: enrolledCourseIds.length,
    },
  );
});

/**
 * @route   GET /api/student/courses/:courseId/content
 * @desc    Rich blog-style contents of a course (Enrolled student / course instructor / Admin only)
 * @access  Private
 */
const getCourseRichContents = catchAsync(async (req, res, next) => {
  const { courseId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    return next(new AppError("Invalid course ID.", 400));
  }

  const course = await Course.findById(courseId)
    .select("title instructor richContents")
    .lean();
  if (!course) {
    return next(new AppError("Course not found.", 404));
  }

  const isAdmin = req.user.role === "ADMIN";
  const isOwner =
    course.instructor && String(course.instructor) === String(req.user._id);

  let hasAccess = isAdmin || isOwner;
  if (!hasAccess) {
    const purchase = await Purchase.findOne({
      user: req.user._id,
      course: courseId,
      $or: [{ status: "SUCCESS" }, { status: { $exists: false } }],
    }).lean();
    hasAccess = Boolean(purchase);
  }

  if (!hasAccess) {
    return next(
      new AppError(
        "Please enroll in this course batch to view its study content.",
        403,
      ),
    );
  }

  return sendSuccess(res, 200, "Course contents retrieved successfully.", {
    courseId: course._id,
    title: course.title,
    richContents: course.richContents || [],
  });
});

/**
 * @route   GET /api/student/purchase-statement
 * @desc    Student ke saare course purchases + kis teacher se liye
 *          Query: page, limit, from, to
 * @access  Private (Student / Admin)
 */
const getStudentPurchaseStatement = catchAsync(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 20));

  const filter = {
    user: req.user._id,
    $or: [{ status: "SUCCESS" }, { status: { $exists: false } }],
  };

  const range = {};
  if (req.query.from && !isNaN(new Date(req.query.from)))
    range.$gte = new Date(req.query.from);
  if (req.query.to && !isNaN(new Date(req.query.to))) {
    const d = new Date(req.query.to);
    d.setHours(23, 59, 59, 999);
    range.$lte = d;
  }
  if (Object.keys(range).length) filter.createdAt = range;

  const purchases = await Purchase.find(filter)
    .populate({
      path: "course",
      select: "title price boardOrGrade subjectName instructor",
      populate: { path: "instructor", select: "name mobile userId" },
    })
    .sort({ createdAt: -1 })
    .lean();

  const entries = purchases
    .filter((p) => p.course) 
    .map((p) => {
      const crs = p.course || {};
      const teacher = crs.instructor;
      return {
        id: String(p._id),
        date: p.createdAt,
        type: "COURSE_PURCHASE",
        typeLabel: "Course Purchase",
        title: crs.title || "Course Batch",
        subtitle: [crs.boardOrGrade, crs.subjectName]
          .filter(Boolean)
          .join(" • "),
        party: teacher
          ? {
              name: teacher.name,
              userId: teacher.userId,
              mobile: teacher.mobile,
            }
          : null,
        amount: p.amountPaid || crs.price || 0,
      };
    });

  const summary = {
    totalAmount: entries.reduce((sum, e) => sum + e.amount, 0),
    totalCount: entries.length,
  };

  const totalRecords = entries.length;

  return sendSuccess(
    res,
    200,
    "Student purchase statement retrieved successfully.",
    {
      summary,
      entries: entries.slice((page - 1) * limit, page * limit),
      pagination: {
        page,
        limit,
        totalRecords,
        totalPages: Math.max(1, Math.ceil(totalRecords / limit)),
      },
    },
  );
});

module.exports = {
  getStudentDashboardStats,
  getMyEnrolledCourses,
  browsePlatformCourses,
  enrollInCourse,
  topUpStudentWallet,
  submitStudentQuiz,
  submitStudentKyc,
  getStudentPracticeMcqs,
  getCourseRichContents,
  getStudentPurchaseStatement,
};
