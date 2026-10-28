const { z } = require('zod');

const topupOrderSchema = z.object({
  amount: z.number().min(10, 'Minimum wallet top-up amount is ₹10')
});

const verifyPaymentSchema = z.object({
  razorpayOrderId: z.string().min(5, 'Razorpay Order ID is required'),
  razorpayPaymentId: z.string().min(5, 'Razorpay Payment ID is required'),
  razorpaySignature: z.string().min(5, 'Razorpay Signature is required'),
  amount: z.number().min(1, 'Amount is required')
});

const purchaseCourseSchema = z.object({
  courseId: z.string().min(1, 'Course ID is required')
});

const purchaseEbookSchema = z.object({
  ebookId: z.string().min(1, 'E-Book ID is required')
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
  topupOrderSchema,
  verifyPaymentSchema,
  purchaseCourseSchema,
  purchaseEbookSchema,
  validateRequest
};
