"use client"

// TODO: Replace with new API implementation
import { useAuth } from "@/contexts/auth-context-new"
import { ProjectService, type Project } from "./services"

export class ProjectDataService {
  // Get user's accessible project IDs
  static async getUserProjectIds(userId: string): Promise<string[]> {
    try {
      // For now, return all project IDs since user project access is not yet implemented
      // TODO: Implement proper user project access control
      const allProjects = await ProjectService.getAll()
      return allProjects.map(project => project.id)
    } catch (error) {
      console.error('Error fetching user project IDs:', error)
      return []
    }
  }

  // Check if user has access to a specific project
  static async hasProjectAccess(userId: string, projectId: string): Promise<boolean> {
    try {
      const projectIds = await this.getUserProjectIds(userId)
      return projectIds.includes(projectId)
    } catch (error) {
      console.error('Error checking project access:', error)
      return false
    }
  }

  // Get projects accessible to user
  static async getProjectsForUser(userId: string): Promise<Project[]> {
    try {
      // Get all projects first
      const allProjects = await ProjectService.getAll()
      
      // TODO: Get user's assigned projects from the backend API
      // For now, we'll need to get this from the auth context or make an API call
      // This should be replaced with a proper API call to get user's assigned projects
      
      // For now, return all projects - this will be filtered by the ProjectFilter component
      // based on the user's projectIds from the auth context
      return allProjects
    } catch (error) {
      console.error('Error fetching projects for user:', error)
      return []
    }
  }

  // Get employees filtered by user's projects
  static async getEmployeesForUser(userId: string, projectId?: string) {
    try {
      // TODO: Implement proper employee filtering by user project access
      console.warn('getEmployeesForUser not yet implemented with new API')
      return []
    } catch (error) {
      console.error('Error fetching employees for user:', error)
      return []
    }
  }

  // Get assets filtered by user's projects
  static async getAssetsForUser(userId: string, projectId?: string) {
    try {
      // TODO: Implement proper asset filtering by user project access
      console.warn('getAssetsForUser not yet implemented with new API')
      return []
    } catch (error) {
      console.error('Error fetching assets for user:', error)
      return []
    }
  }

  // Get SIM cards filtered by user's projects
  static async getSimCardsForUser(userId: string, projectId?: string) {
    try {
      // TODO: Implement proper SIM card filtering by user project access
      console.warn('getSimCardsForUser not yet implemented with new API')
      return []
    } catch (error) {
      console.error('Error fetching SIM cards for user:', error)
      return []
    }
  }

  // Get software licenses filtered by user's projects
  static async getSoftwareLicensesForUser(userId: string, projectId?: string) {
    try {
      // TODO: Implement proper software license filtering by user project access
      console.warn('getSoftwareLicensesForUser not yet implemented with new API')
      return []
    } catch (error) {
      console.error('Error fetching software licenses for user:', error)
      return []
    }
  }

  // Check if user is admin (has manage_users permission)
  static async isUserAdmin(userId: string): Promise<boolean> {
    try {
      // TODO: Implement proper admin check with new API
      console.warn('isUserAdmin not yet implemented with new API')
      return false
    } catch (error) {
      console.error('Error checking admin status:', error)
      return false
    }
  }

  // Get user permissions
  static async getUserPermissions(userId: string) {
    try {
      // TODO: Implement proper user permissions with new API
      console.warn('getUserPermissions not yet implemented with new API')
      return []
    } catch (error) {
      console.error('Error fetching user permissions:', error)
      return []
    }
  }

  // Check if user has specific permission
  static async hasPermission(userId: string, permission: string): Promise<boolean> {
    try {
      // TODO: Implement proper permission check with new API
      console.warn('hasPermission not yet implemented with new API')
      return false
    } catch (error) {
      console.error('Error checking permission:', error)
      return false
    }
  }

  // Get user roles
  static async getUserRoles(userId: string) {
    try {
      // TODO: Implement proper user roles with new API
      console.warn('getUserRoles not yet implemented with new API')
      return []
    } catch (error) {
      console.error('Error fetching user roles:', error)
      return []
    }
  }
}