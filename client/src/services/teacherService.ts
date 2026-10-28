import { apiFetch } from "./apiClient";
import {
  CourseRecord,
  EnrolledStudentRecord,
  CourseInclusions,
  CourseCurriculumItem,
  CourseStudyMaterialItem,
  CourseMockTestItem,
  CourseRichContentItem,
} from "./adminService";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:5000/api';

export interface TeacherStats {
  totalRevenue: number;
  courseRoyaltyEarnings?: number;
  referralEarnings?: number;
  totalStudents: number;
  activeCoursesCount: number;
  walletBalance: number;
  withdrawableBalance?: number;
  totalWithdrawn?: number;
}

export interface CreateTeacherCoursePayload {
  title: string;
  categoryId?: string;
  subCategory?: string;
  subCategoryTitle?: string;
  stream?: string;
  subjectName?: string;
  subjects?: string[];
  description?: string;
  price: number;
  originalPrice?: number;
  stateCode?: string;
  boardOrGrade?: string;
  courseMode?: "LIVE_ONLINE" | "RECORDED_VIDEO" | "HYBRID";
  liveMeetingUrl?: string;
  lectureVideoUrl?: string;
  demoVideoUrl?: string;
  liveSchedule?: string;
  ebookTitle?: string;
  ebookPdfUrl?: string;
  syllabusTopics?: string[];
  inclusions?: CourseInclusions;
  curriculum?: CourseCurriculumItem[];
  studyMaterials?: CourseStudyMaterialItem[];
  mockTests?: CourseMockTestItem[];
  richContents?: CourseRichContentItem[];
  thumbnail?: string;
}

export interface CreateMcqPayload {
  courseId?: string;
  quizSetTitle?: string;
  stateCode?: string;
  boardOrGrade?: string;
  subCategory?: string;
  subjectName?: string;
  questions?: Array<{
    courseId?: string;
    quizSetTitle?: string;
    questionText: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    correctOptionIndex: number;
    explanation?: string;
    marks?: number;
  }>;
  questionText?: string;
  optionA?: string;
  optionB?: string;
  optionC?: string;
  optionD?: string;
  correctOptionIndex?: number;
  explanation?: string;
  marks?: number;
}

export interface McqRecord {
  _id: string;
  course?:
    | {
        _id: string;
        title: string;
        stateCode?: string;
        boardOrGrade?: string;
        subjectName?: string;
      }
    | any;
  quizSetTitle?: string;
  quizSetId?: string;
  questionText: string;
  options: string[];
  correctOption?: number;
  explanation?: string;
  marks?: number;
  createdAt?: string;
}

export interface McqAttemptRecord {
  _id: string;
  course?:
    | {
        _id: string;
        title: string;
        stateCode?: string;
        boardOrGrade?: string;
        subjectName?: string;
      }
    | any;
  quizSetTitle?: string;
  quizSetId?: string;
  user?: {
    _id: string;
    name: string;
    mobile: string;
    email?: string;
    userId: string;
  };
  subject?: { _id: string; title: string };
  score: number;
  totalMarks: number;
  percentage: number;
  passed: boolean;
  createdAt: string;
}

/**
 * Fetch instructor metrics overview (Total sales, student count, wallet balance)
 */
export const fetchTeacherStats = async () => {
  return apiFetch<{ stats: TeacherStats }>("/teacher/stats");
};

/**
 * Fetch all courses created by logged-in teacher
 */
export const fetchTeacherCourses = async () => {
  return apiFetch<{ count: number; courses: CourseRecord[] }>(
    "/teacher/courses",
  );
};

/**
 * Fetch all MCQ questions in bank created by instructor
 */
export const fetchTeacherMcqs = async () => {
  return apiFetch<{ count: number; mcqs: McqRecord[] }>("/teacher/mcqs");
};

/**
 * Fetch student quiz attempts & results
 */
export const fetchTeacherMcqAttempts = async () => {
  return apiFetch<{ count: number; attempts: McqAttemptRecord[] }>(
    "/teacher/mcq-attempts",
  );
};

/**
 * Create a new course by Teacher (supports optional 2MB Cloudinary image upload)
 */
