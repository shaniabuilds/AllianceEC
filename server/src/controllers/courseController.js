const mongoose = require("mongoose");
const Course = require("../models/Course");
const Category = require("../models/Category");
const State = require("../models/State");
const Subject = require("../models/Subject");
const catchAsync = require("../utils/catchAsync");
const { sendSuccess, sendPaginatedSuccess } = require("../utils/apiResponse");
const AppError = require("../utils/appError");
const {
  INDIAN_STATES,
  CORE_MODULES_TAXONOMY,
} = require("../config/categoryTaxonomy");

/**
 * @route   GET /api/courses/taxonomy
 * @desc    Fetch complete 6-Level taxonomy master tree & all 36 states
 * @access  Public
 */
const getTaxonomyTree = catchAsync(async (req, res) => {
  const categories = await Category.find({ active: true })
    .sort({ sequence: 1 })
    .lean();
  return sendSuccess(res, 200, "Taxonomy master tree retrieved successfully.", {
    states: INDIAN_STATES,
    modules: CORE_MODULES_TAXONOMY,
    categories,
  });
});

/**
 * @route   GET /api/courses
 * @desc    Fetch paginated state-localized courses by Category, SubCategory & State
 * @access  Public
 */
const getCoursesByCategory = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 12;
  const skip = (page - 1) * limit;

  const filter = { active: true };

  if (req.query.categoryId) {
    filter.category = req.query.categoryId;
  }

  if (req.query.subCategory) {
    filter.subCategory = req.query.subCategory;
  }

  if (req.query.stream) {
    filter.stream = req.query.stream;
  }

  // Filter by state: show courses for specific state OR global national courses
  if (req.query.stateCode && req.query.stateCode !== "GLOBAL") {
    filter.$or = [
      { stateCode: req.query.stateCode.toUpperCase() },
      { stateCode: "GLOBAL" },
    ];
  }

  if (req.query.search) {
    filter.$or = [
      { title: { $regex: req.query.search, $options: "i" } },
      { boardOrGrade: { $regex: req.query.search, $options: "i" } },
      { subCategoryTitle: { $regex: req.query.search, $options: "i" } },
    ];
  }

  const [totalRecords, courses] = await Promise.all([
    Course.countDocuments(filter),
    Course.find(filter)
      .select("-richContents")
      .populate("category", "code title icon")
      .populate("instructor", "name userId role")
      .sort({ isFeatured: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  return sendPaginatedSuccess(
    res,
    200,
    "Courses fetched successfully.",
    courses,
    page,
    limit,
    totalRecords,
  );
});

/**
 * @route   GET /api/courses/:id
 * @desc    Get detailed course overview with subjects list
 * @access  Public
 */
const getCourseById = catchAsync(async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return next(
      new AppError(`Invalid course ID format: ${req.params.id}`, 400),
    );
  }

  const course = await Course.findById(req.params.id)
    .populate("category", "code title icon")
    .populate("state", "code name")
    .populate("instructor", "name userId role")
    .lean();

  if (!course) {
    return next(new AppError("Course not found.", 404));
  }

  // Paid rich content publicly expose mat karo: sirf titles/topics preview
  course.richContentsPreview = (course.richContents || []).map((rc) => ({
    title: rc.title,
    topic: rc.topic
  }));
  delete course.richContents;

  const subjects = await Subject.find({ course: course._id })
    .sort({ sequence: 1 })
    .lean();

  return sendSuccess(res, 200, "Course details fetched successfully.", {
    course,
    subjects,
  });
});

/**
 * @route   POST /api/courses
 * @desc    Create a new Course (Level 3) with full 6-Level taxonomy
 * @access  Private (Teacher / Educator / Admin)
 */
