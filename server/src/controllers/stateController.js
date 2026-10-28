const State = require('../models/State');
const catchAsync = require('../utils/catchAsync');
const { sendSuccess } = require('../utils/apiResponse');

const INITIAL_INDIAN_STATES = [
  { code: 'KA', name: 'Karnataka' },
  { code: 'DL', name: 'Delhi NCR' },
  { code: 'MH', name: 'Maharashtra' },
  { code: 'TN', name: 'Tamil Nadu' },
  { code: 'GA', name: 'Goa' },
  { code: 'KL', name: 'Kerala' },
  { code: 'AP', name: 'Andhra Pradesh' },
  { code: 'TS', name: 'Telangana' },
  { code: 'UP', name: 'Uttar Pradesh' },
  { code: 'WB', name: 'West Bengal' },
  { code: 'GJ', name: 'Gujarat' },
  { code: 'RJ', name: 'Rajasthan' },
  { code: 'MP', name: 'Madhya Pradesh' },
  { code: 'PB', name: 'Punjab' },
  { code: 'HR', name: 'Haryana' },
  { code: 'BR', name: 'Bihar' }
];

/**
 * @route   GET /api/states
 * @desc    Get active Indian states & UTs
 * @access  Public
 */
const getAllStates = catchAsync(async (req, res) => {
  let states = await State.find({ active: true }).sort({ name: 1 }).lean();

  if (states.length === 0) {
    states = await State.insertMany(INITIAL_INDIAN_STATES);
  }

  return sendSuccess(res, 200, 'Indian states retrieved successfully.', {
    count: states.length,
    states
  });
});

/**
 * @route   POST /api/states/seed
 * @desc    Seed initial Indian state collection
 * @access  Public / Admin
 */
const seedStates = catchAsync(async (req, res) => {
  await State.deleteMany({});
  const states = await State.insertMany(INITIAL_INDIAN_STATES);
  return sendSuccess(res, 201, 'Indian States seeded successfully.', { states });
});

module.exports = {
  getAllStates,
  seedStates
};
