import { apiClient } from '../apiClient';

export interface SimProvider {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SimProviderListResponse {
  items: SimProvider[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

export interface SimProviderRequest {
  pageNumber: number;
  pageSize: number;
  searchTerm?: string;
  isActive?: boolean;
}

export const simProviderService = {
  async getSimProviders(params: SimProviderRequest): Promise<SimProviderListResponse | null> {
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

      const response = await apiClient.get<SimProviderListResponse>(`/api/SimProviders?${queryParams}`);
      return response.data || null;
    } catch (error) {
      console.error('Error fetching SIM providers:', error);
      return null;
    }
  },

  async getSimProvider(id: string): Promise<SimProvider | null> {
    try {
      const response = await apiClient.get<SimProvider>(`/api/SimProviders/${id}`);
      return response.data || null;
    } catch (error) {
      console.error('Error fetching SIM provider:', error);
      return null;
    }
  },

  async createSimProvider(data: Omit<SimProvider, 'id' | 'createdAt' | 'updatedAt'>): Promise<SimProvider | null> {
    try {
      const response = await apiClient.post<SimProvider>('/api/SimProviders', data);
      return response.data || null;
    } catch (error) {
      console.error('Error creating SIM provider:', error);
      return null;
    }
  },

  async updateSimProvider(id: string, data: Partial<SimProvider>): Promise<SimProvider | null> {
    try {
      const response = await apiClient.put<SimProvider>(`/api/SimProviders/${id}`, data);
      return response.data || null;
    } catch (error) {
      console.error('Error updating SIM provider:', error);
      return null;
    }
  },

  async deleteSimProvider(id: string): Promise<boolean> {
    try {
      await apiClient.delete(`/api/SimProviders/${id}`);
      return true;
    } catch (error) {
      console.error('Error deleting SIM provider:', error);
      return false;
    }
  }
};
