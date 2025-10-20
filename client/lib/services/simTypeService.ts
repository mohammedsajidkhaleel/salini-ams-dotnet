import { apiClient } from '../apiClient';

export interface SimType {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SimTypeListResponse {
  items: SimType[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

export interface SimTypeRequest {
  pageNumber: number;
  pageSize: number;
  searchTerm?: string;
  isActive?: boolean;
}

export const simTypeService = {
  async getSimTypes(params: SimTypeRequest): Promise<SimTypeListResponse | null> {
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

      const response = await apiClient.get<SimTypeListResponse>(`/api/SimTypes?${queryParams}`);
      return response.data || null;
    } catch (error) {
      console.error('Error fetching SIM types:', error);
      return null;
    }
  },

  async getSimType(id: string): Promise<SimType | null> {
    try {
      const response = await apiClient.get<SimType>(`/api/SimTypes/${id}`);
      return response.data || null;
    } catch (error) {
      console.error('Error fetching SIM type:', error);
      return null;
    }
  },

  async createSimType(data: Omit<SimType, 'id' | 'createdAt' | 'updatedAt'>): Promise<SimType | null> {
    try {
      const response = await apiClient.post<SimType>('/api/SimTypes', data);
      return response.data || null;
    } catch (error) {
      console.error('Error creating SIM type:', error);
      return null;
    }
  },

  async updateSimType(id: string, data: Partial<SimType>): Promise<SimType | null> {
    try {
      const response = await apiClient.put<SimType>(`/api/SimTypes/${id}`, data);
      return response.data || null;
    } catch (error) {
      console.error('Error updating SIM type:', error);
      return null;
    }
  },

  async deleteSimType(id: string): Promise<boolean> {
    try {
      await apiClient.delete(`/api/SimTypes/${id}`);
      return true;
    } catch (error) {
      console.error('Error deleting SIM type:', error);
      return false;
    }
  }
};
