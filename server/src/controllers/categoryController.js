const Category = require('../models/Category');
const catchAsync = require('../utils/catchAsync');
const { sendSuccess } = require('../utils/apiResponse');

const CORE_CATEGORIES_DATA = [
  {
    code: 'SCHOOL_K12',
    title: 'School Education (K-12)',
    description: 'Classes 1–12 State Boards, CBSE, ICSE & Senior Secondary (+1 & +2 Science, Commerce, Arts)',
    icon: 'GraduationCap',
    gradient: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
    sequence: 1
  },
  {
    code: 'COMPETITIVE_EXAMS',
    title: 'Competitive & Entrance Exams',
    description: 'NEET, JEE, NET, GMAT, Navodaya Entrance & National Talent Search Preparation',
    icon: 'Sparkles',
    gradient: 'linear-gradient(135deg, #0EA5E9 0%, #3B82F6 100%)',
    sequence: 2
  },
  {
    code: 'HIGHER_EDU',
    title: 'Higher Education (UG & PG)',
    description: 'Master of Arts (M.A), M.Com, M.Sc, MBA & Degree Specialty Courses',
    icon: 'BookOpen',
    gradient: 'linear-gradient(135deg, #8B5CF6 0%, #D946EF 100%)',
    sequence: 3
  },
  {
    code: 'STATE_GOVT_JOBS',
    title: 'State Government Jobs Prep',
    description: 'KAS, FDA, SDA, GPT, Police Constable & State Commission Services',
    icon: 'ShieldCheck',
    gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    sequence: 4
  },
  {
    code: 'CENTRAL_GOVT_JOBS',
    title: 'Central Government Jobs Prep',
    description: 'Banking (IBPS, SBI), Railway Recruitment Board (RRB), Civil Services (IAS/UPSC)',
    icon: 'Landmark',
    gradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
    sequence: 5
  },
  {
    code: 'TEACHER_PREP',
    title: 'Teacher Certifications & TET',
    description: 'B.Ed, M.Ed, TET, CTET & Educator Qualification Examinations',
    icon: 'Award',
    gradient: 'linear-gradient(135deg, #F43F5E 0%, #E11D48 100%)',
    sequence: 6
  }
];

/**
 * @route   GET /api/categories
 * @desc    Fetch all 6 main categories sorted by sequence
 * @access  Public
 */
const getAllCategories = catchAsync(async (req, res) => {
  let categories = await Category.find({ active: true }).sort({ sequence: 1 }).lean();

  if (categories.length === 0) {
    categories = await Category.insertMany(CORE_CATEGORIES_DATA);
  }

  return sendSuccess(res, 200, 'Main educational categories retrieved successfully.', {
    count: categories.length,
    categories
  });
});

/**
 * @route   POST /api/categories/seed
 * @desc    Seed initial 6 core categories into database
 * @access  Public / Admin
 */
const seedCategories = catchAsync(async (req, res) => {
  await Category.deleteMany({});
  const categories = await Category.insertMany(CORE_CATEGORIES_DATA);
  return sendSuccess(res, 201, '6 Core Categories seeded successfully.', { categories });
});

module.exports = {
  getAllCategories,
  seedCategories
};
