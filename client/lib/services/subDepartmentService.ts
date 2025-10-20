import { apiClient, type PaginatedResponse } from '../apiClient'

export interface SubDepartment {
  id: string
  name: string
  description?: string
  status: "active" | "inactive"
  departmentId: string
  departmentName: string
  createdAt: string
}

export interface BulkCreateResult {
  success: number
  errors: number
  created: SubDepartment[]
  errorMessages: string[]
}

export class SubDepartmentService {
  /**
   * Get all sub-departments with department information
   */
  static async getAll(): Promise<SubDepartment[]> {
    try {
      const response = await apiClient.get<PaginatedResponse<SubDepartment>>('/api/SubDepartments?pageSize=1000');
      return response.data?.items || [];
    } catch (error) {
      console.error('Error in SubDepartmentService.getAll:', error)
      throw error
    }
  }

  /**
   * Create a new sub-department
   */
  static async create(subDepartment: Omit<SubDepartment, 'id' | 'createdAt' | 'departmentName'>): Promise<SubDepartment> {
    try {
      const response = await apiClient.post<SubDepartment>('/api/SubDepartments', {
        name: subDepartment.name,
        description: subDepartment.description,
        status: subDepartment.status,
        departmentId: subDepartment.departmentId
      });
      return response.data!;
    } catch (error) {
      console.error('Error in SubDepartmentService.create:', error)
      throw error
    }
  }

  /**
   * Update a sub-department
   */
  static async update(id: string, subDepartment: Partial<Omit<SubDepartment, 'id' | 'createdAt' | 'departmentName'>>): Promise<void> {
    try {
      await apiClient.put(`/api/SubDepartments/${id}`, {
        id: id,
        name: subDepartment.name,
        description: subDepartment.description,
        status: subDepartment.status,
        departmentId: subDepartment.departmentId
      });
    } catch (error) {
      console.error('Error in SubDepartmentService.update:', error)
      throw error
    }
  }

  /**
   * Delete a sub-department
   */
  static async delete(id: string): Promise<void> {
    try {
      await apiClient.delete(`/api/SubDepartments/${id}`);
    } catch (error) {
      console.error('Error in SubDepartmentService.delete:', error)
      throw error
    }
  }

  /**
   * Bulk create sub-departments from import
   */
  static async bulkCreate(subDepartments: string[]): Promise<BulkCreateResult> {
    const result: BulkCreateResult = {
      success: 0,
      errors: 0,
      created: [],
      errorMessages: []
    }

    try {
      // TODO: Implement bulk create when backend supports it
      console.log('SubDepartmentService.bulkCreate called (not yet implemented)')
      return result
    } catch (error) {
      console.error('Error in SubDepartmentService.bulkCreate:', error)
      throw error
    }
  }
}

// Create singleton instance
export const subDepartmentService = new SubDepartmentService();