export const createTeacherCourse = async (
  payload: CreateTeacherCoursePayload,
  thumbnailFile?: File | null,
) => {
  if (thumbnailFile) {
    const formData = new FormData();
    formData.append("title", payload.title);
    if (payload.categoryId) formData.append("categoryId", payload.categoryId);
    if (payload.subCategory)
      formData.append("subCategory", payload.subCategory);
    if (payload.subCategoryTitle)
      formData.append("subCategoryTitle", payload.subCategoryTitle);
    if (payload.stream) formData.append("stream", payload.stream);
    if (payload.subjects)
      formData.append("subjects", JSON.stringify(payload.subjects));
    if (payload.subjectName)
      formData.append("subjectName", payload.subjectName);
    if (payload.description)
      formData.append("description", payload.description);
    formData.append("price", payload.price.toString());
    if (payload.originalPrice)
      formData.append("originalPrice", payload.originalPrice.toString());
    if (payload.stateCode) formData.append("stateCode", payload.stateCode);
    if (payload.boardOrGrade)
      formData.append("boardOrGrade", payload.boardOrGrade);
    if (payload.courseMode) formData.append("courseMode", payload.courseMode);
    if (payload.liveMeetingUrl)
      formData.append("liveMeetingUrl", payload.liveMeetingUrl);
    if (payload.lectureVideoUrl)
      formData.append("lectureVideoUrl", payload.lectureVideoUrl);
    if (payload.demoVideoUrl)
      formData.append("demoVideoUrl", payload.demoVideoUrl);
    if (payload.liveSchedule)
      formData.append("liveSchedule", payload.liveSchedule);
    if (payload.ebookTitle) formData.append("ebookTitle", payload.ebookTitle);
    if (payload.ebookPdfUrl)
      formData.append("ebookPdfUrl", payload.ebookPdfUrl);
    if (payload.syllabusTopics)
      formData.append("syllabusTopics", JSON.stringify(payload.syllabusTopics));
    if (payload.inclusions)
      formData.append("inclusions", JSON.stringify(payload.inclusions));
    if (payload.curriculum)
      formData.append("curriculum", JSON.stringify(payload.curriculum));
    if (payload.curriculum)
      formData.append("curriculum", JSON.stringify(payload.curriculum));
    if (payload.studyMaterials)
      formData.append("studyMaterials", JSON.stringify(payload.studyMaterials));
    if (payload.mockTests)
      formData.append("mockTests", JSON.stringify(payload.mockTests));
    if (payload.richContents)
      formData.append("richContents", JSON.stringify(payload.richContents));
    formData.append("thumbnailFile", thumbnailFile);
    formData.append("thumbnailFile", thumbnailFile);

    const token =
      localStorage.getItem("token") || localStorage.getItem("accessToken");
    const res = await fetch(`${API_BASE_URL}/teacher/courses`, {
      method: "POST",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) {
      return {
        success: false,
        message: data.message || "Failed to create course.",
      };
    }
    return { success: true, data: data.data as { course: CourseRecord } };
  } else {
    return apiFetch<{ course: CourseRecord }>("/teacher/courses", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }
};

/**
 * Bulk create courses directly by Teacher / Instructor via parsed Excel/CSV
 */
export const bulkCreateTeacherCourses = async (
  courses: Partial<CreateTeacherCoursePayload>[],
) => {
  return apiFetch<{
    totalRequested: number;
    createdCount: number;
    failedCount: number;
    createdCourses: CourseRecord[];
    errors: Array<{ row: number; error: string }>;
  }>("/teacher/courses/bulk", {
    method: "POST",
    body: JSON.stringify({ courses }),
  });
};

/**
 * Update course details by Teacher / Instructor
 */
export const updateTeacherCourse = async (
  courseId: string,
  payload: CreateTeacherCoursePayload,
) => {
  return apiFetch<{ course: CourseRecord }>(`/teacher/courses/${courseId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
};

/**
 * Delete course by Teacher / Instructor
 */
export const deleteTeacherCourse = async (courseId: string) => {
  return apiFetch<{ courseId: string }>(`/teacher/courses/${courseId}`, {
    method: "DELETE",
  });
};

/**
 * Add a new MCQ question to question bank
 */
export const createTeacherMcq = async (payload: CreateMcqPayload) => {
  return apiFetch<{ mcq?: any; count?: number; mcqs?: any[] }>(
    "/teacher/mcqs",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
};

/**
 * Delete an MCQ question from question bank
 */
export const deleteTeacherMcq = async (id: string) => {
  return apiFetch<{ message?: string }>(`/teacher/mcqs/${id}`, {
    method: "DELETE",
  });
};

/**
 * Submit royalty payout withdrawal request to Super Admin
 */
export const requestTeacherPayout = async (amount: number) => {
  return apiFetch<{ transaction: any; currentWalletBalance: number }>(
    "/teacher/payouts/request",
    {
      method: "POST",
      body: JSON.stringify({ amount }),
    },
  );
};

/**
 * Fetch enrolled students roster and royalty earnings for a teacher's course
 */
export const fetchTeacherCourseStudents = async (courseId: string) => {
  return apiFetch<{
    course: CourseRecord & {
      totalEnrolled?: number;
      totalRoyaltyEarned?: number;
    };
    enrolledStudents: EnrolledStudentRecord[];
  }>(`/teacher/courses/${courseId}/students`);
};