const createCourse = catchAsync(async (req, res, next) => {
  const {
    title,
    categoryId,
    stateCode,
    boardOrGrade,
    subCategory,
    subCategoryTitle,
    stream,
    subjectName,
    subjects,
    description,
    price,
    originalPrice,
    validityDays,
    thumbnail,
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
    isFeatured,
  } = req.body;

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

  let stateObj = null;
  if (stateCode && stateCode !== "GLOBAL") {
    stateObj = await State.findOne({ code: stateCode.toUpperCase() }).lean();
  }

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

  const newCourse = await Course.create({
    title,
    category: categoryObj ? categoryObj._id : undefined,
    state: stateObj ? stateObj._id : undefined,
    stateCode: stateCode ? stateCode.toUpperCase() : "GLOBAL",
    boardOrGrade: boardOrGrade || subCategoryTitle || "General Batch",
    subCategory,
    subCategoryTitle,
    stream,
    subjectName: finalSubjectName,
    subjects: finalSubjects,
    description,
    price: price || 0,
    originalPrice: originalPrice || price || 0,
    validityDays: validityDays || 365,
    instructor: req.user._id,
    thumbnail:
      thumbnail ||
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800",
    courseMode: courseMode || "RECORDED_VIDEO",
    liveMeetingUrl,
    lectureVideoUrl,
    demoVideoUrl,
    liveSchedule,
    ebookTitle,
    ebookPdfUrl,
    syllabusTopics: Array.isArray(syllabusTopics) ? syllabusTopics : [],
    inclusions: inclusions || undefined,
    curriculum: Array.isArray(curriculum) ? curriculum : [],
    isFeatured: isFeatured || false,
  });

  return sendSuccess(
    res,
    201,
    "Course created successfully with 6-Level hierarchy.",
    { course: newCourse },
  );
});

/**
 * @route   POST /api/courses/seed
 * @desc    Seed sample courses for all 6 Core Modules (Image 1 Architecture)
 * @access  Public / Admin
 */
