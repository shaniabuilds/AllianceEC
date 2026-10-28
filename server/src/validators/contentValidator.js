const { z } = require('zod');

const createCourseSchema = z.object({
  title: z.string().min(3, 'Course title must be at least 3 characters'),
  categoryId: z.string().min(1, 'Category ID is required'),
  stateCode: z.string().optional(),
  boardOrGrade: z.string().optional(),
  subCategory: z.string().optional(),
  subCategoryTitle: z.string().optional(),
  stream: z.string().optional(),
  description: z.string().optional(),
  price: z.number().min(0, 'Price cannot be negative').optional(),
  originalPrice: z.number().min(0).optional(),
  validityDays: z.number().min(1).optional(),
  thumbnail: z.string().optional(),
  courseMode: z.string().optional(),
  liveMeetingUrl: z.string().optional(),
  lectureVideoUrl: z.string().optional(),
  subjectName: z.string().optional(),
  subjects: z.union([z.array(z.string()), z.string()]).optional(),
  isFeatured: z.boolean().optional()
}).passthrough();

const createSubjectSchema = z.object({
  title: z.string().min(2, 'Subject title must be at least 2 characters'),
  subjectCode: z.string().min(2, 'Subject code is required (e.g. PHY-10)'),
  courseId: z.string().min(1, 'Course ID is required'),
  icon: z.string().optional(),
  colorBadge: z.string().optional(),
  sequence: z.number().min(1).optional()
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
  createCourseSchema,
  createSubjectSchema,
  validateRequest
};
