/**
 * API Client for Salini AMS Backend
 * Handles all communication with the .NET Core Web API
 */

import { config } from './config';
import { navigationService } from './navigation';

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
  status: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  expiresAt: string;
  user: {
    id: string;
    userName: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    isActive: boolean;
    permissions: string[];
    projectIds: string[];
    lastLoginAt?: string;
  };
}

export interface ApiError {
  message: string;
  statusCode: number;
  details?: any;
  shouldRetry?: boolean;
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;
  private isRefreshing: boolean = false;

  constructor() {
    // Use configuration
    this.baseUrl = config.api.baseUrl;
    
    // Load token from localStorage on client side
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
  }

  /**
   * Set authentication token
   */
  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('auth_token', token);
      } else {
        localStorage.removeItem('auth_token');
      }
    }
  }

  /**
   * Get authentication token
   */
  getToken(): string | null {
    return this.token;
  }

  /**
   * Get default headers for API requests
   */
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  /**
   * Refresh access token using refresh token
   */
  private async refreshAccessToken(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/Auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include', // Important: Send HttpOnly cookie
      });

      if (response.ok) {
        const data = await response.json();
        if (data.token) {
          this.setToken(data.token);
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  }

  /**
   * Handle API response
   */
  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');

    if (!response.ok) {
      // Handle 401 Unauthorized - attempt token refresh
      if (response.status === 401) {
        // Don't attempt refresh for login/refresh endpoints
        const url = response.url;
        if (url.includes('/api/Auth/login') || url.includes('/api/Auth/refresh')) {
          this.clearAuth();
          if (typeof window !== 'undefined') {
            localStorage.removeItem('user_data');
          }
          navigationService.navigateToLogin();
          
          throw {
            message: 'Authentication failed',
            statusCode: 401,
            details: null,
          } as ApiError;
        }

        // Don't refresh if already in progress
        if (!this.isRefreshing) {
          this.isRefreshing = true;
          
          const refreshSuccess = await this.refreshAccessToken();
          this.isRefreshing = false;
          
          if (!refreshSuccess) {
            // Refresh failed - clear auth and redirect to login
            this.clearAuth();
            if (typeof window !== 'undefined') {
              localStorage.removeItem('user_data');
            }
            navigationService.navigateToLogin();
          }
        }
        
        // Throw error to let calling code retry
        throw {
          message: 'Authentication required',
          statusCode: 401,
          details: null,
          shouldRetry: true, // Signal that caller should retry
        } as ApiError;
      }

      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      let errorDetails: any = null;

      if (isJson) {
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.title || errorMessage;
          errorDetails = errorData;
        } catch {
          // If JSON parsing fails, use default error message
        }
      }

      const error: ApiError = {
        message: errorMessage,
        statusCode: response.status,
        details: errorDetails,
      };

      throw error;
    }

    if (response.status === 204) {
      return { status: response.status };
    }

    if (isJson) {
      const data = await response.json();
      return { data, status: response.status };
    }

    return { status: response.status };
  }

  /**
   * Make HTTP request with automatic retry on 401
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retryCount: number = 0
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      credentials: 'include', // Include cookies for refresh token
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      return await this.handleResponse<T>(response);
    } catch (error) {
      // Check if it's a 401 error that should be retried
      if ((error as any)?.statusCode === 401 && (error as any)?.shouldRetry && retryCount === 0) {
        // Wait a bit for refresh to complete if in progress
        await new Promise(resolve => setTimeout(resolve, 100));
        // Retry the request once with the new token
        return this.request<T>(endpoint, options, 1);
      }
      
      if (error instanceof Error) {
        throw {
          message: error.message,
          statusCode: 0,
          details: error,
        } as ApiError;
      }
      throw error;
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    let url = endpoint;
    
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      url += `?${searchParams.toString()}`;
    }

    return this.request<T>(url, { method: 'GET' });
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PATCH request
   */
  async patch<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  /**
   * Upload file
   */
  async uploadFile<T>(endpoint: string, file: File, additionalData?: Record<string, any>): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, String(value));
      });
    }

    const headers: HeadersInit = {};
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
      });
      
      return await this.handleResponse<T>(response);
    } catch (error) {
      if (error instanceof Error) {
        throw {
          message: error.message,
          statusCode: 0,
          details: error,
        } as ApiError;
      }
      throw error;
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.token;
  }

  /**
   * Clear authentication
   */
  clearAuth() {
    this.setToken(null);
  }
}

// Create singleton instance
export const apiClient = new ApiClient();

// Types are already exported above
