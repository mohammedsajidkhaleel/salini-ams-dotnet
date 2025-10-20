import { apiClient } from '../apiClient';

export interface Nationality {
  id: string;
  name: string;
  code?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NationalityListResponse {
  items: Nationality[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

export interface NationalityRequest {
  pageNumber: number;
  pageSize: number;
  searchTerm?: string;
  isActive?: boolean;
}

export const nationalityService = {
  async getNationalities(params: NationalityRequest): Promise<NationalityListResponse | null> {
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

      const response = await apiClient.get<NationalityListResponse>(`/api/Nationalities?${queryParams}`);
      return response.data || null;
    } catch (error) {
      console.error('Error fetching nationalities:', error);
      return null;
    }
  },

  async getNationality(id: string): Promise<Nationality | null> {
    try {
      const response = await apiClient.get<Nationality>(`/api/Nationalities/${id}`);
      return response.data || null;
    } catch (error) {
      console.error('Error fetching nationality:', error);
      return null;
    }
  },

  async createNationality(data: Omit<Nationality, 'id' | 'createdAt' | 'updatedAt'>): Promise<Nationality | null> {
    try {
      const response = await apiClient.post<Nationality>('/api/Nationalities', data);
      return response.data || null;
    } catch (error) {
      console.error('Error creating nationality:', error);
      return null;
    }
  },

  async updateNationality(id: string, data: Partial<Nationality>): Promise<Nationality | null> {
    try {
      const response = await apiClient.put<Nationality>(`/api/Nationalities/${id}`, data);
      return response.data || null;
    } catch (error) {
      console.error('Error updating nationality:', error);
      return null;
    }
  },

  async deleteNationality(id: string): Promise<boolean> {
    try {
      await apiClient.delete(`/api/Nationalities/${id}`);
      return true;
    } catch (error) {
      console.error('Error deleting nationality:', error);
      return false;
    }
  }
};
