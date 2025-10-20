/**
 * User Management Service
 * Handles all user management-related API calls
 */

import { apiClient, type PaginatedResponse } from '../apiClient';

export interface User {
  id: string;
  userName: string;
  email: string;
  firstName?: string;
  lastName?: string;
  fullName: string;
  role: string;
  isActive: boolean;
  lastLoginAt?: string;
  permissions: string[];
  projectIds: string[];
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface UserCreateRequest {
  userName: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role: string;
  isActive: boolean;
  permissions?: string[];
  projectIds?: string[];
}

export interface UserUpdateRequest {
  userName?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  isActive?: boolean;
  permissions?: string[];
  projectIds?: string[];
}

export interface UserListRequest {
  pageNumber?: number;
  pageSize?: number;
  search?: string;
  role?: string;
  isActive?: boolean;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ResetPasswordRequest {
  email: string;
}

export interface UserRole {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
}

export interface UserPermission {
  id: string;
  name: string;
  description?: string;
  category: string;
}

class UserManagementService {
  private readonly baseEndpoint = '/api/UserManagement';

  /**
   * Get paginated list of users
   */
  async getUsers(params?: UserListRequest): Promise<PaginatedResponse<User>> {
    const response = await apiClient.get<PaginatedResponse<User>>(this.baseEndpoint, params);
    return response.data!;
  }

  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<User> {
    const response = await apiClient.get<User>(`${this.baseEndpoint}/${id}`);
    return response.data!;
  }

  /**
   * Create new user
   */
  async createUser(user: UserCreateRequest): Promise<User> {
    const response = await apiClient.post<User>(this.baseEndpoint, user);
    return response.data!;
  }

  /**
   * Update user
   */
  async updateUser(id: string, user: UserUpdateRequest): Promise<User> {
    const response = await apiClient.put<User>(`${this.baseEndpoint}/${id}`, user);
    return response.data!;
  }

  /**
   * Delete user
   */
  async deleteUser(id: string): Promise<void> {
    await apiClient.delete(`${this.baseEndpoint}/${id}`);
  }

  /**
   * Change user password
   */
  async changePassword(id: string, passwordData: ChangePasswordRequest): Promise<void> {
    await apiClient.post(`${this.baseEndpoint}/${id}/change-password`, passwordData);
  }

  /**
   * Reset user password
   */
  async resetPassword(resetData: ResetPasswordRequest): Promise<void> {
    await apiClient.post(`${this.baseEndpoint}/reset-password`, resetData);
  }

  /**
   * Activate user
   */
  async activateUser(id: string): Promise<void> {
    await apiClient.post(`${this.baseEndpoint}/${id}/activate`);
  }

  /**
   * Deactivate user
   */
  async deactivateUser(id: string): Promise<void> {
    await apiClient.post(`${this.baseEndpoint}/${id}/deactivate`);
  }

  /**
   * Get users by role
   */
  async getUsersByRole(role: string, params?: Omit<UserListRequest, 'role'>): Promise<PaginatedResponse<User>> {
    const requestParams = { ...params, role };
    return this.getUsers(requestParams);
  }

  /**
   * Get active users
   */
  async getActiveUsers(params?: Omit<UserListRequest, 'isActive'>): Promise<PaginatedResponse<User>> {
    const requestParams = { ...params, isActive: true };
    return this.getUsers(requestParams);
  }

  /**
   * Get inactive users
   */
  async getInactiveUsers(params?: Omit<UserListRequest, 'isActive'>): Promise<PaginatedResponse<User>> {
    const requestParams = { ...params, isActive: false };
    return this.getUsers(requestParams);
  }

  /**
   * Search users
   */
  async searchUsers(searchTerm: string, params?: Omit<UserListRequest, 'search'>): Promise<PaginatedResponse<User>> {
    const requestParams = { ...params, search: searchTerm };
    return this.getUsers(requestParams);
  }

