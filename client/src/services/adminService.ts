import { apiFetch } from "./apiClient";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:5000/api';

export interface AdminStats {
  totalUsers: number;
  totalStudents: number;
  totalTeachers: number;
  totalAffiliates?: number;
  totalMlmNodes?: number;
  totalPendingKyc: number;
  totalCourses: number;
  totalRevenue: number;
  totalTopupVolume: number;
}

export interface UserRecord {
  _id: string;
  userId: string;
  name: string;
  mobile: string;
  email?: string;
  role: "STUDENT" | "TEACHER" | "ADMIN";
  referralCode: string;
  referredBy?: string;
  isMobileVerified: boolean;
  isBlocked?: boolean;
  status?: "ACTIVE" | "BLOCKED";
  kycStatus?: "NOT_SUBMITTED" | "PENDING" | "VERIFIED" | "REJECTED";
  stateCode?: string;
  createdAt: string;
  learningPreference?: {
    categoryCode?: string;
    subCategory?: string;
    subCategoryTitle?: string;
    stream?: string;
    boardOrGrade?: string;
    subjectName?: string;
    isPreferenceSet?: boolean;
  };
  taughtSubjects?: string[];
  coursesCount?: number;
  coursesTaught?: Array<{
    _id: string;
    title: string;
    subjectName?: string;
    boardOrGrade?: string;
    price?: number;
    totalStudents?: number;
    active?: boolean;
  }>;
  enrolledCourses?: Array<{
    _id: string;
    title: string;
    subjectName?: string;
    boardOrGrade?: string;
    price?: number;
  }>;
  enrolledCount?: number;
  walletBalance?: number;
}

export interface CourseInclusions {
  totalLectures?: number;
  totalHours?: number;
  totalEbooks?: number;
  totalLiveSessions?: number;
  totalMockTests?: number;
  hasCertificate?: boolean;
  hasDoubtSupport?: boolean;
  hasDownloadableNotes?: boolean;
  hasLifetimeAccess?: boolean;
}

export interface CourseCurriculumItem {
  title: string;
  description?: string;
  lectureCount?: number;
  durationMinutes?: number;
}

export interface CourseStudyMaterialItem {
  title: string;
  docType?: "PDF" | "DOC" | "NOTES" | "EBOOK";
  fileUrl: string;
  topic?: string;
}

export interface CourseMockTestQuestion {
  questionText: string;
  options: string[];
  correctOption?: number; // 0, 1, 2, 3
  explanation?: string;
}

export interface CourseMockTestItem {
  title: string;
  topic?: string;
  durationMinutes?: number;
  totalQuestions?: number;
  testUrl?: string;
  questions?: CourseMockTestQuestion[];
}

export interface CourseRecord {
  _id: string;
  title: string;
  description?: string;
  price: number;
  originalPrice: number;
  stateCode: string;
  boardOrGrade?: string;
  subCategory?: string;
  subCategoryTitle?: string;
  stream?: string;
  subjectName?: string;
  subjects?: string[];
  category?: {
    _id: string;
    title?: string;
    name?: string;
    slug?: string;
    code?: string;
  };
  instructor?: {
    _id: string;
    name: string;
    email?: string;
    mobile: string;
    userId: string;
    role?: string;
  };
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

  active: boolean;
  isFeatured?: boolean;
  totalStudents?: number;
  totalEnrolled?: number;
  totalGrossRevenue?: number;
  createdAt: string;
}

