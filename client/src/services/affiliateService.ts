import { apiFetch } from './apiClient';

export interface MlmNodeRecord {
  id: string;
  userId: string;
  name: string;
  referralCode: string;
  position: 'ROOT' | 'LEFT' | 'RIGHT';
  rank: string;
  leftVolume: number;
  rightVolume: number;
  carriedLeftVolume?: number;
  carriedRightVolume?: number;
  leftLeg: MlmNodeRecord | null;
  rightLeg: MlmNodeRecord | null;
}

export interface MlmConfigRecord {
  perReferralPV: number;
  directReferralBonus: number;
  matchingRatePercentage: number;
  dailyCappingLimit: number;
  adminFeePercentage: number;
  tdsPercentage: number;
  isActive?: boolean;
}

export interface AffiliateStats {
  userId: string;
  referralCode: string;
  referralLink: string;
  rank: string;
  placementPreference: 'AUTO' | 'LEFT' | 'RIGHT';
  leftVolume: number;
  rightVolume: number;
  carriedLeftPV?: number;
  carriedRightPV?: number;
  totalVolume: number;
  matchedPV?: number;
  grossMatchingBonus?: number;
  dailyCappingLimit?: number;
  cappedGrossBonus?: number;
  isCapped?: boolean;
  adminFee?: number;
  tdsDeduction?: number;
  netPayableBonus?: number;
  totalMatchedVolume?: number;
  totalEarnings?: number;
  lastPayoutDate?: string;
  directReferralsCount: number;
  withdrawableBalance?: number;
  estimatedMatchingBonus?: number;
  config?: MlmConfigRecord;
}

export interface MlmPayoutRecord {
  _id: string;
  user: { name: string; userId: string; email: string };
  cycleDate: string;
  matchedVolume: number;
  matchingRatePercentage: number;
  grossBonus: number;
  cappingLimit: number;
  cappedGrossBonus: number;
  adminFee: number;
  tdsDeduction: number;
  netPayout: number;
  carriedLeftAfter: number;
  carriedRightAfter: number;
  status: string;
}

/**
 * Fetch 100% dynamic affiliate stats (volumes, bonus, referral link, placement preference)
 */
export const fetchAffiliateStats = async () => {
  return apiFetch<{ stats: AffiliateStats }>('/mlm/stats');
};

/**
 * Fetch dynamic MLM configuration rules
 */
export const fetchMlmConfig = async () => {
  return apiFetch<{ config: MlmConfigRecord }>('/mlm/config');
};

/**
 * Update dynamic MLM configuration rules (Admin only)
 */
export const updateMlmConfig = async (configData: Partial<MlmConfigRecord>) => {
  return apiFetch<{ config: MlmConfigRecord }>('/mlm/config', {
    method: 'PUT',
    body: JSON.stringify(configData)
  });
};

/**
 * Fetch 100% dynamic binary tree hierarchy (depth up to 4)
 */
export const fetchBinaryTree = async () => {
  return apiFetch<{ tree: MlmNodeRecord }>('/mlm/tree');
};

/**
 * Update downline placement leg preference (AUTO, LEFT, RIGHT)
 */
export const updateLegPreference = async (placementPreference: 'AUTO' | 'LEFT' | 'RIGHT') => {
  return apiFetch<{ placementPreference: 'AUTO' | 'LEFT' | 'RIGHT' }>('/mlm/preference', {
    method: 'PUT',
    body: JSON.stringify({ placementPreference })
  });
};

/**
 * Execute Binary MLM Payout Settlement Cycle (Admin only)
 */
export const executeBinaryPayoutSettlement = async () => {
  return apiFetch<{ processedCount: number; payoutResults: any[] }>('/mlm/payout/execute', {
    method: 'POST'
  });
};

/**
 * Fetch binary payout statement history
 */
export const fetchPayoutHistory = async () => {
  return apiFetch<{ count: number; history: MlmPayoutRecord[] }>('/mlm/payout/history');
};

/**
 * Seed sample 7-node network tree for testing
 */
export const seedMlmNetwork = async () => {
  return apiFetch<{ rootNode: any }>('/mlm/seed', {
    method: 'POST'
  });
};




export interface MlmStatementEntry {
  id: string;
  date: string;
  type: 'BINARY_BONUS' | 'DIRECT_REFERRAL' | 'MEMBER_JOIN' | 'WITHDRAWAL';
  typeLabel: string;
  title: string;
  explanation: string[];
  pv: number;
  amount: number;
}

export interface MlmStatementSummary {
  totalProfit: number;
  binaryTotal: number;
  directTotal: number;
  withdrawn: number;
  totalMembers: number;
  totalCount: number;
}

/**
 * Fetch MLM ledger statement (gains from network, withdrawals, running balance)
 */
export const fetchMlmStatement = async (params: {
  page?: number;
  limit?: number;
  from?: string;
  to?: string;
  type?: string;
}) => {
  const qs = new URLSearchParams();
  if (params.page) qs.set('page', String(params.page));
  if (params.limit) qs.set('limit', String(params.limit));
  if (params.from) qs.set('from', params.from);
  if (params.to) qs.set('to', params.to);
  if (params.type && params.type !== 'ALL') qs.set('type', params.type);
  return apiFetch<{
    summary: MlmStatementSummary;
    entries: MlmStatementEntry[];
    pagination: { page: number; limit: number; totalRecords: number; totalPages: number };
  }>(`/mlm/statement?${qs.toString()}`);
};