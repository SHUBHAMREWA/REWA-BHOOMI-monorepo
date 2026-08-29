import axios from 'axios';

// NEXT_PUBLIC_API_URL must be set in production environment variables on Render/Vercel.
// In local dev, fallback to localhost:4000.
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// In-memory access token storage (never localStorage)
let accessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

export const getAccessToken = () => accessToken;

export const apiClient = axios.create({
  baseURL: `${API_URL}/api/v1`,
  withCredentials: true, // sends HttpOnly refresh token cookie
  headers: { 'Content-Type': 'application/json' },
});

// ─── Request interceptor — attach access token ──────────────────────────────

apiClient.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// ─── Response interceptor — auto-refresh on 401 & retry on connection refusal ─

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((p) => {
    if (error) p.reject(error);
    else p.resolve(token!);
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle transient network errors (ERR_CONNECTION_REFUSED, server restarting) with automatic retry and host fallback
    const isNetworkOrConnectionRefused =
      !error.response ||
      error.code === 'ERR_NETWORK' ||
      error.code === 'ECONNREFUSED' ||
      error.message?.includes('Network Error') ||
      error.message?.includes('ERR_CONNECTION_REFUSED');

    if (isNetworkOrConnectionRefused && originalRequest && (!originalRequest._networkRetryCount || originalRequest._networkRetryCount < 2)) {
      originalRequest._networkRetryCount = (originalRequest._networkRetryCount || 0) + 1;
      const delay = originalRequest._networkRetryCount * 500;
      await new Promise((res) => setTimeout(res, delay));
      return apiClient(originalRequest);
    }

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Don't retry refresh endpoint itself
    if (originalRequest.url?.includes('/auth/refresh')) {
      setAccessToken(null);
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return apiClient(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const response = await apiClient.post<{ data: { accessToken: string } }>(
        '/auth/refresh',
      );
      const newToken = response.data.data.accessToken;
      setAccessToken(newToken);
      processQueue(null, newToken);
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      setAccessToken(null);
      processQueue(refreshError, null);
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

// ─── Typed API helpers ────────────────────────────────────────────────────────

export async function apiGet<T>(url: string, params?: Record<string, unknown>) {
  const response = await apiClient.get<{ success: true; data: T }>(url, { params });
  return response.data.data;
}

export async function apiPost<T>(url: string, data?: unknown, config?: import('axios').AxiosRequestConfig) {
  const response = await apiClient.post<{ success: true; data: T; message?: string }>(url, data, config);
  return response.data;
}

export async function apiPatch<T>(url: string, data?: unknown) {
  const response = await apiClient.patch<{ success: true; data: T; message?: string }>(url, data);
  return response.data;
}

export async function apiDelete<T = null>(url: string) {
  const response = await apiClient.delete<{ success: true; data: T; message?: string }>(url);
  return response.data;
}

// Stub for server (unused on client)
function getCookie(_name: string) { return null; }