  /**
   * Check if username is unique
   */
  async isUsernameUnique(userName: string, excludeId?: string): Promise<boolean> {
    try {
      const params: any = { userName };
      if (excludeId) {
        params.excludeId = excludeId;
      }
      
      const response = await apiClient.get<{ isUnique: boolean }>(`${this.baseEndpoint}/check-unique-username`, params);
      return response.data?.isUnique ?? true;
    } catch (error) {
      // If API call fails, assume it's unique to allow creation
      return true;
    }
  }

  /**
   * Check if email is unique
   */
  async isEmailUnique(email: string, excludeId?: string): Promise<boolean> {
    try {
      const params: any = { email };
      if (excludeId) {
        params.excludeId = excludeId;
      }
      
      const response = await apiClient.get<{ isUnique: boolean }>(`${this.baseEndpoint}/check-unique-email`, params);
      return response.data?.isUnique ?? true;
    } catch (error) {
      // If API call fails, assume it's unique to allow creation
      return true;
    }
  }

  /**
   * Get available roles
   */
  async getAvailableRoles(): Promise<UserRole[]> {
    const response = await apiClient.get<UserRole[]>(`${this.baseEndpoint}/roles`);
    return response.data!;
  }

  /**
   * Get available permissions
   */
  async getAvailablePermissions(): Promise<UserPermission[]> {
    const response = await apiClient.get<UserPermission[]>(`${this.baseEndpoint}/permissions`);
    return response.data!;
  }

  /**
   * Get user permissions
   */
  async getUserPermissions(userId: string): Promise<string[]> {
    const response = await apiClient.get<string[]>(`${this.baseEndpoint}/${userId}/permissions`);
    return response.data!;
  }

  /**
   * Update user permissions
   */
  async updateUserPermissions(userId: string, permissions: string[]): Promise<void> {
    await apiClient.put(`${this.baseEndpoint}/${userId}/permissions`, { permissions });
  }

  /**
   * Get user projects
   */
  async getUserProjects(userId: string): Promise<string[]> {
    const response = await apiClient.get<string[]>(`${this.baseEndpoint}/${userId}/projects`);
    return response.data!;
  }

  /**
   * Update user projects
   */
  async updateUserProjects(userId: string, projectIds: string[]): Promise<void> {
    console.log('Sending project update request:', { ProjectIds: projectIds }); // Debug log
    await apiClient.put(`${this.baseEndpoint}/${userId}/projects`, { ProjectIds: projectIds });
  }

  /**
   * Get user statistics
   */
  async getUserStatistics(): Promise<{
    total: number;
    active: number;
    inactive: number;
    byRole: Array<{ role: string; count: number }>;
    recentLogins: Array<{ date: string; count: number }>;
  }> {
    const response = await apiClient.get(`${this.baseEndpoint}/statistics`);
    return response.data!;
  }

  /**
   * Get user activity log
   */
  async getUserActivityLog(userId: string, params?: {
    pageNumber?: number;
    pageSize?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<PaginatedResponse<{
    id: string;
    action: string;
    details?: string;
    ipAddress?: string;
    userAgent?: string;
    createdAt: string;
  }>> {
    const response = await apiClient.get(`${this.baseEndpoint}/${userId}/activity`, params);
    return response.data!;
  }

  /**
   * Export users to CSV
   */
  async exportUsers(params?: UserListRequest): Promise<Blob> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
    }

    const url = `${apiClient['baseUrl']}${this.baseEndpoint}/export?${searchParams.toString()}`;
    const headers: HeadersInit = {};
    
    const token = apiClient.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      throw new Error(`Export failed: ${response.statusText}`);
    }

    return response.blob();
  }

  /**
   * Import users from CSV
   */
  async importUsers(file: File): Promise<{
    success: boolean;
    imported: number;
    errors: Array<{ row: number; message: string }>;
  }> {
    const response = await apiClient.uploadFile<{
      success: boolean;
      imported: number;
      errors: Array<{ row: number; message: string }>;
    }>(`${this.baseEndpoint}/import`, file);
    
    return response.data!;
  }
}

// Create singleton instance
export const userManagementService = new UserManagementService();

// Export types
export type {
  User,
  UserCreateRequest,
  UserUpdateRequest,
  UserListRequest,
  ChangePasswordRequest,
  ResetPasswordRequest,
  UserRole,
  UserPermission,
};
