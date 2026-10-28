const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Course title is required"],
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      index: true,
      lowercase: true,
      trim: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category is required"],
      index: true,
    },
    state: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "State",
      index: true,
    },
    stateCode: {
      type: String,
      default: "GLOBAL",
      uppercase: true,
      index: true,
    },
    boardOrGrade: {
      type: String,
      trim: true,
    },
    subCategory: {
      type: String,
      trim: true,
      index: true,
    },
    subCategoryTitle: {
      type: String,
      trim: true,
    },
    stream: {
      type: String,
      trim: true,
      index: true,
    },
    subjectName: {
      type: String,
      default: "All Subjects",
      trim: true,
      index: true,
    },
    subjects: {
      type: [String],
      default: [],
      index: true,
    },
    description: {
      type: String,
      trim: true,
    },
    price: {
      type: Number,
      default: 0,
    },
    originalPrice: {
      type: Number,
      default: 0,
    },
    validityDays: {
      type: Number,
      default: 365,
    },
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    thumbnail: {
      type: String,
      default:
        "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800",
    },
    courseMode: {
      type: String,
      enum: ["LIVE_ONLINE", "RECORDED_VIDEO", "HYBRID"],
      default: "RECORDED_VIDEO",
    },
    liveMeetingUrl: {
      type: String,
      trim: true,
    },
    lectureVideoUrl: {
      type: String,
      trim: true,
    },
    demoVideoUrl: {
      type: String,
      trim: true,
    },
    liveSchedule: {
      type: String,
      trim: true,
    },
    ebookTitle: {
      type: String,
      trim: true,
    },
    ebookPdfUrl: {
      type: String,
      trim: true,
    },
    syllabusTopics: {
      type: [String],
      default: [],
    },
    inclusions: {
      totalLectures: { type: Number, default: 0 },
      totalHours: { type: Number, default: 0 },
      totalEbooks: { type: Number, default: 0 },
      totalLiveSessions: { type: Number, default: 0 },
      totalMockTests: { type: Number, default: 0 },
      hasCertificate: { type: Boolean, default: true },
      hasDoubtSupport: { type: Boolean, default: true },
      hasDownloadableNotes: { type: Boolean, default: true },
      hasLifetimeAccess: { type: Boolean, default: false },
    },
    curriculum: [
      {
        title: { type: String, trim: true },
        description: { type: String, trim: true },
        lectureCount: { type: Number, default: 0 },
        durationMinutes: { type: Number, default: 0 },
      },
    ],
    studyMaterials: [
      {
        title: { type: String, trim: true },
        docType: { type: String, default: "PDF" },
        fileUrl: { type: String, trim: true },
        topic: { type: String, trim: true },
      },
    ],
    mockTests: [
      {
        title: { type: String, trim: true },
        topic: { type: String, trim: true },
        durationMinutes: { type: Number, default: 30 },
        totalQuestions: { type: Number, default: 10 },
        testUrl: { type: String, trim: true },
        questions: [
          {
            questionText: { type: String, trim: true },
            options: [{ type: String, trim: true }],
            correctOption: { type: Number, min: 0, max: 3, default: 0 },
            explanation: { type: String, trim: true },
          },
        ],
      },
    ],
   
    richContents: [
      {
        title: { type: String, required: true, trim: true },
        topic: { type: String, default: "All Topics", trim: true },
        html: { type: String, required: true },
      },
    ],
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

// Pre-validate hook to generate slug if missing and sync subjects/subjectName
courseSchema.pre("validate", function (next) {
  if (!this.slug && this.title) {
    const slugified = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
    const randomSuffix = Math.random().toString(36).substring(2, 6);
    this.slug = `${slugified}-${randomSuffix}`;
  }

  // Ensure subjects array and subjectName string stay synchronized
  if (Array.isArray(this.subjects) && this.subjects.length > 0) {
    this.subjects = this.subjects.map((s) => String(s).trim()).filter(Boolean);
    if (!this.subjectName || this.subjectName === "All Subjects") {
      this.subjectName = this.subjects.join(", ");
    }
  } else if (this.subjectName) {
    const parsed = String(this.subjectName)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (parsed.length > 0) {
      this.subjects = parsed;
    }
  }

  next();
});

// Compound indexes for optimal state-localized query execution
courseSchema.index({ category: 1, stateCode: 1, active: 1 });
courseSchema.index({ stateCode: 1, isFeatured: 1, createdAt: -1 });
courseSchema.index({ active: 1, createdAt: -1 });
courseSchema.index({ courseMode: 1, createdAt: -1 });
courseSchema.index({ price: 1, createdAt: -1 });
courseSchema.index({ title: 1, active: 1 });

const Course = mongoose.model("Course", courseSchema);

module.exports = Course;
