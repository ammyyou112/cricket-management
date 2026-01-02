/**
 * Backend API Client
 * All database operations should go through the backend API
 */

import { TokenUtils } from '@/utils/token.utils';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
const API_PREFIX = '/api/v1';

// Only log in development mode
const isDev = import.meta.env.DEV;
const log = (...args: any[]) => {
  if (isDev) {
    console.log(...args);
  }
};
const logError = (...args: any[]) => {
  if (isDev) {
    console.error(...args);
  }
};

// Log API configuration on initialization (dev only)
log('🔧 API Client initialized with:', {
  baseURL: `${API_BASE_URL}${API_PREFIX}`,
  envVar: import.meta.env.VITE_API_BASE_URL || 'using default',
});

interface ApiError {
  message: string;
  status?: number;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<{ data: T | null; error: string | null }> {
    try {
      const token = TokenUtils.getAccessToken();
      const fullUrl = `${this.baseURL}${API_PREFIX}${endpoint}`;
      
      log(`🌐 API Request: ${options.method || 'GET'} ${fullUrl}`);
      
      // Parse and sanitize request body for logging (remove sensitive data)
      if (options.body) {
        try {
          const bodyObj = JSON.parse(options.body as string);
          const sanitizedBody = { ...bodyObj };
          // Remove sensitive fields from logs
          if (sanitizedBody.password) sanitizedBody.password = '[REDACTED]';
          if (sanitizedBody.token) sanitizedBody.token = '[REDACTED]';
          if (sanitizedBody.refreshToken) sanitizedBody.refreshToken = '[REDACTED]';
          log('📤 Request body:', sanitizedBody);
        } catch {
          // Not JSON, log as-is but be careful
          log('📤 Request body: [non-JSON]');
        }
      }
      
      const response = await fetch(fullUrl, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
          ...options.headers,
        },
      });
      
      log(`📥 Response status: ${response.status} ${response.statusText}`);

      // Handle 401 Unauthorized
      if (response.status === 401) {
        // For login/register endpoints, 401 means invalid credentials - don't redirect
        const isAuthEndpoint = endpoint.includes('/auth/login') || endpoint.includes('/auth/register');
        
        log(`🔍 401 on endpoint: ${endpoint}, isAuthEndpoint: ${isAuthEndpoint}`);
        
        // Try to extract error message from response
        let errorMessage = 'Invalid email or password';
        try {
          const errorData: ApiResponse<any> = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
          logError('❌ 401 Error from backend:', errorMessage);
        } catch (e) {
          // Response might not be JSON, use default message
          logError('❌ 401 Error: Could not parse response', e);
        }
        
        if (!isAuthEndpoint) {
          // For protected endpoints, clear tokens and redirect
          log('🔒 Protected endpoint - clearing auth and redirecting');
          TokenUtils.clearAuth();
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
          return {
            data: null,
            error: 'Authentication required. Please login again.',
          };
        }
        
        // For login/register, return the actual error message
        log(`🔐 Auth endpoint - returning error: ${errorMessage}`);
        return {
          data: null,
          error: errorMessage,
        };
      }

      if (!response.ok) {
        const errorData: ApiResponse<any> = await response.json().catch(() => ({ 
          success: false,
          message: 'Request failed' 
        }));
        
        logError('❌ API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          message: errorData.message,
        });
        
        // Handle validation errors (422) - extract detailed error messages
        if (response.status === 422 && errorData.errors) {
          const errorMessages: string[] = [];
          Object.entries(errorData.errors).forEach(([field, messages]) => {
            if (Array.isArray(messages)) {
              messages.forEach((msg: string) => {
                // Remove "body." prefix from field names for user-friendly display
                const fieldName = field.replace(/^body\./, '').replace(/^password$/, 'Password');
                errorMessages.push(msg); // Just show the message, field name is usually in the message
              });
            }
          });
          const detailedError = errorMessages.length > 0 
            ? errorMessages.join('. ') 
            : errorData.message || 'Validation failed';
          log('📋 Validation errors:', errorMessages);
          return {
            data: null,
            error: detailedError,
          };
        }
        
        return {
          data: null,
          error: errorData.message || errorData.error || `HTTP error! status: ${response.status}`,
        };
      }

      const responseData: ApiResponse<T> = await response.json();
      
      // Backend returns { success, message, data } format
      if (responseData.success && responseData.data !== undefined) {
        return { data: responseData.data, error: null };
      }
      
      // Fallback for non-standard responses
      return { data: responseData as any, error: null };
    } catch (error: any) {
      logError('API request error:', error.message || 'Network error occurred');
      return {
        data: null,
        error: error.message || 'Network error occurred',
      };
    }
  }

  async get<T>(endpoint: string): Promise<{ data: T | null; error: string | null }> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, body?: any): Promise<{ data: T | null; error: string | null }> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async put<T>(endpoint: string, body?: any): Promise<{ data: T | null; error: string | null }> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async patch<T>(endpoint: string, body?: any): Promise<{ data: T | null; error: string | null }> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<{ data: T | null; error: string | null }> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  async uploadFile<T>(endpoint: string, file: File, additionalData?: Record<string, any>): Promise<{ data: T | null; error: string | null }> {
    try {
      const token = TokenUtils.getAccessToken();
      const formData = new FormData();
      formData.append('file', file);
      
      if (additionalData) {
        Object.entries(additionalData).forEach(([key, value]) => {
          formData.append(key, typeof value === 'string' ? value : JSON.stringify(value));
        });
      }

      const response = await fetch(`${this.baseURL}${API_PREFIX}${endpoint}`, {
        method: 'POST',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: formData,
      });

      // Handle 401 Unauthorized
      if (response.status === 401) {
        TokenUtils.clearAuth();
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return {
          data: null,
          error: 'Authentication required. Please login again.',
        };
      }

      if (!response.ok) {
        const errorData: ApiResponse<any> = await response.json().catch(() => ({ 
          success: false,
          message: 'Upload failed' 
        }));
        return {
          data: null,
          error: errorData.message || errorData.error || `HTTP error! status: ${response.status}`,
        };
      }

      const responseData: ApiResponse<T> = await response.json();
      
      if (responseData.success && responseData.data !== undefined) {
        return { data: responseData.data, error: null };
      }
      
      return { data: responseData as any, error: null };
    } catch (error: any) {
      logError('File upload error:', error.message || 'Upload error occurred');
      return {
        data: null,
        error: error.message || 'Upload error occurred',
      };
    }
  }
}

export const apiClient = new ApiClient(API_BASE_URL);

// Helper function to match the old handleSupabaseError pattern
export const handleApiError = <T>(
  data: T | null,
  error: string | null
): { data: T | null; error: string | null } => {
  if (error) {
    logError('API request error:', error);
    return { data: null, error };
  }
  return { data, error: null };
};

