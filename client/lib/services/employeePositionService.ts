import { apiClient } from '../apiClient';

export interface EmployeePosition {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeePositionListResponse {
  items: EmployeePosition[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

export interface EmployeePositionRequest {
  pageNumber: number;
  pageSize: number;
  searchTerm?: string;
  isActive?: boolean;
}

export const employeePositionService = {
  async getEmployeePositions(params: EmployeePositionRequest): Promise<EmployeePositionListResponse | null> {
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

      const response = await apiClient.get<EmployeePositionListResponse>(`/api/EmployeePositions?${queryParams}`);
      return response.data || null;
    } catch (error) {
      console.error('Error fetching employee positions:', error);
      return null;
    }
  },

  async getEmployeePosition(id: string): Promise<EmployeePosition | null> {
    try {
      const response = await apiClient.get<EmployeePosition>(`/api/EmployeePositions/${id}`);
      return response.data || null;
    } catch (error) {
      console.error('Error fetching employee position:', error);
      return null;
    }
  },

  async createEmployeePosition(data: Omit<EmployeePosition, 'id' | 'createdAt' | 'updatedAt'>): Promise<EmployeePosition | null> {
    try {
      const response = await apiClient.post<EmployeePosition>('/api/EmployeePositions', data);
      return response.data || null;
    } catch (error) {
      console.error('Error creating employee position:', error);
      return null;
    }
  },

  async updateEmployeePosition(id: string, data: Partial<EmployeePosition>): Promise<EmployeePosition | null> {
    try {
      const response = await apiClient.put<EmployeePosition>(`/api/EmployeePositions/${id}`, data);
      return response.data || null;
    } catch (error) {
      console.error('Error updating employee position:', error);
      return null;
    }
  },

  async deleteEmployeePosition(id: string): Promise<boolean> {
    try {
      await apiClient.delete(`/api/EmployeePositions/${id}`);
      return true;
    } catch (error) {
      console.error('Error deleting employee position:', error);
      return false;
    }
  }
};
