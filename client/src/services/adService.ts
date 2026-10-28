import { apiFetch } from './apiClient';

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

export interface AdStats {
  totalAds: number;
  activeAds: number;
  inactiveAds: number;
  imageAds: number;
  videoAds: number;
}

export interface CreateAdPayload {
  title: string;
  type: 'IMAGE' | 'VIDEO';
  mediaUrl: string;
  targetUrl?: string;
  description?: string;
  placement?: 'HOME_HERO' | 'BANNER' | 'POPUP';
  isActive?: boolean;
  priority?: number;
}

export interface UpdateAdPayload extends Partial<CreateAdPayload> {}

/**
 * Fetch public active ads for students (Web & Mobile app)
 */
export const fetchActiveAds = async (type?: 'IMAGE' | 'VIDEO') => {
  const query = type ? `?type=${type}` : '';
  return apiFetch<{ count: number; ads: AdRecord[] }>(`/ads${query}`);
};

/**
 * Fetch all ads (active & inactive) with stats for Super Admin
 */
export const fetchAdminAds = async () => {
  return apiFetch<{ stats: AdStats; count: number; ads: AdRecord[] }>('/ads/admin/all');
};

/**
 * Super Admin creates a new Image or Video Advertisement
 */
export const createAd = async (payload: CreateAdPayload) => {
  return apiFetch<{ ad: AdRecord }>('/ads', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

/**
 * Super Admin updates an existing advertisement
 */
export const updateAd = async (id: string, payload: UpdateAdPayload) => {
  return apiFetch<{ ad: AdRecord }>(`/ads/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
};

/**
 * Super Admin toggles an ad's active/paused status
 */
export const toggleAdActive = async (id: string) => {
  return apiFetch<{ ad: AdRecord }>(`/ads/${id}/toggle-active`, {
    method: 'PATCH'
  });
};

/**
 * Super Admin deletes an advertisement
 */
export const deleteAd = async (id: string) => {
  return apiFetch<{ deletedId: string }>(`/ads/${id}`, {
    method: 'DELETE'
  });
};
