const { z } = require('zod');

const preferenceSchema = z.object({
  placementPreference: z.enum(['AUTO', 'LEFT', 'RIGHT'])
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
  preferenceSchema,
  validateRequest
};
