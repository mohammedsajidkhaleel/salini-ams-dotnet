/**
 * Authentication Service for Salini AMS
 * Handles authentication with the .NET Core Web API
 */

import { apiClient, type LoginRequest, type LoginResponse, type ApiError } from './apiClient';

export interface User {
  id: string;
  userName: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: string;
  isActive: boolean;
  permissions: string[];
  projectIds: string[];
  lastLoginAt?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

class AuthService {
  private user: User | null = null;
  private listeners: ((state: AuthState) => void)[] = [];

  constructor() {
    // Load user from localStorage on initialization
    this.loadUserFromStorage();
  }

  /**
   * Subscribe to auth state changes
   */
  subscribe(listener: (state: AuthState) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Notify all listeners of state changes
   */
  private notifyListeners() {
    const state: AuthState = {
      user: this.user,
      isAuthenticated: this.isAuthenticated(),
      isLoading: false,
    };

    this.listeners.forEach(listener => listener(state));
  }

  /**
   * Get current auth state
   */
  getAuthState(): AuthState {
    return {
      user: this.user,
      isAuthenticated: this.isAuthenticated(),
      isLoading: false,
    };
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return apiClient.isAuthenticated() && !!this.user;
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return this.user;
  }

  /**
   * Login user
   */
  async login(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      const loginRequest: LoginRequest = { email, password };
      const response = await apiClient.post<LoginResponse>('/api/Auth/login', loginRequest);

      if (response.data) {
        // Set token in API client
        apiClient.setToken(response.data.token);

        // Map response to User interface
        const user: User = {
          id: response.data.user.id,
          userName: response.data.user.userName,
          email: response.data.user.email,
          firstName: response.data.user.firstName,
          lastName: response.data.user.lastName,
          fullName: `${response.data.user.firstName} ${response.data.user.lastName}`,
          role: response.data.user.role,
          isActive: response.data.user.isActive,
          permissions: response.data.user.permissions || [],
          projectIds: response.data.user.projectIds || [],
          lastLoginAt: response.data.user.lastLoginAt || new Date().toISOString(),
        };

        // Debug logging
        console.log('🔐 Login successful, user permissions:', {
          userId: user.id,
          userRole: user.role,
          permissions: user.permissions,
          permissionCount: user.permissions.length
        });

        this.user = user;
        this.saveUserToStorage();
        this.notifyListeners();

        return { success: true };
      }

      return { success: false, error: 'Invalid response from server' };
    } catch (error) {
      const apiError = error as ApiError;
      return { 
        success: false, 
        error: apiError.message || 'Login failed' 
      };
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      // Call logout endpoint if authenticated
      if (this.isAuthenticated()) {
        await apiClient.post('/api/Auth/logout');
      }
    } catch (error) {
      // Ignore logout errors - we still want to clear local state
      console.warn('Logout API call failed:', error);
    } finally {
      // Clear local state regardless of API call result
      this.user = null;
      apiClient.clearAuth();
      this.clearUserFromStorage();
      this.notifyListeners();
    }
  }

  /**
   * Refresh user data
   */
  async refreshUser(): Promise<{ success: boolean; error?: string }> {
    if (!this.isAuthenticated()) {
      return { success: false, error: 'Not authenticated' };
    }

    // For now, just return success since we have user data from login
    // The token will be validated on the next API call
    // TODO: Implement /api/auth/me endpoint in backend for user refresh
    return { success: true };
  }

  /**
   * Load user permissions
   */
  async loadUserPermissions(): Promise<string[]> {
    if (!this.isAuthenticated()) {
      return [];
    }

    // For now, return empty array since permissions endpoint doesn't exist
    // TODO: Implement /api/auth/permissions endpoint in backend
    return [];
  }

  /**
   * Load user projects
   */
  async loadUserProjects(): Promise<string[]> {
    if (!this.isAuthenticated()) {
      return [];
    }

    // For now, return empty array since projects endpoint doesn't exist
    // TODO: Implement /api/auth/projects endpoint in backend
    return [];
  }

  /**
   * Check if user has specific permission
   */
  hasPermission(permission: string): boolean {
    return this.user?.permissions?.includes(permission) || false;
  }

  /**
   * Check if user has specific role
   */
  hasRole(role: string): boolean {
    return this.user?.role === role;
  }

  /**
   * Check if user has any of the specified roles
   */
  hasAnyRole(roles: string[]): boolean {
    return roles.includes(this.user?.role || '');
  }

  /**
   * Check if user has access to specific project
   */
  hasProjectAccess(projectId: string): boolean {
    return this.user?.projectIds?.includes(projectId) || false;
  }

  /**
   * Save user to localStorage
   */
  private saveUserToStorage() {
    if (typeof window !== 'undefined' && this.user) {
      localStorage.setItem('user_data', JSON.stringify(this.user));
    }
  }

  /**
   * Load user from localStorage
   */
  private loadUserFromStorage() {
    if (typeof window !== 'undefined') {
      try {
        const userData = localStorage.getItem('user_data');
        if (userData) {
          this.user = JSON.parse(userData);
        }
      } catch (error) {
        console.warn('Failed to load user from storage:', error);
        this.clearUserFromStorage();
      }
    }
  }

  /**
   * Clear user from localStorage
   */
  private clearUserFromStorage() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user_data');
    }
  }

  /**
   * Initialize auth service
   * Call this when the app starts to restore auth state
   */
  async initialize(): Promise<void> {
    // Just restore the auth state from storage
    // Token validation will happen on the next API call
    if (apiClient.isAuthenticated() && this.user) {
      // Auth state is already restored, just notify listeners
      this.notifyListeners();
    } else {
      // No valid auth state, ensure clean state
      this.user = null;
      apiClient.clearAuth();
      this.clearUserFromStorage();
    }
  }
}

// Create singleton instance
export const authService = new AuthService();

// Types are already exported above
