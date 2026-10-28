const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
  endpoint: string;
  options: RequestInit;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      // Retry queued request with new Access Token
      const updatedHeaders = {
        ...(prom.options.headers as Record<string, string> || {}),
        'Authorization': `Bearer ${token}`
      };
      apiFetch(prom.endpoint, { ...prom.options, headers: updatedHeaders })
        .then(prom.resolve)
        .catch(prom.reject);
    }
  });

  failedQueue = [];
};

export const getAuthHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const apiFetch = async <T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; message?: string; error?: string; statusCode?: number }> => {
  try {
    const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const headers = {
      ...getAuthHeaders(),
      ...(options.headers as Record<string, string> || {})
    };

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include'
    });

    // Handle 401 Unauthorized — Access Token Expired (Silent Refresh Interceptor)
    if (
      response.status === 401 &&
      !endpoint.includes('/auth/login') &&
      !endpoint.includes('/auth/refresh-token')
    ) {
      if (isRefreshing) {
        // Queue concurrent requests while token is refreshing
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject, endpoint, options });
        });
      }

      isRefreshing = true;

      try {
        // Silently request new Access Token using 7-day HttpOnly Refresh Token
        const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        });

        const refreshData = await refreshRes.json();

        if (refreshRes.ok && refreshData.success && refreshData.data?.accessToken) {
          const newAccessToken = refreshData.data.accessToken;

          // Update local token storage
          localStorage.setItem('accessToken', newAccessToken);
          localStorage.setItem('token', newAccessToken);

          isRefreshing = false;
          processQueue(null, newAccessToken);

          // Retry the original request with new Access Token
          const retryHeaders = {
            ...headers,
            'Authorization': `Bearer ${newAccessToken}`
          };

          const retryResponse = await fetch(url, {
            ...options,
            headers: retryHeaders,
            credentials: 'include'
          });

          const retryResult = await retryResponse.json();
          return retryResult;
        } else {
          // Refresh Token also expired or invalid — Force Logout
          isRefreshing = false;
          processQueue(new Error('Session expired. Please log in again.'), null);
          localStorage.removeItem('token');
          localStorage.removeItem('accessToken');
          window.dispatchEvent(new Event('auth:unauthorized'));

          return {
            success: false,
            statusCode: 401,
            message: 'Session expired. Please log in again.'
          };
        }
      } catch (refreshErr) {
        isRefreshing = false;
        processQueue(refreshErr, null);
        window.dispatchEvent(new Event('auth:unauthorized'));

        return {
          success: false,
          statusCode: 401,
          message: 'Authentication session expired.'
        };
      }
    }

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        statusCode: response.status,
        message: result.message || 'API request failed.',
        error: result.error || response.statusText
      };
    }

    return result;
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Network error or server unreachable.'
    };
  }
};
