"use client"

import { apiClient } from "./apiClient"

export interface UserProfile {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  department?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  lastLogin?: string
}

export interface UserPermission {
  id: string
  user_id: string
  permission: string
  created_at: string
}

export interface UserProject {
  id: string
  user_id: string
  project_id: string
  created_at: string
}

export interface CreateUserData {
  UserName: string
  Email: string
  FirstName: string
  LastName: string
  Department?: string
  Password: string
  Role: string
  IsActive: boolean
  Permissions: string[]
  ProjectIds: string[]
}

export interface UpdateUserData {
  Id: string
  UserName: string
  Email: string
  FirstName: string
  LastName: string
  Department?: string
  Role: string
  IsActive: boolean
  Permissions: string[]
  ProjectIds: string[]
}

export class UserService {
  // Get all users (admin only)
  static async getAllUsers(): Promise<UserProfile[]> {
    try {
      const response = await apiClient.get<UserProfile[]>('/api/UserManagement')
      return response.data || []
    } catch (error) {
      console.error('Error fetching users:', error)
      throw error
    }
  }

  // Get user by ID
  static async getUserById(userId: string): Promise<UserProfile | null> {
    try {
      const response = await apiClient.get<UserProfile>(`/api/UserManagement/${userId}`)
      return response.data || null
    } catch (error) {
      console.warn('Error fetching user by ID:', error)
      return null
    }
  }

  // Get user permissions
  static async getUserPermissions(userId: string): Promise<string[]> {
    try {
      const response = await apiClient.get<{ permissions: string[] }>(`/api/UserManagement/${userId}/permissions`)
      return response.data?.permissions || []
    } catch (error) {
      console.warn('User permissions endpoint not available, returning empty array:', error)
      return [] // Return empty array instead of throwing error
    }
  }

  // Get user projects
  static async getUserProjects(userId: string): Promise<string[]> {
    try {
      const response = await apiClient.get<{ projects: string[] }>(`/api/UserManagement/${userId}/projects`)
      return response.data?.projects || []
    } catch (error) {
      console.warn('User projects endpoint not available, returning empty array:', error)
      return [] // Return empty array instead of throwing error
    }
  }

  // Create user profile from auth user
  static async createUserProfileFromAuth(authUser: any): Promise<UserProfile> {
    try {
      const userData = {
        UserName: authUser.email,
        Email: authUser.email,
        FirstName: authUser.user_metadata?.first_name || authUser.user_metadata?.name || 'User',
        LastName: authUser.user_metadata?.last_name || '',
        Role: authUser.user_metadata?.role || 'User',
        IsActive: true,
        Password: 'TempPassword123!' // This should be handled by the auth system
      }

      const response = await apiClient.post<UserProfile>('/api/UserManagement', userData)
      return response.data!
    } catch (error) {
      console.error('Error creating user profile:', error)
      throw error
    }
  }

  // Get user with permissions and projects
  static async getUserWithDetails(userId: string): Promise<{
    profile: UserProfile | null
    permissions: string[]
    project_ids: string[]
  }> {
    try {
      const [profile, permissions, project_ids] = await Promise.all([
        this.getUserById(userId),
        this.getUserPermissions(userId),
        this.getUserProjects(userId)
      ])

      return {
        profile,
        permissions,
        project_ids
      }
    } catch (error) {
      console.error('Error fetching user details:', error)
      throw error
    }
  }

  // Create new user
  static async createUser(userData: CreateUserData): Promise<UserProfile> {
    try {
      const response = await apiClient.post<UserProfile>('/api/UserManagement', userData)
      return response.data!
    } catch (error) {
      console.error('Error creating user:', {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        fullError: error
      })
      throw error
    }
  }

  // Update user
  static async updateUser(userId: string, userData: UpdateUserData): Promise<UserProfile> {
    try {
      const response = await apiClient.put<UserProfile>(`/api/UserManagement/${userId}`, userData)
      return response.data!
    } catch (error) {
      console.error('Error updating user:', error)
      throw error
    }
  }

  // Update user projects
  static async updateUserProjects(userId: string, projectIds: string[]): Promise<void> {
    try {
      await apiClient.put(`/api/UserManagement/${userId}/projects`, { ProjectIds: projectIds })
    } catch (error) {
      console.error('Error updating user projects:', error)
      throw error
    }
  }

  // Delete user
  static async deleteUser(userId: string): Promise<void> {
    try {
      await apiClient.delete(`/api/UserManagement/${userId}`)
    } catch (error) {
      console.error('Error deleting user:', error)
      throw error
    }
  }

  // Toggle user active status
  static async toggleUserStatus(userId: string, isActive: boolean): Promise<UserProfile> {
    try {
      const response = await apiClient.patch<UserProfile>(`/api/UserManagement/${userId}/status`, { isActive })
      return response.data!
    } catch (error) {
      console.error('Error toggling user status:', error)
      throw error
    }
  }

  // Reset user password
  static async resetUserPassword(userId: string, newPassword: string): Promise<void> {
    try {
      await apiClient.patch(`/api/UserManagement/${userId}/password`, { newPassword })
    } catch (error) {
      console.error('Error resetting user password:', error)
      throw error
    }
  }

  // Get available permissions
  static getAvailablePermissions(): string[] {
    return [
      'view_dashboard',
      'manage_assets',
      'manage_employees',
      'manage_inventory',
      'manage_purchase_orders',
      'manage_sim_cards',
      'manage_software_licenses',
      'view_reports',
      'manage_users',
      'manage_settings',
      'approve_purchase_orders',
      'assign_assets',
      'delete_records'
    ]
  }

  // Get available roles
  static getAvailableRoles(): string[] {
    return [
      'SuperAdmin',
      'Admin',
      'Manager',
      'User'
    ]
  }

  // Get available departments
  static getAvailableDepartments(): string[] {
    return [
      'IT Department',
      'Human Resources',
      'Finance',
      'Operations',
      'Procurement',
      'Management'
    ]
  }

  // Check if user has permission
  static async hasPermission(userId: string, permission: string): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId)
    return permissions.includes(permission)
  }

  // Check if user has access to project
  static async hasProjectAccess(userId: string, projectId: string): Promise<boolean> {
    const projectIds = await this.getUserProjects(userId)
    return projectIds.includes(projectId)
  }

  // Get user's accessible projects
  static async getUserAccessibleProjects(userId: string) {
    try {
      const response = await apiClient.get<{ projects: string[] }>(`/api/UserManagement/${userId}/projects`)
      const projectIds = response.data?.projects || []
      
      // Get project details for each project ID
      const projectPromises = projectIds.map(async (projectId) => {
        try {
          const projectResponse = await apiClient.get(`/api/Projects/${projectId}`)
          return projectResponse.data
        } catch (error) {
          console.warn(`Failed to fetch project ${projectId}:`, error)
          return null
        }
      })
      
      const projects = await Promise.all(projectPromises)
      return projects.filter(Boolean)
    } catch (error) {
      console.error('Error fetching user accessible projects:', error)
      return []
    }
  }
}

