import { apiFetch, setAuthToken } from './apiClient';

export interface LearningPreference {
  stateCode?: string;
  categoryCode?: string;
  subCategory?: string;
  subCategoryTitle?: string;
  stream?: string;
  boardOrGrade?: string;
  isPreferenceSet?: boolean;
}

export interface UserProfile {
  id?: string;
  _id?: string;
  userId?: string;
  referralCode?: string;
  name?: string;
  email?: string;
  mobile?: string;
  role?: 'STUDENT' | 'TEACHER' | 'ADMIN' | 'AFFILIATE';
  stateCode?: string;
  isEmailVerified?: boolean;
  kycStatus?: string;
  walletBalance?: number;
  learningPreference?: LearningPreference;
}

export interface Step1LoginResult {
  requiresOtp: boolean;
  email?: string;
  message?: string;
  user?: UserProfile;
  token?: string;
}

export interface VerifyOtpResult {
  token: string;
  user: UserProfile;
}

/**
 * Step 1: Login with Mobile/Email & Password
 * Returns requiresOtp = true and email for Step 2
 */
export const loginWithCredentials = async (emailOrMobile: string, password: string) => {
  const res = await apiFetch<Step1LoginResult>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifier: emailOrMobile, password }),
  });

  if (res.success && res.data?.token) {
    setAuthToken(res.data.token);
  }

  return res;
};

/**
 * Step 2: Verify 6-Digit Email OTP
 * Returns JWT token and User Profile
 */
export const verifyEmailOtp = async (email: string, otp: string) => {
  const res = await apiFetch<VerifyOtpResult>('/auth/verify-email-otp', {
    method: 'POST',
    body: JSON.stringify({ email, otp }),
  });

  if (res.success && res.data?.token) {
    setAuthToken(res.data.token);
  }

  return res;
};

/**
 * Register New Student Account
 */
export const registerStudent = async (formData: {
  name: string;
  email: string;
  mobile: string;
  password: string;
  stateCode?: string;
  referredBy?: string;
}) => {
  const res = await apiFetch<{ requiresOtp: boolean; email: string }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      ...formData,
      role: 'STUDENT',
    }),
  });

  return res;
};

/**
 * Fetch Current Logged-In User Profile
 */
export const fetchUserProfile = async () => {
  return apiFetch<{ user: UserProfile }>('/auth/me');
};

/**
 * Update Student 6-Level Learning Preference
 */
export const updateStudentLearningPreference = async (payload: {
  stateCode: string;
  categoryCode: string;
  subCategory: string;
  subCategoryTitle: string;
  stream?: string;
  boardOrGrade?: string;
}) => {
  return apiFetch<{ user: UserProfile }>('/auth/preference', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
};
