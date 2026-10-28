import { apiFetch, getAuthToken, getApiBaseUrl } from './apiClient';

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

export interface BankAccountDetails {
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  bankName?: string;
}

export interface UpiDetails {
  upiId: string;
  accountHolderName?: string;
}

export interface PayoutProfile {
  preferredMethod: 'BANK' | 'UPI';
  bankAccount: BankAccountDetails;
  upi: UpiDetails;
  isConfigured: boolean;
}

export interface WithdrawalRequestRecord {
  _id: string;
  withdrawalId: string;
  user: {
    _id: string;
    name: string;
    mobile: string;
    userId?: string;
    role: string;
    email?: string;
    kycStatus?: string;
  };
  userRole: 'STUDENT' | 'TEACHER' | 'ADMIN';
  amount: number;
  payoutMethod: 'BANK' | 'UPI';
  bankDetails?: BankAccountDetails;
  upiDetails?: UpiDetails;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  adminRemarks?: string;
  utrNumber?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
  processedAt?: string;
}

export interface CourseStudyMaterialItem {
  title: string;
  docType?: 'PDF' | 'DOC' | 'NOTES' | 'EBOOK' | string;
  fileUrl: string;
  topic?: string;
}

export interface CourseMockTestQuestion {
  questionText: string;
  options: string[];
  correctOption: string | number;
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
  description: string;
  category: any;
  categoryCode?: string;
  subjectName?: string;
  stateCode: string;
  price: number;
  originalPrice?: number;
  validityDays?: number;
  subCategory?: string;
  subCategoryTitle?: string;
  stream?: string;
  boardOrGrade?: string;
  thumbnail?: string;
  instructor?: { name: string };
  courseMode?: string;
  liveMeetingUrl?: string;
  lectureVideoUrl?: string;
  demoVideoUrl?: string;
  liveSchedule?: string;
  ebookTitle?: string;
  ebookPdfUrl?: string;
  syllabusTopics?: string[];
  inclusions?: {
    totalLectures?: number;
    totalHours?: number;
    totalEbooks?: number;
    totalLiveSessions?: number;
    totalMockTests?: number;
    hasCertificate?: boolean;
    hasDoubtSupport?: boolean;
    hasDownloadableNotes?: boolean;
    hasLifetimeAccess?: boolean;
  };
  curriculum?: Array<{
    title: string;
    description?: string;
    lectureCount?: number;
    durationMinutes?: number;
  }>;
  studyMaterials?: CourseStudyMaterialItem[];
  mockTests?: CourseMockTestItem[];
}

