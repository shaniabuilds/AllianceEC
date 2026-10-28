import { apiFetch } from './apiClient';
import { CourseRecord } from './adminService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export interface StudentStats {
  enrolledCoursesCount: number;
  quizAttemptsCount: number;
  walletBalance: number;
  withdrawableBalance?: number;
  purchaseBalance?: number;
  totalReferralEarned?: number;
  totalDeposited?: number;
  kycStatus: 'NOT_SUBMITTED' | 'PENDING' | 'APPROVED' | 'VERIFIED' | 'REJECTED';
  kycDocumentType?: string | null;
  kycRejectionReason?: string | null;
}

export interface QuizSubmissionAnswer {
  questionId: string;
  selectedOptionIndex: number;
}

export interface QuizAttemptResult {
  _id: string;
  score: number;
  totalMarks: number;
  percentage: number;
  passed: boolean;
  createdAt: string;
}

/**
 * Fetch 100% dynamic student metrics overview
 */
export const fetchStudentDashboardStats = async () => {
  return apiFetch<{ stats: StudentStats }>('/student/stats');
};

/**
 * Fetch all courses purchased/enrolled by logged-in student
 */
export const fetchMyEnrolledCourses = async () => {
  return apiFetch<{ count: number; courses: CourseRecord[] }>('/student/my-courses');
};

/**
 * Fetch active published courses — filtered by student preference or showAll
 */
export const fetchBrowseCourses = async (params?: {
  subCategory?: string;
  stateCode?: string;
  stream?: string;
  showAll?: boolean;
}) => {
  const searchParams = new URLSearchParams();
  if (params?.subCategory) searchParams.set('subCategory', params.subCategory);
  if (params?.stateCode) searchParams.set('stateCode', params.stateCode);
  if (params?.stream) searchParams.set('stream', params.stream);
  if (params?.showAll) searchParams.set('showAll', 'true');
  const qs = searchParams.toString();
  return apiFetch<{ count: number; courses: CourseRecord[] }>(`/student/browse-courses${qs ? `?${qs}` : ''}`);
};

/**
 * 1-Click Course Purchase & Enrollment (Deducts student wallet, credits teacher royalty)
 */
export const enrollCourse = async (courseId: string) => {
  return apiFetch<{ purchase: any; updatedWalletBalance: number; course: CourseRecord }>(`/student/enroll/${courseId}`, {
    method: 'POST'
  });
};

/**
 * Top-up student wallet balance dynamically
 */
export const topUpStudentWallet = async (amount: number) => {
  return apiFetch<{ walletBalance: number }>('/student/wallet/topup', {
    method: 'POST',
    body: JSON.stringify({ amount })
  });
};

export interface QuizSetGroup {
  quizSetId: string;
  quizSetTitle: string;
  courseId?: string | null;
  courseTitle?: string;
  subjectName?: string;
  boardOrGrade?: string;
  count: number;
  hasAttempted: boolean;
  lastAttempt?: QuizAttemptResult | null;
  mcqs: any[];
}

/**
 * Submit student quiz attempt, evaluate score, and save attempt record
 */
export const submitStudentQuiz = async (answers: QuizSubmissionAnswer[], quizSetId?: string, quizSetTitle?: string) => {
  return apiFetch<{ attempt: QuizAttemptResult }>('/student/quiz/submit', {
    method: 'POST',
    body: JSON.stringify({ answers, quizSetId, quizSetTitle })
  });
};

/**
 * Submit Aadhaar & PAN document scans (up to 2MB Cloudinary image upload for each)
 */
export const submitStudentKyc = async (
  payload:
    | {
        aadhaarNumber: string;
        aadhaarFile?: File | null;
        panNumber: string;
        panFile?: File | null;
      }
    | {
        documentType: 'AADHAAR' | 'PAN' | 'BOTH';
        documentNumber: string;
        file?: File | null;
      }
) => {
  const formData = new FormData();
  const token = localStorage.getItem('token') || localStorage.getItem('accessToken');

  if ('aadhaarNumber' in payload) {
    formData.append('aadhaarNumber', payload.aadhaarNumber);
    formData.append('panNumber', payload.panNumber);
    formData.append('documentType', 'BOTH');
    if (payload.aadhaarFile) formData.append('aadhaarScan', payload.aadhaarFile);
    if (payload.panFile) formData.append('panScan', payload.panFile);
  } else {
    formData.append('documentType', payload.documentType);
    formData.append('documentNumber', payload.documentNumber);
    if (payload.file) formData.append('documentScan', payload.file);
  }

  const res = await fetch(`${API_BASE_URL}/student/kyc`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: formData
  });

  const data = await res.json();
  if (!res.ok) {
    return { success: false, message: data.message || 'Failed to submit KYC scan.' };
  }
  return { success: true, data: data.data as { kycRecord: any } };
};

/**
 * Fetch practice MCQs exclusively for courses in which the student is ENROLLED
 */
export const fetchStudentPracticeMcqs = async () => {
  return apiFetch<{
    count: number;
    quizSets?: QuizSetGroup[];
    mcqs: any[];
    isEnrolled: boolean;
    message?: string;
    hasAttempted?: boolean;
    lastAttempt?: any;
  }>('/student/mcqs');
};


/**
 * Course ka rich (blog-style) study content.
 * Sirf enrolled student / course teacher / admin ko milta hai (baaki ko 403).
 */
export interface RichContentView {
  title: string;
  topic: string;
  html: string;
}

export const fetchCourseRichContents = async (courseId: string) => {
  return apiFetch<{
    courseId: string;
    title: string;
    richContents: RichContentView[];
  }>(`/student/courses/${courseId}/content`);
};