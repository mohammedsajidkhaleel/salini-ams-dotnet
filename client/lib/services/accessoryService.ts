import { apiClient } from '../apiClient';

export interface Accessory {
  id: string;
  name: string;
  description?: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  status: string;
  condition?: string;
  quantity?: number;
  assignedTo?: string;
  assignedDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AccessoryListResponse {
  items: Accessory[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

export interface AccessoryRequest {
  pageNumber: number;
  pageSize: number;
  searchTerm?: string;
  status?: string;
  assignedTo?: string;
}

export interface AccessoryCreateRequest {
  name: string;
  description?: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  status?: string;
  condition?: string;
  quantity?: number;
}

export interface AccessoryUpdateRequest {
  name?: string;
  description?: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  status?: string;
  condition?: string;
  quantity?: number;
}

export interface AccessoryAssignmentRequest {
  employeeId: string;
  quantity?: number;
  notes?: string;
}

export interface AccessoryUnassignmentRequest {
  employeeId: string;
  quantity?: number;
  notes?: string;
}

export const accessoryService = {
  async getAccessories(params: AccessoryRequest): Promise<AccessoryListResponse | null> {
    try {
      const queryParams = new URLSearchParams({
        pageNumber: params.pageNumber.toString(),
        pageSize: params.pageSize.toString(),
      });

      if (params.searchTerm) {
        queryParams.append('searchTerm', params.searchTerm);
      }
      if (params.status) {
        queryParams.append('status', params.status);
      }
      if (params.assignedTo) {
        queryParams.append('assignedTo', params.assignedTo);
      }

      const response = await apiClient.get<AccessoryListResponse>(`/api/Accessories?${queryParams}`);
      return response.data || null;
    } catch (error) {
      console.error('Error fetching accessories:', error);
      return null;
    }
  },

  async getAccessory(id: string): Promise<Accessory | null> {
    try {
      const response = await apiClient.get<Accessory>(`/api/Accessories/${id}`);
      return response.data || null;
    } catch (error) {
      console.error('Error fetching accessory:', error);
      return null;
    }
  },

  async createAccessory(data: AccessoryCreateRequest): Promise<Accessory | null> {
    try {
      const response = await apiClient.post<Accessory>('/api/Accessories', data);
      return response.data || null;
    } catch (error) {
      console.error('Error creating accessory:', error);
      return null;
    }
  },

  async updateAccessory(id: string, data: AccessoryUpdateRequest): Promise<Accessory | null> {
    try {
      const response = await apiClient.put<Accessory>(`/api/Accessories/${id}`, data);
      return response.data || null;
    } catch (error) {
      console.error('Error updating accessory:', error);
      return null;
    }
  },

  async deleteAccessory(id: string): Promise<boolean> {
    try {
      await apiClient.delete(`/api/Accessories/${id}`);
      return true;
    } catch (error) {
      console.error('Error deleting accessory:', error);
      return false;
    }
  },

  async assignAccessory(accessoryId: string, assignment: AccessoryAssignmentRequest): Promise<void> {
    try {
      await apiClient.post(`/api/Accessories/${accessoryId}/assign`, assignment);
    } catch (error) {
      console.error('Error assigning accessory:', error);
      throw error;
    }
  },

  async unassignAccessory(accessoryId: string, unassignment: AccessoryUnassignmentRequest): Promise<void> {
    try {
      await apiClient.post(`/api/Accessories/${accessoryId}/unassign`, unassignment);
    } catch (error) {
      console.error('Error unassigning accessory:', error);
      throw error;
    }
  }
};
