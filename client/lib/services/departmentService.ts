import { apiClient, type PaginatedResponse } from '../apiClient';

// Backend DepartmentListDto interface (matches the API response)
export interface DepartmentListItem {
  id: string;
  code: string;
  name: string;
  description?: string;
  status: number; // 0 = inactive, 1 = active
  employeeCount: number;
  subDepartmentCount: number;
}

// Legacy Department interface for backward compatibility
export interface Department {
  id: string
  name: string
  description?: string
  status: "active" | "inactive"
  createdAt: string
}

export interface BulkCreateResult {
  success: number
  errors: number
  created: Department[]
  errorMessages: string[]
}

export class DepartmentService {
  /**
   * Get all departments
   */
  static async getAll(): Promise<Department[]> {
    try {
      // Use the real API endpoint
      const response = await apiClient.get<PaginatedResponse<DepartmentListItem>>('/api/Departments', {
        pageNumber: 1,
        pageSize: 1000, // Get all departments
        sortBy: 'name',
        sortDescending: false
      });

      // Convert DepartmentListItem to legacy Department format for backward compatibility
      const departments: Department[] = (response.data?.items || []).map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        status: item.status === 1 ? "active" : "inactive",
        createdAt: new Date().toISOString().split("T")[0]
      }));

      return departments;
    } catch (error) {
      console.error('Error in DepartmentService.getAll:', error)
      // Fallback to empty array if API fails
      return []
    }
  }

  /**
   * Create a new department
   */
  static async create(department: Omit<Department, 'id' | 'createdAt'>): Promise<Department> {
    try {
      const response = await apiClient.post<Department>('/api/Departments', {
        name: department.name,
        description: department.description,
        status: department.status === "active" ? 1 : 0
      });
      return response.data!;
    } catch (error) {
      console.error('Error in DepartmentService.create:', error)
      throw error
    }
  }

  /**
   * Update a department
   */
  static async update(id: string, department: Partial<Omit<Department, 'id' | 'createdAt'>>): Promise<void> {
    try {
      await apiClient.put(`/api/Departments/${id}`, {
        id: id,
        name: department.name,
        description: department.description,
        status: department.status
      });
    } catch (error) {
      console.error('Error in DepartmentService.update:', error)
      throw error
    }
  }

  /**
   * Delete a department
   */
  static async delete(id: string): Promise<void> {
    try {
      await apiClient.delete(`/api/Departments/${id}`);
    } catch (error) {
      console.error('Error in DepartmentService.delete:', error)
      throw error
    }
  }

  /**
   * Bulk create departments
   */
  static async bulkCreate(departments: string[]): Promise<BulkCreateResult> {
    const result: BulkCreateResult = {
      success: 0,
      errors: 0,
      created: [],
      errorMessages: []
    }

    if (departments.length === 0) return result

    try {
      // TODO: Replace with new API implementation
      console.log('DepartmentService.bulkCreate called (mock implementation):', departments)
      
      const validDepartments = departments.filter(name => name && name.trim())
      result.success = validDepartments.length
      result.created = validDepartments.map(name => ({
        id: `DEPT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: name.trim(),
        description: `Auto-created from import`,
        status: 'active' as const,
        createdAt: new Date().toISOString().split("T")[0]
      }))

      return result
    } catch (error) {
      result.errors = departments.length
      result.errorMessages.push(`Error creating departments: ${error}`)
      return result
    }
  }
}

// Create singleton instance
export const departmentService = new DepartmentService();