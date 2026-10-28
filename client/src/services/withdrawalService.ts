import { apiFetch } from './apiClient';

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
  userRole: 'STUDENT' | 'TEACHER' | 'ADMIN' | 'EXECUTIVE';
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
    body: JSON.stringify(data)
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
    body: JSON.stringify(data)
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
    method: 'POST'
  });
};

/**
 * Super Admin: Fetch all withdrawal requests
 */
export const fetchAdminWithdrawals = async (params?: {
  status?: string;
  role?: string;
  search?: string;
}) => {
  const query = new URLSearchParams();
  if (params?.status && params.status !== 'ALL') query.append('status', params.status);
  if (params?.role && params.role !== 'ALL') query.append('role', params.role);
  if (params?.search) query.append('search', params.search);

  const qs = query.toString() ? `?${query.toString()}` : '';
  return apiFetch<{
    count: number;
    withdrawals: WithdrawalRequestRecord[];
  }>(`/admin/withdrawals${qs}`);
};

/**
 * Super Admin: Approve a withdrawal request with UTR / Transaction Proof
 */
export const approveAdminWithdrawal = async (
  id: string,
  data: { utrNumber?: string; adminRemarks?: string }
) => {
  return apiFetch<{ withdrawal: WithdrawalRequestRecord }>(`/admin/withdrawals/${id}/approve`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

/**
 * Super Admin: Reject a withdrawal request and refund wallet balance
 */
export const rejectAdminWithdrawal = async (
  id: string,
  data: { rejectionReason: string }
) => {
  return apiFetch<{ withdrawal: WithdrawalRequestRecord; refundedBalance: number }>(
    `/admin/withdrawals/${id}/reject`,
    {
      method: 'POST',
      body: JSON.stringify(data)
    }
  );
};
