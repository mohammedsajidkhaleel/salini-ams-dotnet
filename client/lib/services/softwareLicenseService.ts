/**
 * Software License Service
 * Handles all software license-related API calls
 */

import { apiClient, type PaginatedResponse } from '../apiClient';

export interface SoftwareLicense {
  id: string;
  softwareName: string;
  licenseKey?: string;
  licenseType?: string;
  seats?: number;
  vendor?: string;
  purchaseDate?: string;
  expiryDate?: string;
  cost?: number;
  status: number;
  notes?: string;
  poNumber?: string;
  projectId?: string;
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
  
  // Navigation properties (loaded separately)
  project?: {
    id: string;
    name: string;
    code: string;
  };
  
  // Assignment information
  currentAssignments?: Array<{
    id: string;
    employeeId: string;
    employeeName: string;
    assignedDate: string;
    status: number;
  }>;
  
  // Usage statistics
  assignedSeats?: number;
  availableSeats?: number;
}

export interface SoftwareLicenseCreateRequest {
  softwareName: string;
  licenseKey?: string;
  licenseType?: string;
  seats?: number;
  vendor?: string;
  purchaseDate?: string;
  expiryDate?: string;
  cost?: number;
  status: number;
  notes?: string;
  poNumber?: string;
  projectId?: string;
}

export interface SoftwareLicenseUpdateRequest {
  softwareName?: string;
  licenseKey?: string;
  licenseType?: string;
  seats?: number;
  vendor?: string;
  purchaseDate?: string;
  expiryDate?: string;
  cost?: number;
  status?: number;
  notes?: string;
  poNumber?: string;
  projectId?: string;
}

export interface SoftwareLicenseListRequest {
  pageNumber?: number;
  pageSize?: number;
  search?: string;
  status?: number;
  vendor?: string;
  licenseType?: string;
  projectId?: string;
  expiringSoon?: boolean;
  assignedTo?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface SoftwareLicenseAssignmentRequest {
  softwareLicenseId: string;
  employeeId: string;
  notes?: string;
}

export interface SoftwareLicenseUnassignmentRequest {
  softwareLicenseId: string;
  employeeId: string;
  notes?: string;
}

class SoftwareLicenseService {
  private readonly baseEndpoint = '/api/SoftwareLicenses';

  /**
   * Get paginated list of software licenses
   */
  async getSoftwareLicenses(params?: SoftwareLicenseListRequest): Promise<PaginatedResponse<SoftwareLicense>> {
    const response = await apiClient.get<PaginatedResponse<SoftwareLicense>>(this.baseEndpoint, params);
    return response.data!;
  }

  /**
   * Get software license by ID
   */
  async getSoftwareLicenseById(id: string): Promise<SoftwareLicense> {
    const response = await apiClient.get<SoftwareLicense>(`${this.baseEndpoint}/${id}`);
    return response.data!;
  }

  /**
   * Create new software license
   */
  async createSoftwareLicense(license: SoftwareLicenseCreateRequest): Promise<SoftwareLicense> {
    const response = await apiClient.post<SoftwareLicense>(this.baseEndpoint, license);
    return response.data!;
  }

  /**
   * Update software license
   */
  async updateSoftwareLicense(id: string, license: SoftwareLicenseUpdateRequest): Promise<SoftwareLicense> {
    const response = await apiClient.put<SoftwareLicense>(`${this.baseEndpoint}/${id}`, license);
    return response.data!;
  }

  /**
   * Delete software license
   */
  async deleteSoftwareLicense(id: string): Promise<void> {
    await apiClient.delete(`${this.baseEndpoint}/${id}`);
  }

  /**
   * Assign software license to employee
   */
  async assignSoftwareLicense(assignment: SoftwareLicenseAssignmentRequest): Promise<void> {
    await apiClient.post(`${this.baseEndpoint}/${assignment.softwareLicenseId}/assign`, {
      employeeId: assignment.employeeId,
      notes: assignment.notes,
    });
  }

  /**
   * Unassign software license from employee
   */
  async unassignSoftwareLicense(softwareLicenseId: string, employeeId: string, notes?: string): Promise<void> {
    await apiClient.post(`${this.baseEndpoint}/${softwareLicenseId}/unassign`, {
      employeeId,
      notes,
    });
  }

