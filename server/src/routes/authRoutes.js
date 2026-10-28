
const express = require('express');

const {
  register,
  verifyOTP,
  verifyEmailOTP,
  login,
  logout,
  getMe,
  updateStatePreference,
  updateStudentPreference,
  refreshAccessToken,
  getExecutiveRegistrationStatus,
  registerExecutive,
} = require('../controllers/authController');

const { protect } = require('../middlewares/authMiddleware');

const {
  registerSchema,
  loginSchema,
  verifyOtpSchema,
  statePreferenceSchema,
  validateRequest,
} = require('../validators/authValidator');

const router = express.Router();

// Executive: check registration status.
router.get(
  '/executive/registration-status',
  getExecutiveRegistrationStatus
);

// Executive: first-time registration.
router.post(
  '/executive/register',
  registerExecutive
);

// Existing public authentication routes.
router.post('/register', validateRequest(registerSchema), register);
router.post('/verify-otp', validateRequest(verifyOtpSchema), verifyOTP);
router.post('/verify-email-otp', verifyEmailOTP);
router.post('/login', validateRequest(loginSchema), login);
router.post('/logout', logout);
router.post('/refresh-token', refreshAccessToken);

// Protected routes.
router.use(protect);

router.get('/me', getMe);

router.put(
  '/state',
  validateRequest(statePreferenceSchema),
  updateStatePreference
);

router.put('/preference', updateStudentPreference);

module.exports = router;