export interface McqRecord {
  _id: string;
  questionText: string;
  options: string[];
  explanation?: string;
  subjectId?: string;
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

export interface EbookRecord {
  _id: string;
  title: string;
  author: string;
  category: string;
  price: number;
  originalPrice?: number;
  coverImage?: string;
  samplePdfUrl?: string;
  fullPdfUrl?: string;
  description?: string;
}

export interface AdRecord {
  _id: string;
  title: string;
  type: 'IMAGE' | 'VIDEO';
  mediaUrl: string;
  targetUrl?: string;
  description?: string;
  placement: 'HOME_HERO' | 'BANNER' | 'POPUP';
  isActive: boolean;
  priority: number;
  createdAt: string;
  updatedAt: string;
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
 * Fetch all active published courses available for enrollment (filtered by student goal/preference by default)
 */
export const fetchBrowseCourses = async (params?: { showAll?: boolean; subCategory?: string; stateCode?: string; stream?: string }) => {
  const queryParts: string[] = [];
  if (params?.showAll) queryParts.push('showAll=true');
  if (params?.subCategory) queryParts.push(`subCategory=${encodeURIComponent(params.subCategory)}`);
  if (params?.stateCode) queryParts.push(`stateCode=${encodeURIComponent(params.stateCode)}`);
  if (params?.stream) queryParts.push(`stream=${encodeURIComponent(params.stream)}`);

  const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
  return apiFetch<{ count: number; courses: CourseRecord[] }>(`/student/browse-courses${queryString}`);
};

/**
 * 1-Click Course Purchase & Enrollment
 */
export const enrollCourse = async (courseId: string) => {
  return apiFetch<{ purchase: any; updatedWalletBalance: number; course: CourseRecord }>(`/student/enroll/${courseId}`, {
    method: 'POST',
  });
};

/**
 * Top-up student wallet balance dynamically
 */
export const topUpStudentWallet = async (amount: number) => {
  return apiFetch<{ walletBalance: number }>('/student/wallet/topup', {
    method: 'POST',
    body: JSON.stringify({ amount }),
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
  mcqs: McqRecord[];
}

/**
 * Fetch MCQ practice questions for student test engine
 */
export const fetchPracticeMcqs = async () => {
  return apiFetch<{
    count: number;
    quizSets?: QuizSetGroup[];
    mcqs: McqRecord[];
    isEnrolled?: boolean;
    message?: string;
    hasAttempted?: boolean;
    lastAttempt?: QuizAttemptResult;
  }>('/student/mcqs');
};

/**
 * Submit student quiz attempt, evaluate score, and save attempt record
 */
export const submitStudentQuiz = async (answers: QuizSubmissionAnswer[], quizSetId?: string, quizSetTitle?: string) => {
  return apiFetch<{ attempt: QuizAttemptResult }>('/student/quiz/submit', {
    method: 'POST',
    body: JSON.stringify({ answers, quizSetId, quizSetTitle }),
  });
};

/**
 * Submit Aadhaar / PAN document scan
 */
export const submitStudentKyc = async (
  documentType: 'AADHAAR' | 'PAN',
  documentNumber: string,
  imageFile?: { uri: string; name?: string; type?: string } | null
) => {
  if (imageFile && imageFile.uri) {
    const formData = new FormData();
    formData.append('documentType', documentType);
    formData.append('documentNumber', documentNumber);
    formData.append('documentScan', {
      uri: imageFile.uri,
      name: imageFile.name || 'kyc_document.jpg',
      type: imageFile.type || 'image/jpeg',
    } as any);

    const token = getAuthToken();
    const apiUrl = `${getApiBaseUrl()}/student/kyc`;

    try {
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, message: data.message || 'Failed to submit KYC scan.' };
      }
      return { success: true, data: data.data as { kycRecord: any } };
    } catch (err: any) {
      return { success: false, message: err.message || 'KYC Upload error.' };
    }
  } else {
    return apiFetch<{ kycRecord: any }>('/student/kyc', {
      method: 'POST',
      body: JSON.stringify({ documentType, documentNumber }),
    });
  }
};

/**
 * Fetch digital e-books catalog
 */
export const fetchEbooks = async () => {
  return apiFetch<{ count: number; ebooks: EbookRecord[] }>('/purchases/ebooks');
};

/**
 * Purchase digital e-book via wallet balance
 */
export const purchaseEbook = async (ebookId: string) => {
  return apiFetch<{ ebook: EbookRecord }>(`/purchases/ebook/${ebookId}`, {
    method: 'POST',
  });
};

/**
 * Fetch MLM Affiliate stats (direct referrals, leg volume, bonus balance)
 */
export const fetchAffiliateStats = async () => {
  return apiFetch<{
    stats: {
      referralCode: string;
      referralLink: string;
      rank: string;
      directReferralsCount: number;
      leftVolume: number;
      rightVolume: number;
      totalVolume: number;
      estimatedMatchingBonus: number;
      placementPreference: 'AUTO' | 'LEFT' | 'RIGHT';
    };
  }>('/mlm/stats');
};

/**
 * Fetch binary network tree structure
 */
export const fetchBinaryTree = async () => {
  return apiFetch<{ tree: any }>('/mlm/tree');
};

/**
 * Update downline placement leg preference (AUTO / LEFT / RIGHT)
 */
export const updateLegPreference = async (placementPreference: 'AUTO' | 'LEFT' | 'RIGHT') => {
  return apiFetch<{ placementPreference: string }>('/mlm/preference', {
    method: 'PUT',
    body: JSON.stringify({ placementPreference }),
  });
};

/**
 * Fetch public active ads for students on mobile app
 */
export const fetchActiveAds = async (type?: 'IMAGE' | 'VIDEO') => {
  const query = type ? `?type=${type}` : '';
  return apiFetch<{ count: number; ads: AdRecord[] }>(`/ads${query}`);
};

/**
 * Fetch saved payout profile (Bank & UPI details) for current user
 */
export const fetchPayoutProfile = async () => {
  return apiFetch<{ payoutProfile: PayoutProfile }>('/wallet/payout-profile');
};

/**
 * Update saved payout profile (Bank & UPI details)
 */
export const savePayoutProfile = async (data: {
  preferredMethod?: 'BANK' | 'UPI';
  bankAccount?: BankAccountDetails;
  upi?: UpiDetails;
}) => {
  return apiFetch<{ payoutProfile: PayoutProfile }>('/wallet/payout-profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

/**
 * Request a new withdrawal (Student or Teacher)
 */
export const requestWithdrawal = async (data: {
  amount: number;
  payoutMethod: 'BANK' | 'UPI';
  bankDetails?: BankAccountDetails;
  upiDetails?: UpiDetails;
  saveAsDefault?: boolean;
}) => {
  return apiFetch<{
    withdrawal: WithdrawalRequestRecord;
    newBalance: number;
    transaction: any;
  }>('/wallet/withdraw', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

/**
 * Fetch current user's withdrawal requests history
 */
export const fetchMyWithdrawals = async () => {
  return apiFetch<{
    count: number;
    withdrawals: WithdrawalRequestRecord[];
  }>('/wallet/withdrawals');
};

/**
 * Cancel a pending withdrawal request
 */
export const cancelMyWithdrawal = async (withdrawalId: string) => {
  return apiFetch<{
    withdrawal: WithdrawalRequestRecord;
    refundedAmount: number;
    newBalance: number;
  }>(`/wallet/withdraw/${withdrawalId}/cancel`, {
    method: 'POST',
  });
};
