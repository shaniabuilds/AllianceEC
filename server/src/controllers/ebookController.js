const Ebook = require('../models/Ebook');
const Category = require('../models/Category');
const catchAsync = require('../utils/catchAsync');
const { sendSuccess, sendPaginatedSuccess } = require('../utils/apiResponse');

/**
 * @route   GET /api/ebooks
 * @desc    Fetch paginated list of active digital e-books
 * @access  Public
 */
const getAllEbooks = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const filter = { active: true };

  const [totalRecords, ebooks] = await Promise.all([
    Ebook.countDocuments(filter),
    Ebook.find(filter)
      .populate('category', 'code title icon')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
  ]);

  return sendPaginatedSuccess(
    res,
    200,
    'E-books catalog fetched successfully.',
    ebooks,
    page,
    limit,
    totalRecords
  );
});

/**
 * @route   POST /api/ebooks/seed
 * @desc    Seed sample digital e-books into catalog
 * @access  Public / Admin
 */
const seedEbooks = catchAsync(async (req, res) => {
  let categories = await Category.find({}).lean();
  const catId = categories.length > 0 ? categories[0]._id : undefined;

  await Ebook.deleteMany({});

  await Ebook.insertMany([
    {
      title: 'NCERT Class 10 Physics Master Formulas & Quick Revision Book',
      author: 'Dr. Vikram Sharma',
      category: catId,
      description: 'Comprehensive formula sheet, vector shortcuts & 200+ solved numerical problems.',
      price: 199,
      coverImage: 'https://images.unsplash.com/photo-1532012164546-f432f2e3d368?q=80&w=800',
      samplePdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      fullPdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      pages: 140
    },
    {
      title: 'NEET UG Biology 5000+ High-Yield MCQ Question Bank',
      author: 'Prof. Ananya Sen',
      category: catId,
      description: 'NCERT line-by-line question bank with detailed diagrams & memory trick mnemonics.',
      price: 299,
      coverImage: 'https://images.unsplash.com/photo-1576086213369-97a306d36557?q=80&w=800',
      samplePdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      fullPdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      pages: 320
    },
    {
      title: 'CBSE Class 10 Mathematics Complete Formula & Exemplar Vault',
      author: 'Er. Rajesh Kumar',
      category: catId,
      description: 'Chapterwise proofs, theorem mind-maps, trigonometry tables & standard CBSE 10 sample papers.',
      price: 149,
      coverImage: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?q=80&w=800',
      samplePdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      fullPdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      pages: 180
    },
    {
      title: 'General Knowledge & Indian Polity Rapid Revision Handbook',
      author: 'Dr. M. S. Rao',
      category: catId,
      description: 'Articles, amendments, historical timelines & mock questions for state and central competitive exams.',
      price: 249,
      coverImage: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=800',
      samplePdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      fullPdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      pages: 250
    }
  ]);

  const sampleEbooks = await Ebook.find({}).lean();

  return sendSuccess(res, 201, 'Sample e-books seeded successfully.', { sampleEbooks });
});

module.exports = {
  getAllEbooks,
  seedEbooks
};
