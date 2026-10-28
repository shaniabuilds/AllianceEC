import { Platform } from 'react-native';

export const LOCAL_SERVER_URL = Platform.OS === 'android' ? 'http://10.0.2.2:5000/api' : 'http://localhost:5000/api';
export const RENDER_DEPLOYMENT_URL = 'https://e-learning-63yb.onrender.com/api';
export const DEFAULT_API_BASE_URL = RENDER_DEPLOYMENT_URL;

let currentApiBaseUrl = DEFAULT_API_BASE_URL;
let authToken: string | null = null;

export const setApiBaseUrl = (url: string) => {
  currentApiBaseUrl = url.endsWith('/api') ? url : `${url}/api`;
};

export const getApiBaseUrl = () => currentApiBaseUrl;

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

export const getAuthToken = () => authToken;

export const getAuthHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  return headers;
};

export const apiFetch = async <T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; message?: string; error?: string; statusCode?: number }> => {
  try {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${currentApiBaseUrl}${cleanEndpoint}`;

    const isFormData = options.body instanceof FormData;
    const headers: Record<string, string> = {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...(options.headers as Record<string, string> || {}),
    };

    console.log(`[API REQUEST 🚀] ${options.method || 'GET'} -> ${url}`);
    if (options.body && !isFormData) {
      console.log(`[API REQUEST PAYLOAD 📦]`, options.body);
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const result = await response.json();

    console.log(`[API RESPONSE 📥] Status: ${response.status}`, result);

    if (!response.ok) {
      console.warn(`[API ERROR ⚠️] ${result.message || response.statusText}`);
      return {
        success: false,
        statusCode: response.status,
        message: result.message || 'API Request failed.',
        error: result.error || response.statusText,
      };
    }

    return result;
  } catch (err: any) {
    console.error(`[API NETWORK FAILURE 💥]`, err);
    return {
      success: false,
      message: err.message || 'Network error: Backend server unreachable.',
    };
  }
};