export interface CreateCoursePayload {
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
  validityDays?: number;
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

export interface KYCRecord {
  _id: string;
  user: {
    _id: string;
    name: string;
    mobile: string;
    userId: string;
    role: string;
  };
  documentType: "AADHAAR" | "PAN" | "BOTH";
  documentNumber?: string;
  documentScanUrl?: string;
  aadhaarNumber?: string;
  aadhaarScanUrl?: string;
  panNumber?: string;
  panScanUrl?: string;
  status: "PENDING" | "APPROVED" | "VERIFIED" | "REJECTED";
  rejectionReason?: string;
  createdAt: string;
}

export interface PayoutRecord {
  _id: string;
  user: {
    _id: string;
    name: string;
    mobile: string;
    userId: string;
    role: string;
  };
  amount: number;
  type: "CREDIT" | "DEBIT";
  category: "ROYALTY_PAYOUT" | "AFFILIATE_COMMISSION";
  status: "PENDING" | "SUCCESS" | "FAILED";
  description?: string;
  createdAt: string;
}

export interface CourseRichContentItem {
  title: string;
  topic: string;
  html: string;
}

/**
 * Fetch platform analytics overview stats
 */
export const fetchAdminStats = async () => {
  return apiFetch<{ stats: AdminStats }>("/admin/stats");
};

export interface PaginatedMeta {
  page: number;
  limit: number;
  totalRecords: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/**
 * Fetch paginated users directory with search, role filters, sorting and page limit
 */
export const fetchAdminUsers = async (
  page = 1,
  limit = 20,
  search = "",
  role = "",
  sortBy = "-createdAt",
  stateCode = "",
  kycStatus = "",
  boardOrGrade = "",
  subjectName = "",
) => {
  let query = `?page=${page}&limit=${limit}`;
  if (search) query += `&search=${encodeURIComponent(search)}`;
  if (role && role !== "ALL") query += `&role=${encodeURIComponent(role)}`;
  if (sortBy) query += `&sortBy=${encodeURIComponent(sortBy)}`;
  if (stateCode && stateCode !== "ALL")
    query += `&stateCode=${encodeURIComponent(stateCode)}`;
  if (kycStatus && kycStatus !== "ALL")
    query += `&kycStatus=${encodeURIComponent(kycStatus)}`;
  if (boardOrGrade && boardOrGrade !== "ALL")
    query += `&boardOrGrade=${encodeURIComponent(boardOrGrade)}`;
  if (subjectName && subjectName !== "ALL")
    query += `&subjectName=${encodeURIComponent(subjectName)}`;

  return apiFetch<UserRecord[]>(`/admin/users${query}`) as Promise<{
    success: boolean;
    data?: UserRecord[];
    pagination?: PaginatedMeta;
    message?: string;
  }>;
};

/**
 * Update user role or toggle account active/verified/blocked status
 */
export const updateUserRoleStatus = async (
  userId: string,
  role?: string,
  isMobileVerified?: boolean,
  isBlocked?: boolean,
) => {
  return apiFetch<{ user: UserRecord }>(`/admin/users/${userId}/role-status`, {
    method: "PUT",
    body: JSON.stringify({ role, isMobileVerified, isBlocked }),
  });
};

/**
 * Toggle user account block/unblock status
 */
export const toggleBlockUser = async (userId: string, isBlocked: boolean) => {
  return apiFetch<{ user: UserRecord }>(`/admin/users/${userId}/role-status`, {
    method: "PUT",
    body: JSON.stringify({ isBlocked }),
  });
};

export interface CreateUserPayload {
  name: string;
  mobile: string;
  role: "STUDENT" | "TEACHER";
  email?: string;
  password?: string;
  stateCode?: string;
  categoryCode?: string;
  subCategory?: string;
  subCategoryTitle?: string;
  stream?: string;
  boardOrGrade?: string;
  subjectName?: string;
  referredBy?: string;
}

/**
 * Bulk create users (Students & Teachers) directly by Super Admin via parsed Excel/CSV
 */
export const bulkCreateAdminUsers = async (users: CreateUserPayload[]) => {
  return apiFetch<{
    totalRequested: number;
    createdCount: number;
    failedCount: number;
    createdUsers: UserRecord[];
    errors: Array<{ row: number; error: string }>;
  }>("/admin/users/bulk", {
    method: "POST",
    body: JSON.stringify({ users }),
  });
};

export interface EnrolledStudentRecord {
  purchaseId: string;
  student: {
    _id: string;
    name: string;
    mobile: string;
    email?: string;
    userId: string;
    stateCode?: string;
    role?: string;
    kycStatus?: string;
  };
  amountPaid: number;
  paymentMethod: string;
  enrolledAt: string;
  teacherRoyaltyEarned?: number;
}

/**
 * Fetch complete enrolled students roster, teacher info, and gross/royalty revenue breakdown for a course (Admin)
 */
export const fetchCourseEnrolledStudents = async (courseId: string) => {
  return apiFetch<{
    course: CourseRecord & {
      totalEnrolled?: number;
      totalGrossRevenue?: number;
      teacherRoyaltyShare?: number;
      platformRevenueShare?: number;
    };
    enrolledStudents: EnrolledStudentRecord[];
  }>(`/admin/courses/${courseId}/students`);
};

/**
 * Fetch paginated platform courses for Super Admin management (with search, courseMode filter, and sorting)
 */
export const fetchAdminCourses = async (
  page = 1,
  limit = 20,
  search = "",
  courseMode = "",
  sortBy = "-createdAt",
  stateCode = "",
) => {
  let query = `?page=${page}&limit=${limit}`;
  if (search) query += `&search=${encodeURIComponent(search)}`;
  if (courseMode && courseMode !== "ALL")
    query += `&courseMode=${encodeURIComponent(courseMode)}`;
  if (sortBy) query += `&sortBy=${encodeURIComponent(sortBy)}`;
  if (stateCode && stateCode !== "ALL")
    query += `&stateCode=${encodeURIComponent(stateCode)}`;

  return apiFetch<CourseRecord[]>(`/admin/courses${query}`) as Promise<{
    success: boolean;
    data?: CourseRecord[];
    pagination?: PaginatedMeta;
    message?: string;
  }>;
};

/**
 * Create a new course directly by Super Admin
 */
export const createAdminCourse = async (payload: CreateCoursePayload) => {
  return apiFetch<{ course: CourseRecord }>("/admin/courses", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

/**
 * Bulk create courses directly by Super Admin via parsed Excel/CSV
 */
export const bulkCreateAdminCourses = async (
  courses: Partial<CreateCoursePayload>[],
) => {
  return apiFetch<{
    totalRequested: number;
    createdCount: number;
    failedCount: number;
    createdCourses: CourseRecord[];
    errors: Array<{ row: number; error: string }>;
  }>("/admin/courses/bulk", {
    method: "POST",
    body: JSON.stringify({ courses }),
  });
};

/**
 * Upload course thumbnail image file (max 2MB) directly to Cloudinary
 */
export const uploadAdminCourseThumbnail = async (file: File) => {
  const formData = new FormData();
  formData.append("thumbnailFile", file);

  const token =
    localStorage.getItem("token") || localStorage.getItem("accessToken");
  const res = await fetch(`${API_BASE_URL}/admin/upload-thumbnail`, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "Thumbnail image upload failed.");
  }
  return data.data as { thumbnailUrl: string };
};

/**
 * Upload course study material document (PDF, Word, PPT, Notes up to 25MB) directly to Cloudinary CDN
 */
export const uploadStudyMaterialDocument = async (
  file: File,
  portalType: "ADMIN" | "TEACHER" = "ADMIN",
) => {
  const formData = new FormData();
  formData.append("documentFile", file);

  const token =
    localStorage.getItem("token") || localStorage.getItem("accessToken");
  const endpoint =
    portalType === "TEACHER"
      ? `${API_BASE_URL}/teacher/upload-material`
      : `${API_BASE_URL}/admin/upload-material`;

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "Study material document upload failed.");
  }
  return data.data as {
    fileUrl: string;
    originalName: string;
    format: string;
    sizeBytes: number;
  };
};

/**
 * Toggle course active/published status by Super Admin
 */
export const toggleCourseActive = async (
  courseId: string,
  active?: boolean,
) => {
  return apiFetch<{ course: CourseRecord }>(
    `/admin/courses/${courseId}/toggle-active`,
    {
      method: "PUT",
      body: JSON.stringify({ active }),
    },
  );
};

/**
 * Update course details by Super Admin
 */
export const updateAdminCourse = async (
  courseId: string,
  payload: CreateCoursePayload,
) => {
  return apiFetch<{ course: CourseRecord }>(`/admin/courses/${courseId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
};

/**
 * Delete course by Super Admin
 */
export const deleteAdminCourse = async (courseId: string) => {
  return apiFetch<{ courseId: string }>(`/admin/courses/${courseId}`, {
    method: "DELETE",
  });
};

/**
 * Fetch pending or filtered KYC document verification queue
 */
export const fetchPendingKYC = async (status = "PENDING") => {
  let query = "";
  if (status && status !== "ALL") query = `?status=${status}`;
  return apiFetch<{ count: number; kycQueue: KYCRecord[] }>(
    `/kyc/admin/pending${query}`,
  );
};

/**
 * Approve or reject student KYC document
 */
export const verifyKYCDocument = async (
  kycId: string,
  status: "APPROVED" | "REJECTED",
  rejectionReason?: string,
) => {
  return apiFetch<{ kycRecord: KYCRecord }>(`/kyc/admin/verify/${kycId}`, {
    method: "PUT",
    body: JSON.stringify({ status, rejectionReason }),
  });
};

/**
 * Fetch pending payouts queue (affiliate commissions & teacher royalties)
 */
export const fetchPendingPayouts = async () => {
  return apiFetch<{ count: number; payouts: PayoutRecord[] }>("/admin/payouts");
};

/**
 * Approve and release pending payout to user wallet
 */
export const approvePayout = async (transactionId: string) => {
  return apiFetch<{ transaction: PayoutRecord; updatedWalletBalance: number }>(
    `/admin/payouts/${transactionId}/approve`,
    {
      method: "POST",
    },
  );
};
