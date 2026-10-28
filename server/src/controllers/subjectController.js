const mongoose = require('mongoose');
const Subject = require('../models/Subject');
const Course = require('../models/Course');
const catchAsync = require('../utils/catchAsync');
const { sendSuccess } = require('../utils/apiResponse');
const AppError = require('../utils/appError');

/**
 * @route   GET /api/subjects
 * @desc    Fetch list of subjects belonging to a course
 * @access  Public
 */
const getSubjectsByCourse = catchAsync(async (req, res, next) => {
  const { courseId } = req.query;

  if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
    return next(new AppError('Please provide a valid courseId query parameter.', 400));
  }

  const subjects = await Subject.find({ course: courseId })
    .sort({ sequence: 1 })
    .lean();

  return sendSuccess(res, 200, 'Course subjects retrieved successfully.', {
    count: subjects.length,
    subjects
  });
});

/**
 * @route   POST /api/subjects
 * @desc    Create a new Subject under a Course (Level 4)
 * @access  Private (Teacher / Educator / Admin)
 */
const createSubject = catchAsync(async (req, res, next) => {
  const { title, subjectCode, courseId, icon, colorBadge, sequence } = req.body;

  const courseObj = await Course.findById(courseId).lean();
  if (!courseObj) {
    return next(new AppError('Parent course not found.', 404));
  }

  const newSubject = await Subject.create({
    title,
    subjectCode: subjectCode.toUpperCase(),
    course: courseObj._id,
    icon: icon || 'BookOpen',
    colorBadge: colorBadge || '#6366F1',
    sequence: sequence || 1
  });

  return sendSuccess(res, 201, 'Subject created successfully under course.', {
    subject: newSubject
  });
});

module.exports = {
  getSubjectsByCourse,
  createSubject
};
