import { apiFetch } from './apiClient';

export interface EbookRecord {
  _id: string;
  title: string;
  author: string;
  category?: {
    _id: string;
    code: string;
    title: string;
    icon?: string;
  } | string;
  description?: string;
  price: number;
  coverImage?: string;
  samplePdfUrl?: string;
  fullPdfUrl?: string;
  pages: number;
  active: boolean;
  createdAt?: string;
  isPurchased?: boolean;
}

/**
 * Fetch digital e-books catalog from /api/ebooks
 */
export const fetchEbooksCatalog = async (page: number = 1, limit: number = 12) => {
  return apiFetch<EbookRecord[]>(`/ebooks?page=${page}&limit=${limit}`);
};

/**
 * Fetch purchased e-books owned by current logged-in student from /api/purchases/my-ebooks
 */
export const fetchMyPurchasedEbooks = async () => {
  return apiFetch<{ count: number; ebooks: EbookRecord[] }>('/purchases/my-ebooks');
};

/**
 * Purchase digital e-book using student digital wallet balance via /api/purchases/ebook
 */
export const purchaseEbookWithWallet = async (ebookId: string) => {
  return apiFetch<{
    purchase: any;
    newBalance: number;
    fullPdfUrl?: string;
  }>('/purchases/ebook', {
    method: 'POST',
    body: JSON.stringify({ ebookId })
  });
};

/**
 * Seed initial sample e-books if database is empty via /api/ebooks/seed
 */
export const seedSampleEbooks = async () => {
  return apiFetch<{ sampleEbooks: EbookRecord[] }>('/ebooks/seed', {
    method: 'POST'
  });
};
