const { z } = require('zod');

const createChapterSchema = z.object({
  title: z.string().min(2, 'Chapter title must be at least 2 characters'),
  subjectId: z.string().min(1, 'Subject ID is required'),
  chapterCode: z.string().optional(),
  sequence: z.number().min(1).optional(),
  isFreeDemo: z.boolean().optional()
});

const createAssetSchema = z.object({
  title: z.string().min(2, 'Asset title must be at least 2 characters'),
  assetType: z.enum(['LESSON_TEXT', 'NOTE_PDF', 'VIDEO_DRM', 'MCQ_TEST']),
  chapterId: z.string().min(1, 'Chapter ID is required'),
  subjectId: z.string().min(1, 'Subject ID is required'),
  contentUrl: z.string().optional(),
  textContent: z.string().optional(),
  durationSeconds: z.number().min(0).optional(),
  sequence: z.number().min(1).optional(),
  isFreePreview: z.boolean().optional()
});

const createQuestionSchema = z.object({
  chapterId: z.string().optional(),
  subjectId: z.string().optional(),
  questionText: z.string().min(5, 'Question text must be at least 5 characters'),
  options: z.array(z.string().min(1, 'Option text cannot be empty')).length(4, 'Must provide exactly 4 options'),
  correctOption: z.number().min(0).max(3, 'Correct option index must be between 0 and 3'),
  explanation: z.string().optional(),
  marks: z.number().min(1).optional()
});

const submitQuizSchema = z.object({
  chapterId: z.string().min(1, 'Chapter ID is required'),
  answers: z.array(
    z.object({
      questionId: z.string().min(1, 'Question ID is required'),
      selectedOption: z.number().min(0).max(3, 'Option index must be 0 to 3')
    })
  ).min(1, 'At least 1 answer must be submitted')
});

const completeAssetSchema = z.object({
  subjectId: z.string().min(1, 'Subject ID is required'),
  assetId: z.string().min(1, 'Asset ID is required')
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
  createChapterSchema,
  createAssetSchema,
  createQuestionSchema,
  submitQuizSchema,
  completeAssetSchema,
  validateRequest
};
