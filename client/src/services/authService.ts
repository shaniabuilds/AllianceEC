import { apiFetch } from './apiClient';

export type UserRole = 'STUDENT' | 'TEACHER' | 'ADMIN' | 'EXECUTIVE';

export interface UserAuthResponse {
  token: string;
  accessToken?: string;
  refreshToken?: string;
  user: {
    _id: string;
    userId: string;
    name: string;
    mobile: string;
    email?: string;
    role: UserRole;
    referralCode: string;
    isMobileVerified?: boolean;
    isEmailVerified?: boolean;
    learningPreference?: {
      stateCode?: string;
      categoryCode?: string;
      subCategory?: string;
      subCategoryTitle?: string;
      stream?: string;
      boardOrGrade?: string;
      subjectName?: string;
      isPreferenceSet?: boolean;
    };
  };
}

export interface LoginInitResponse {
  requiresOtp?: boolean;
  email?: string;
  mobile?: string;
  userId?: string;
  role?: UserRole;
  otpSimulated?: string;
  token?: string;
  user?: UserAuthResponse['user'];
}

export interface ExecutiveRegistrationStatus {
  registrationAllowed: boolean;
}

export interface ExecutiveRegistrationResponse {
  userId: string;
  role: 'EXECUTIVE';
}

/**
 * Register a new Student or Teacher account.
 */
export const registerUser = async (payload: {
  name: string;
  mobile: string;
  password: string;
  email?: string;
  role?: UserRole;
  stateCode?: string;
  referredBy?: string;
}) => {
  return apiFetch<{
    userId: string;
    mobile: string;
    referralCode: string;
    otpSimulated?: string;
  }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

/**
 * Verify 6-digit SMS OTP code.
 */
export const verifyOTP = async (mobile: string, otp: string) => {
  return apiFetch<UserAuthResponse>('/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ mobile, otp }),
  });
};

/**
 * Verify 6-digit Email OTP code.
 */
export const verifyEmailOTP = async (email: string, otp: string) => {
  return apiFetch<UserAuthResponse>('/auth/verify-email-otp', {
    method: 'POST',
    body: JSON.stringify({ email, otp }),
  });
};

/**
 * Authenticate via Email / Mobile / UserID + Password.
 */
export const loginUser = async (
  identifier: string,
  password: string
) => {
  return apiFetch<LoginInitResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifier, password }),
  });
};

/**
 * Check whether the one-time Executive registration is available.
 */
export const getExecutiveRegistrationStatus = async () => {
  return apiFetch<ExecutiveRegistrationStatus>(
    '/auth/executive/registration-status',
    {
      method: 'GET',
    }
  );
};

/**
 * Register the single Executive account.
 * The setup code is sent to the backend and is never hardcoded here.
 */
export const registerExecutive = async (payload: {
  name: string;
  mobile: string;
  email: string;
  password: string;
  setupCode: string;
}) => {
  return apiFetch<ExecutiveRegistrationResponse>(
    '/auth/executive/register',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );
};

/**
 * Update 6-Level Student Learning Preference.
 */
export const updateStudentLearningPreference = async (payload: {
  stateCode: string;
  categoryCode: string;
  subCategory: string;
  subCategoryTitle: string;
  stream?: string;
  boardOrGrade?: string;
  subjectName?: string;
}) => {
  return apiFetch<{ user: UserAuthResponse['user'] }>(
    '/auth/preference',
    {
      method: 'PUT',
      body: JSON.stringify(payload),
    }
  );
};