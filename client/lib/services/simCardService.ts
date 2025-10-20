/**
 * SIM Card Service
 * Handles all SIM card-related API calls
 */

import { apiClient, type PaginatedResponse } from '../apiClient';

export interface SimCard {
  id: string;
  simAccountNo: string;
  simServiceNo: string;
  simStartDate?: string;
  simTypeId?: string;
  simCardPlanId?: string;
  simProviderId?: string;
  simStatus: number;
  simSerialNo?: string;
  assignedTo?: string;
  projectId?: string;
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
  
  // Navigation properties (loaded separately)
  simType?: {
    id: string;
    name: string;
  };
  simCardPlan?: {
    id: string;
    name: string;
    dataLimit?: string;
    monthlyFee?: number;
  };
  simProvider?: {
    id: string;
    name: string;
  };
  project?: {
    id: string;
    name: string;
    code: string;
  };
  
  // Assignment information
  currentAssignment?: {
    id: string;
    employeeId: string;
    employeeName: string;
    assignedDate: string;
    status: number;
  };
}

export interface SimCardCreateRequest {
  simAccountNo: string;
  simServiceNo: string;
  simStartDate?: string;
  simTypeId?: string;
  simCardPlanId?: string;
  simProviderId?: string;
  simStatus: number;
  simSerialNo?: string;
  assignedTo?: string;
  projectId?: string;
}

export interface SimCardUpdateRequest {
  simAccountNo?: string;
  simServiceNo?: string;
  simStartDate?: string;
  simTypeId?: string;
  simCardPlanId?: string;
  simProviderId?: string;
  simStatus?: number;
  simSerialNo?: string;
  assignedTo?: string;
  projectId?: string;
}

export interface SimCardListRequest {
  pageNumber?: number;
  pageSize?: number;
  search?: string;
  simStatus?: number;
  simTypeId?: string;
  simCardPlanId?: string;
  simProviderId?: string;
  projectId?: string;
  assigned?: boolean;
  assignedTo?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface SimCardAssignmentRequest {
  simCardId: string;
  employeeId: string;
  notes?: string;
}

export interface SimCardUnassignmentRequest {
  simCardId: string;
  notes?: string;
}

class SimCardService {
  private readonly baseEndpoint = '/api/SimCards';

  /**
   * Get paginated list of SIM cards
   */
  async getSimCards(params?: SimCardListRequest): Promise<PaginatedResponse<SimCard>> {
    const response = await apiClient.get<PaginatedResponse<SimCard>>(this.baseEndpoint, params);
    return response.data!;
  }

  /**
   * Get SIM card by ID
   */
  async getSimCardById(id: string): Promise<SimCard> {
    const response = await apiClient.get<SimCard>(`${this.baseEndpoint}/${id}`);
    return response.data!;
  }

  /**
   * Create new SIM card
   */
  async createSimCard(simCard: SimCardCreateRequest): Promise<SimCard> {
    const response = await apiClient.post<SimCard>(this.baseEndpoint, simCard);
    return response.data!;
  }

  /**
   * Update SIM card
   */
  async updateSimCard(id: string, simCard: SimCardUpdateRequest): Promise<SimCard> {
    const response = await apiClient.put<SimCard>(`${this.baseEndpoint}/${id}`, simCard);
    return response.data!;
  }

  /**
   * Delete SIM card
   */
  async deleteSimCard(id: string): Promise<void> {
    await apiClient.delete(`${this.baseEndpoint}/${id}`);
  }

  /**
   * Assign SIM card to employee
   */
  async assignSimCard(assignment: SimCardAssignmentRequest): Promise<void> {
    await apiClient.post(`${this.baseEndpoint}/${assignment.simCardId}/assign`, {
      employeeId: assignment.employeeId,
      notes: assignment.notes,
    });
  }

  /**
   * Unassign SIM card from employee
   */
  async unassignSimCard(simCardId: string, notes?: string): Promise<void> {
    await apiClient.post(`${this.baseEndpoint}/${simCardId}/unassign`, {
      notes,
    });
  }

  /**
   * Get SIM cards by project
   */
  async getSimCardsByProject(projectId: string, params?: Omit<SimCardListRequest, 'projectId'>): Promise<PaginatedResponse<SimCard>> {
    const requestParams = { ...params, projectId };
    return this.getSimCards(requestParams);
  }

  /**
   * Get SIM cards by provider
   */
  async getSimCardsByProvider(providerId: string, params?: Omit<SimCardListRequest, 'simProviderId'>): Promise<PaginatedResponse<SimCard>> {
    const requestParams = { ...params, simProviderId: providerId };
    return this.getSimCards(requestParams);
  }

  /**
   * Get SIM cards by plan
   */
  async getSimCardsByPlan(planId: string, params?: Omit<SimCardListRequest, 'simCardPlanId'>): Promise<PaginatedResponse<SimCard>> {
    const requestParams = { ...params, simCardPlanId: planId };
    return this.getSimCards(requestParams);
  }

  /**
   * Get assigned SIM cards
   */
  async getAssignedSimCards(params?: Omit<SimCardListRequest, 'assigned'>): Promise<PaginatedResponse<SimCard>> {
    const requestParams = { ...params, assigned: true };
    return this.getSimCards(requestParams);
  }