  /**
   * Get software licenses by project
   */
  async getSoftwareLicensesByProject(projectId: string, params?: Omit<SoftwareLicenseListRequest, 'projectId'>): Promise<PaginatedResponse<SoftwareLicense>> {
    const requestParams = { ...params, projectId };
    return this.getSoftwareLicenses(requestParams);
  }

  /**
   * Get software licenses by vendor
   */
  async getSoftwareLicensesByVendor(vendor: string, params?: Omit<SoftwareLicenseListRequest, 'vendor'>): Promise<PaginatedResponse<SoftwareLicense>> {
    const requestParams = { ...params, vendor };
    return this.getSoftwareLicenses(requestParams);
  }

  /**
   * Get software licenses by type
   */
  async getSoftwareLicensesByType(licenseType: string, params?: Omit<SoftwareLicenseListRequest, 'licenseType'>): Promise<PaginatedResponse<SoftwareLicense>> {
    const requestParams = { ...params, licenseType };
    return this.getSoftwareLicenses(requestParams);
  }

  /**
   * Get expiring software licenses
   */
  async getExpiringSoftwareLicenses(daysAhead: number = 30, params?: Omit<SoftwareLicenseListRequest, 'expiringSoon'>): Promise<PaginatedResponse<SoftwareLicense>> {
    const requestParams = { ...params, expiringSoon: true };
    return this.getSoftwareLicenses(requestParams);
  }

  /**
   * Search software licenses
   */
  async searchSoftwareLicenses(searchTerm: string, params?: Omit<SoftwareLicenseListRequest, 'search'>): Promise<PaginatedResponse<SoftwareLicense>> {
    const requestParams = { ...params, search: searchTerm };
    return this.getSoftwareLicenses(requestParams);
  }

  /**
   * Get software licenses by status
   */
  async getSoftwareLicensesByStatus(status: number, params?: Omit<SoftwareLicenseListRequest, 'status'>): Promise<PaginatedResponse<SoftwareLicense>> {
    const requestParams = { ...params, status };
    return this.getSoftwareLicenses(requestParams);
  }

  /**
   * Check if software name is unique
   */
  async isSoftwareNameUnique(softwareName: string, excludeId?: string): Promise<boolean> {
    try {
      const params: any = { softwareName };
      if (excludeId) {
        params.excludeId = excludeId;
      }
      
      const response = await apiClient.get<{ isUnique: boolean }>(`${this.baseEndpoint}/check-unique-name`, params);
      return response.data?.isUnique ?? true;
    } catch (error) {
      // If API call fails, assume it's unique to allow creation
      return true;
    }
  }

  /**
   * Check if license key is unique
   */
  async isLicenseKeyUnique(licenseKey: string, excludeId?: string): Promise<boolean> {
    try {
      const params: any = { licenseKey };
      if (excludeId) {
        params.excludeId = excludeId;
      }
      
      const response = await apiClient.get<{ isUnique: boolean }>(`${this.baseEndpoint}/check-unique-key`, params);
      return response.data?.isUnique ?? true;
    } catch (error) {
      // If API call fails, assume it's unique to allow creation
      return true;
    }
  }

  /**
   * Get software license statistics
   */
  async getSoftwareLicenseStatistics(): Promise<{
    total: number;
    totalSeats: number;
    assignedSeats: number;
    availableSeats: number;
    expiringSoon: number;
    byStatus: Array<{ status: number; count: number }>;
    byVendor: Array<{ vendor: string; count: number }>;
    byProject: Array<{ projectId: string; projectName: string; count: number }>;
  }> {
    const response = await apiClient.get(`${this.baseEndpoint}/statistics`);
    return response.data!;
  }

  /**
   * Get software license history
   */
  async getSoftwareLicenseHistory(softwareLicenseId: string): Promise<Array<{
    id: string;
    action: string;
    employeeId?: string;
    employeeName?: string;
    notes?: string;
    createdAt: string;
    createdBy?: string;
  }>> {
    const response = await apiClient.get(`${this.baseEndpoint}/${softwareLicenseId}/history`);
    return response.data!;
  }

