import { apiClient } from '../apiClient';

export interface EmployeeCategory {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeCategoryListResponse {
  items: EmployeeCategory[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

export interface EmployeeCategoryRequest {
  pageNumber: number;
  pageSize: number;
  searchTerm?: string;
  isActive?: boolean;
}

export const employeeCategoryService = {
  async getEmployeeCategories(params: EmployeeCategoryRequest): Promise<EmployeeCategoryListResponse | null> {
    try {
      const queryParams = new URLSearchParams({
        pageNumber: params.pageNumber.toString(),
        pageSize: params.pageSize.toString(),
      });

      if (params.searchTerm) {
        queryParams.append('searchTerm', params.searchTerm);
      }
      if (params.isActive !== undefined) {
        queryParams.append('isActive', params.isActive.toString());
      }

      const response = await apiClient.get<EmployeeCategoryListResponse>(`/api/EmployeeCategories?${queryParams}`);
      return response.data || null;
    } catch (error) {
      console.error('Error fetching employee categories:', error);
      return null;
    }
  },

  async getEmployeeCategory(id: string): Promise<EmployeeCategory | null> {
    try {
      const response = await apiClient.get<EmployeeCategory>(`/api/EmployeeCategories/${id}`);
      return response.data || null;
    } catch (error) {
      console.error('Error fetching employee category:', error);
      return null;
    }
  },

  async createEmployeeCategory(data: Omit<EmployeeCategory, 'id' | 'createdAt' | 'updatedAt'>): Promise<EmployeeCategory | null> {
    try {
      const response = await apiClient.post<EmployeeCategory>('/api/EmployeeCategories', data);
      return response.data || null;
    } catch (error) {
      console.error('Error creating employee category:', error);
      return null;
    }
  },

  async updateEmployeeCategory(id: string, data: Partial<EmployeeCategory>): Promise<EmployeeCategory | null> {
    try {
      const response = await apiClient.put<EmployeeCategory>(`/api/EmployeeCategories/${id}`, data);
      return response.data || null;
    } catch (error) {
      console.error('Error updating employee category:', error);
      return null;
    }
  },

  async deleteEmployeeCategory(id: string): Promise<boolean> {
    try {
      await apiClient.delete(`/api/EmployeeCategories/${id}`);
      return true;
    } catch (error) {
      console.error('Error deleting employee category:', error);
      return false;
    }
  }
};