  /**
   * Get unassigned SIM cards
   */
  async getUnassignedSimCards(params?: Omit<SimCardListRequest, 'assigned'>): Promise<PaginatedResponse<SimCard>> {
    const requestParams = { ...params, assigned: false };
    return this.getSimCards(requestParams);
  }

  /**
   * Search SIM cards
   */
  async searchSimCards(searchTerm: string, params?: Omit<SimCardListRequest, 'search'>): Promise<PaginatedResponse<SimCard>> {
    const requestParams = { ...params, search: searchTerm };
    return this.getSimCards(requestParams);
  }

  /**
   * Get SIM cards by status
   */
  async getSimCardsByStatus(status: number, params?: Omit<SimCardListRequest, 'simStatus'>): Promise<PaginatedResponse<SimCard>> {
    const requestParams = { ...params, simStatus: status };
    return this.getSimCards(requestParams);
  }

  /**
   * Check if SIM account number is unique
   */
  async isSimAccountNoUnique(simAccountNo: string, excludeId?: string): Promise<boolean> {
    try {
      const params: any = { simAccountNo };
      if (excludeId) {
        params.excludeId = excludeId;
      }
      
      const response = await apiClient.get<{ isUnique: boolean }>(`${this.baseEndpoint}/check-unique-account`, params);
      return response.data?.isUnique ?? true;
    } catch (error) {
      // If API call fails, assume it's unique to allow creation
      return true;
    }
  }

  /**
   * Check if SIM service number is unique
   */
  async isSimServiceNoUnique(simServiceNo: string, excludeId?: string): Promise<boolean> {
    try {
      const params: any = { simServiceNo };
      if (excludeId) {
        params.excludeId = excludeId;
      }
      
      const response = await apiClient.get<{ isUnique: boolean }>(`${this.baseEndpoint}/check-unique-service`, params);
      return response.data?.isUnique ?? true;
    } catch (error) {
      // If API call fails, assume it's unique to allow creation
      return true;
    }
  }

  /**
   * Check if SIM serial number is unique
   */
  async isSimSerialNoUnique(simSerialNo: string, excludeId?: string): Promise<boolean> {
    try {
      const params: any = { simSerialNo };
      if (excludeId) {
        params.excludeId = excludeId;
      }
      
      const response = await apiClient.get<{ isUnique: boolean }>(`${this.baseEndpoint}/check-unique-serial`, params);
      return response.data?.isUnique ?? true;
    } catch (error) {
      // If API call fails, assume it's unique to allow creation
      return true;
    }
  }

  /**
   * Get SIM card statistics
   */
  async getSimCardStatistics(): Promise<{
    total: number;
    assigned: number;
    unassigned: number;
    byStatus: Array<{ status: number; count: number }>;
    byProvider: Array<{ providerId: string; providerName: string; count: number }>;
    byPlan: Array<{ planId: string; planName: string; count: number }>;
    byProject: Array<{ projectId: string; projectName: string; count: number }>;
  }> {
    const response = await apiClient.get(`${this.baseEndpoint}/statistics`);
    return response.data!;
  }

  /**
   * Get SIM card history
   */
  async getSimCardHistory(simCardId: string): Promise<Array<{
    id: string;
    action: string;
    employeeId?: string;
    employeeName?: string;
    notes?: string;
    createdAt: string;
    createdBy?: string;
  }>> {
    const response = await apiClient.get(`${this.baseEndpoint}/${simCardId}/history`);
    return response.data!;
  }

  /**
   * Export SIM cards to CSV
   */
  async exportSimCards(params?: SimCardListRequest): Promise<Blob> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
    }

    const url = `${apiClient['baseUrl']}${this.baseEndpoint}/export?${searchParams.toString()}`;
    const headers: HeadersInit = {};
    
    const token = apiClient.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      throw new Error(`Export failed: ${response.statusText}`);
    }

    return response.blob();
  }

  /**
   * Import SIM cards from CSV
   */
  async importSimCards(file: File): Promise<{
    success: boolean;
    imported: number;
    errors: Array<{ row: number; message: string }>;
  }> {
    const response = await apiClient.uploadFile<{
      success: boolean;
      imported: number;
      errors: Array<{ row: number; message: string }>;
    }>(`${this.baseEndpoint}/import`, file);
    
    return response.data!;
  }

  /**
   * Import SIM cards from data array
   */
  async importSimCards(data: {
    SimCards: Array<{
      SimAccountNo: string;
      SimServiceNo: string;
      SimStartDate?: string;
      SimType?: string;
      SimProvider?: string;
      SimCardPlan?: string;
      SimStatus?: string;
      SimSerialNo?: string;
      AssignedTo?: string;
    }>;
    ProjectId?: string;
  }): Promise<{
    success: boolean;
    imported: number;
    updated: number;
    errors: Array<{ row: number; message: string }>;
  }> {
    const response = await apiClient.post<{
      success: boolean;
      imported: number;
      updated: number;
      errors: Array<{ row: number; message: string }>;
    }>(`${this.baseEndpoint}/import`, data);
    
    return response.data!;
  }
}

// Create singleton instance
export const simCardService = new SimCardService();

// Export types
export type { 
  SimCard, 
  SimCardCreateRequest, 
  SimCardUpdateRequest, 
  SimCardListRequest,
  SimCardAssignmentRequest,
  SimCardUnassignmentRequest
};