  /**
   * Get software license assignments
   */
  async getSoftwareLicenseAssignments(softwareLicenseId: string): Promise<Array<{
    id: string;
    employeeId: string;
    employeeName: string;
    assignedDate: string;
    status: number;
    notes?: string;
  }>> {
    const response = await apiClient.get(`${this.baseEndpoint}/${softwareLicenseId}/assignments`);
    return response.data!;
  }

  /**
   * Export software licenses to CSV
   */
  async exportSoftwareLicenses(params?: SoftwareLicenseListRequest): Promise<Blob> {
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
   * Import software licenses from CSV
   */
  async importSoftwareLicenses(file: File): Promise<{
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
   * Get license assignments for a specific license
   */
  async getLicenseAssignments(licenseId: string): Promise<Array<{
    id: string;
    employeeId: string;
    employee?: {
      id: string;
      employeeId: string;
      fullName: string;
      email: string;
      department: string;
    };
    softwareLicenseId: string;
    assignedDate: string;
    returnedDate?: string;
    status: string;
    notes?: string;
    createdAt: string;
  }> | null> {
    try {
      const response = await apiClient.get<Array<{
        id: string;
        employeeId: string;
        employee?: {
          id: string;
          employeeId: string;
          fullName: string;
          email: string;
          department: string;
        };
        softwareLicenseId: string;
        assignedDate: string;
        returnedDate?: string;
        status: string;
        notes?: string;
        createdAt: string;
      }>>(`${this.baseEndpoint}/${licenseId}/assignments`);
      return response.data || null;
    } catch (error) {
      console.error('Error fetching license assignments:', error);
      return null;
    }
  }

  /**
   * Assign a license to an employee
   */
  async assignLicense(licenseId: string, assignment: {
    employeeId: string;
    notes?: string;
  }): Promise<void> {
    try {
      console.log('Assigning license:', { licenseId, assignment });
      
      // Map frontend camelCase to backend PascalCase
      const requestBody = {
        EmployeeId: assignment.employeeId,
        Notes: assignment.notes || null
      };
      
      console.log('Request body:', requestBody);
      console.log('Request URL:', `${this.baseEndpoint}/${licenseId}/assign`);
      
      const response = await apiClient.post(`${this.baseEndpoint}/${licenseId}/assign`, requestBody);
      console.log('License assignment successful:', response);
    } catch (error) {
      console.error('Error assigning license:', error);
      console.error('Error type:', typeof error);
      console.error('Error constructor:', error?.constructor?.name);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        status: (error as any)?.response?.status,
        statusText: (error as any)?.response?.statusText,
        data: (error as any)?.response?.data,
        config: (error as any)?.config,
        request: (error as any)?.request
      });
      
      // Log the full error object (with error handling for circular references)
      try {
        console.error('Full error object:', JSON.stringify(error, null, 2));
      } catch (stringifyError) {
        console.error('Could not stringify error object:', stringifyError);
        console.error('Error object keys:', Object.keys(error || {}));
        console.error('Error object values:', Object.values(error || {}));
      }
      
      throw error;
    }
  }

  /**
   * Unassign a license from an employee
   */
  async unassignLicense(assignmentId: string, notes?: string): Promise<void> {
    try {
      console.log('Unassigning license:', { assignmentId, notes });
      
      // Send notes as query parameter instead of request body
      const queryParams = notes ? `?notes=${encodeURIComponent(notes)}` : '';
      const url = `${this.baseEndpoint}/assignments/${assignmentId}/unassign${queryParams}`;
      
      console.log('Request URL:', url);
      await apiClient.post(url, {}); // Empty body since we're using query params
      console.log('License unassignment successful');
    } catch (error) {
      console.error('Error unassigning license:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        status: (error as any)?.response?.status,
        statusText: (error as any)?.response?.statusText,
        data: (error as any)?.response?.data
      });
      throw error;
    }
  }
}

// Create singleton instance
export const softwareLicenseService = new SoftwareLicenseService();

// Export types
export type { 
  SoftwareLicense, 
  SoftwareLicenseCreateRequest, 
  SoftwareLicenseUpdateRequest, 
  SoftwareLicenseListRequest,
  SoftwareLicenseAssignmentRequest,
  SoftwareLicenseUnassignmentRequest
};
