const mongoose = require('mongoose');
const Chapter = require('../models/Chapter');
const Subject = require('../models/Subject');
const LearningAsset = require('../models/LearningAsset');
const catchAsync = require('../utils/catchAsync');
const { sendSuccess } = require('../utils/apiResponse');
const AppError = require('../utils/appError');

/**
 * @route   GET /api/chapters
 * @desc    Fetch ordered list of chapters under a subject
 * @access  Public
 */
const getChaptersBySubject = catchAsync(async (req, res, next) => {
  const { subjectId } = req.query;

  if (!subjectId || !mongoose.Types.ObjectId.isValid(subjectId)) {
    return next(new AppError('Please provide a valid subjectId query parameter.', 400));
  }

  const chapters = await Chapter.find({ subject: subjectId })
    .sort({ sequence: 1 })
    .lean();

  return sendSuccess(res, 200, 'Subject chapters fetched successfully.', {
    count: chapters.length,
    chapters
  });
});

/**
 * @route   POST /api/chapters
 * @desc    Create a new Chapter (Level 5)
 * @access  Private (Teacher / Educator / Admin)
 */
const createChapter = catchAsync(async (req, res, next) => {
  const { title, subjectId, chapterCode, sequence, isFreeDemo } = req.body;

  if (!mongoose.Types.ObjectId.isValid(subjectId)) {
    return next(new AppError('Invalid subjectId format.', 400));
  }

  const subjectObj = await Subject.findById(subjectId).lean();
  if (!subjectObj) {
    return next(new AppError('Parent subject not found.', 404));
  }

  const newChapter = await Chapter.create({
    title,
    chapterCode: chapterCode ? chapterCode.toUpperCase() : undefined,
    subject: subjectObj._id,
    sequence: sequence || 1,
    isFreeDemo: isFreeDemo || false
  });

  return sendSuccess(res, 201, 'Chapter created successfully.', { chapter: newChapter });
});

/**
 * @route   POST /api/chapters/seed
 * @desc    Seed sample chapters & multimodal learning assets
 * @access  Public / Admin
 */
const seedChapters = catchAsync(async (req, res) => {
  let subjects = await Subject.find({}).lean();
  if (subjects.length === 0) {
    return sendSuccess(res, 200, 'No subjects found to attach chapters. Please seed courses & subjects first.', {
      chapters: []
    });
  }

  const targetSubject = subjects[0];
  await Chapter.deleteMany({ subject: targetSubject._id });

  const sampleChapters = await Chapter.insertMany([
    {
      title: 'Chapter 1: Units, Vectors & Kinematics Motion',
      chapterCode: 'CHAP-01',
      subject: targetSubject._id,
      sequence: 1,
      totalAssets: 3,
      isFreeDemo: true
    },
    {
      title: 'Chapter 2: Laws of Motion, Friction & Work-Energy',
      chapterCode: 'CHAP-02',
      subject: targetSubject._id,
      sequence: 2,
      totalAssets: 2,
      isFreeDemo: false
    }
  ]);

  await LearningAsset.deleteMany({ chapter: sampleChapters[0]._id });

  const sampleAssets = await LearningAsset.insertMany([
    {
      title: '🎥 HD Lesson 1: Introduction to Vectors & 3D Space Coordinates',
      assetType: 'VIDEO_DRM',
      chapter: sampleChapters[0]._id,
      subject: targetSubject._id,
      contentUrl: 'https://stream.eduverse.in/hls/physics_vectors_hd/master.m3u8',
      durationSeconds: 1240,
      sequence: 1,
      isFreePreview: true
    },
    {
      title: '📖 Study Article: Kinematics Equations & Free Fall Notes',
      assetType: 'LESSON_TEXT',
      chapter: sampleChapters[0]._id,
      subject: targetSubject._id,
      textContent: '<h3>Kinematics Fundamentals</h3><p>Kinematics equations govern 1D & 2D uniform acceleration motion under gravity.</p>',
      durationSeconds: 300,
      sequence: 2,
      isFreePreview: true
    },
    {
      title: '📝 Downloadable PDF Notes: Vectors Formulas & Solved Examples',
      assetType: 'NOTE_PDF',
      chapter: sampleChapters[0]._id,
      subject: targetSubject._id,
      contentUrl: 'https://cdn.eduverse.in/pdf/physics_ch1_vectors.pdf',
      durationSeconds: 600,
      sequence: 3,
      isFreePreview: false
    }
  ]);

  return sendSuccess(res, 201, 'Sample chapters & learning assets seeded successfully.', {
    chapters: sampleChapters,
    assets: sampleAssets
  });
});

module.exports = {
  getChaptersBySubject,
  createChapter,
  seedChapters
};