const seedCourses = catchAsync(async (req, res) => {
  let categories = await Category.find({}).lean();
  if (categories.length === 0) {
    const categoriesToInsert = CORE_MODULES_TAXONOMY.map((m, idx) => ({
      code: m.code,
      title: m.title,
      description: m.description,
      icon: m.icon,
      sequence: idx + 1,
    }));
    await Category.insertMany(categoriesToInsert);
    categories = await Category.find({}).lean();
  }

  const defaultCatId = categories[0]?._id;
  const getCatId = (code) => {
    const found = categories.find((c) => c.code === code);
    return found ? found._id : defaultCatId;
  };

  await Course.deleteMany({});

  const sampleCourses = [
    // Module I: School Education
    {
      title: "CBSE Class 10th All-in-One Science & Maths Board Prep",
      slug: "cbse-class-10-board-prep",
      category: getCatId("SCHOOL_K12"),
      subCategory: "CBSE_BOARD",
      subCategoryTitle: "CBSE Board (Classes 1–10)",
      stateCode: "GLOBAL",
      boardOrGrade: "CBSE Class 10",
      description:
        "Complete NCERT video solutions, chapterwise notes, and mock board tests for Class 10.",
      price: 1499,
      originalPrice: 2999,
      isFeatured: true,
    },
    {
      title: "Karnataka State Board SSLC Kannada & English Medium Crash Course",
      slug: "karnataka-sslc-board-prep",
      category: getCatId("SCHOOL_K12"),
      subCategory: "STATE_BOARD_MEDIUM",
      subCategoryTitle: "State Board - State Medium / Bilingual",
      stateCode: "KA",
      boardOrGrade: "Karnataka State SSLC",
      description:
        "Bilingual Karnataka Secondary Board exam preparation module with model question papers.",
      price: 1299,
      originalPrice: 2499,
      isFeatured: true,
    },
    {
      title: "12th PUC Science Stream (Physics, Chem, Math, Bio) Master Batch",
      slug: "12th-puc-science-stream",
      category: getCatId("SCHOOL_K12"),
      subCategory: "PUC_SENIOR_SECONDARY",
      subCategoryTitle: "PUC / Senior Secondary (+1 & +2)",
      stream: "Science Stream (Subjects 1–6)",
      stateCode: "GLOBAL",
      boardOrGrade: "+2 Senior Secondary Science",
      description:
        "Comprehensive 2-year integrated course for Class 12 Science stream board & CET exams.",
      price: 2499,
      originalPrice: 4999,
      isFeatured: true,
    },
    // Module II: Competitive Exams
    {
      title: "NEET UG 2026 Physics & Chemistry Concept Booster",
      slug: "neet-ug-2026-concept-booster",
      category: getCatId("COMPETITIVE_EXAMS"),
      subCategory: "NEET",
      subCategoryTitle: "NEET (National Eligibility cum Entrance Test)",
      stateCode: "GLOBAL",
      boardOrGrade: "NEET Entrance",
      description:
        "Top-ranker NEET preparation suite with 10,000+ chapterwise MCQs and speed solution techniques.",
      price: 2999,
      originalPrice: 5999,
      isFeatured: true,
    },
    {
      title: "JEE Main & Advanced Mathematics & Physics Intensive",
      slug: "jee-main-advanced-maths-physics",
      category: getCatId("COMPETITIVE_EXAMS"),
      subCategory: "JEE",
      subCategoryTitle: "JEE (Joint Entrance Examination)",
      stateCode: "GLOBAL",
      boardOrGrade: "JEE Entrance",
      description:
        "Advanced problem solving techniques, shortcut methods, and 50+ full length NTA mock tests.",
      price: 3499,
      originalPrice: 6999,
      isFeatured: true,
    },
    // Module III: Higher Education
    {
      title: "MBA Financial Management & Strategic Leadership Specialization",
      slug: "mba-financial-management-leadership",
      category: getCatId("HIGHER_EDU"),
      subCategory: "MBA",
      subCategoryTitle: "MBA (Master of Business Administration)",
      stateCode: "GLOBAL",
      boardOrGrade: "Post Graduation (MBA)",
      description:
        "Master business analytics, financial modeling, marketing strategies & case studies.",
      price: 3999,
      originalPrice: 7999,
      isFeatured: true,
    },
    // Module IV: State Govt Jobs
    {
      title:
        "KAS (Karnataka Administrative Services) Prelims & Mains General Studies",
      slug: "kas-prelims-mains-gs",
      category: getCatId("STATE_GOVT_JOBS"),
      subCategory: "KAS",
      subCategoryTitle: "KAS (Karnataka Administrative Services)",
      stateCode: "KA",
      boardOrGrade: "KAS State Exam",
      description:
        "Complete Karnataka history, polity, economy, geography, and current affairs master class.",
      price: 2499,
      originalPrice: 4999,
      isFeatured: true,
    },
    {
      title: "FDA & SDA State Revenue Exam Complete Coaching Batch",
      slug: "fda-sda-state-revenue-exam",
      category: getCatId("STATE_GOVT_JOBS"),
      subCategory: "FDA",
      subCategoryTitle: "FDA (First Division Assistant)",
      stateCode: "KA",
      boardOrGrade: "FDA / SDA State Job",
      description:
        "General Kannada, General Knowledge & Computer Literacy comprehensive course.",
      price: 1899,
      originalPrice: 3799,
      isFeatured: true,
    },
    // Module V: Central Govt Jobs
    {
      title: "Banking Exams 2026 (IBPS PO, SBI Clerk & RRB) Complete Prep",
      slug: "banking-ibps-sbi-po-clerk",
      category: getCatId("CENTRAL_GOVT_JOBS"),
      subCategory: "BANKING",
      subCategoryTitle: "Banking Exams (IBPS, SBI, etc.)",
      stateCode: "GLOBAL",
      boardOrGrade: "Banking Competitive Exam",
      description:
        "Quantitative Aptitude, Logical Reasoning, English Language, and Banking Awareness.",
      price: 1999,
      originalPrice: 3999,
      isFeatured: true,
    },
    // Module VI: Teacher Prep
    {
      title: "CTET & State TET Paper 1 & Paper 2 Child Pedagogy Master Course",
      slug: "ctet-state-tet-paper-1-2",
      category: getCatId("TEACHER_PREP"),
      subCategory: "CTET",
      subCategoryTitle: "CTET (Central Teacher Eligibility Test)",
      stateCode: "GLOBAL",
      boardOrGrade: "TET / CTET Certification",
      description:
        "Child Development, Pedagogy, EVS, Mathematics & Language 1 & 2 complete syllabus.",
      price: 1499,
      originalPrice: 2999,
      isFeatured: true,
    },
  ];

  const seeded = await Course.insertMany(sampleCourses);

  return sendSuccess(
    res,
    201,
    "Sample courses seeded successfully across all 6 Core Modules.",
    {
      count: seeded.length,
      sampleCourses: seeded,
    },
  );
});

module.exports = {
  getTaxonomyTree,
  getCoursesByCategory,
  getCourseById,
  createCourse,
  seedCourses,
};
