const { z } = require('zod');

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters long'),
  mobile: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian mobile number (must be 10 digits starting with 6-9)'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  role: z.enum(['STUDENT', 'TEACHER', 'ADMIN']).optional(),
  stateCode: z.string().optional(),
  referredBy: z.string().optional()
});

const loginSchema = z.object({
  identifier: z.string().min(3, 'Please enter Email, Mobile Number, or User ID'),
  password: z.string().min(1, 'Password is required')
});

const verifyOtpSchema = z.object({
  mobile: z.string().regex(/^[6-9]\d{9}$/, 'Invalid mobile number'),
  otp: z.string().length(6, 'OTP must be exactly 6 digits')
});

const statePreferenceSchema = z.object({
  stateCode: z.string().min(2, 'State code is required (e.g. KA, DL)')
});

const submitKycSchema = z.object({
  documentType: z.enum(['AADHAAR', 'PAN', 'BOTH']).optional(),
  documentNumber: z.string().optional(),
  aadhaarNumber: z.string().optional(),
  panNumber: z.string().optional(),
  documentScanUrl: z.string().optional()
});

const verifyKycSchema = z.object({
  status: z.enum(['APPROVED', 'VERIFIED', 'REJECTED']),
  rejectionReason: z.string().optional()
});

const validateRequest = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map((e) => e.message).join(', ');
      return res.status(400).json({
        success: false,
        status: 'fail',
        message: `Validation Error: ${errorMessages}`
      });
    }
    next(error);
  }
};

module.exports = {
  registerSchema,
  loginSchema,
  verifyOtpSchema,
  statePreferenceSchema,
  submitKycSchema,
  verifyKycSchema,
  validateRequest
};
