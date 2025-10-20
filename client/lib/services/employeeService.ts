/**
 * Employee Service
 * Handles all employee-related API calls
 */

import { apiClient, type PaginatedResponse } from '../apiClient';
import { apiDeduplicator } from '../apiDeduplicator';

export interface Employee {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email?: string;
  phone?: string;
  status: number;
  nationalityId?: string;
  employeeCategoryId?: string;
  employeePositionId?: string;
  departmentId?: string;
  subDepartmentId?: string;
  projectId?: string;
  companyId?: string;
  costCenterId?: string;
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
  
  // Navigation properties (loaded separately)
  nationality?: {
    id: string;
    name: string;
  };
  employeeCategory?: {
    id: string;
    name: string;
  };
  employeePosition?: {
    id: string;
    name: string;
  };
  department?: {
    id: string;
    name: string;
  };
  subDepartment?: {
    id: string;
    name: string;
  };
  project?: {
    id: string;
    name: string;
    code: string;
  };
  company?: {
    id: string;
    name: string;
  };
  costCenter?: {
    id: string;
    name: string;
  };
}

// Interface for the list view (matches backend EmployeeListDto)
export interface EmployeeListItem {
  id: string;
  employeeId: string;
  fullName: string;
  email?: string;
  phone?: string;
  departmentName?: string;
  subDepartmentName?: string;
  employeePositionName?: string;
  projectName?: string;
  companyName?: string;
  status: number;
  assetCount: number;
  simCardCount: number;
  softwareLicenseCount: number;
}

export interface EmployeeCreateRequest {
  employeeId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  status: number;
  nationalityId?: string;
  employeeCategoryId?: string;
  employeePositionId?: string;
  departmentId?: string;
  subDepartmentId?: string;
  projectId?: string;
  companyId?: string;
  costCenterId?: string;
}

export interface EmployeeUpdateRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  status?: number;
  nationalityId?: string;
  employeeCategoryId?: string;
  employeePositionId?: string;
  departmentId?: string;
  subDepartmentId?: string;
  projectId?: string;
  companyId?: string;
  costCenterId?: string;
}

export interface EmployeeListRequest {
  pageNumber?: number;
  pageSize?: number;
  searchTerm?: string;
  status?: number;
  departmentId?: string;
  projectId?: string;
  companyId?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface EmployeeImportData {
  employeeId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  status?: number;
  departmentName?: string;
  subDepartmentName?: string;
  companyName?: string;
  projectName?: string;
  nationalityName?: string;
  employeeCategoryName?: string;
  employeePositionName?: string;
  costCenterName?: string;
}

export interface EmployeeReportData {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email?: string;
  phone?: string;
  address?: string;
  idNumber?: string;
  joiningDate?: string;
  status: number;
  departmentName?: string;
  subDepartmentName?: string;
  positionName?: string;
  projectName?: string;
  companyName?: string;
  nationalityName?: string;
  assets: EmployeeReportAsset[];
  accessories: EmployeeReportAccessory[];
  softwareLicenses: EmployeeReportSoftwareLicense[];
  simCards: EmployeeReportSimCard[];
}

export interface EmployeeReportAsset {
  id: string;
  assetTag: string;
  name: string;
  serialNumber?: string;
  condition?: string;
  itemName?: string;
  assignedDate: string;
  notes?: string;
}

export interface EmployeeReportAccessory {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  assignedDate: string;
  notes?: string;
}

export interface EmployeeReportSoftwareLicense {
  id: string;
  softwareName: string;
  vendor?: string;
  licenseType?: string;
  assignedDate: string;
  expiryDate?: string;
  notes?: string;
}

export interface EmployeeReportSimCard {
  id: string;
  simAccountNo: string;
  simServiceNo: string;
  simSerialNo?: string;
  providerName?: string;
  planName?: string;
  assignedDate: string;
  expiryDate?: string;
  notes?: string;
}

class EmployeeService {
  private readonly baseEndpoint = '/api/Employees';

  /**
   * Get paginated list of employees
   */
  async getEmployees(params?: EmployeeListRequest): Promise<PaginatedResponse<EmployeeListItem>> {
    // Use deduplicator to prevent duplicate calls
    const key = apiDeduplicator.generateKey('getEmployees', params);
    const response = await apiDeduplicator.execute(key, async () => {
      return await apiClient.get<PaginatedResponse<EmployeeListItem>>(this.baseEndpoint, params);
    });
    return response.data!;
  }

  /**
   * Get employee by ID
   */
  async getEmployeeById(id: string): Promise<Employee> {
    const response = await apiClient.get<Employee>(`${this.baseEndpoint}/${id}`);
    return response.data!;
  }

  /**
   * Get comprehensive employee report data including all assigned items
   */
  async getEmployeeReport(id: string): Promise<EmployeeReportData> {
    const response = await apiClient.get<EmployeeReportData>(`${this.baseEndpoint}/${id}/report`);
    return response.data!;
  }

  /**
   * Create new employee
   */
  async createEmployee(employee: EmployeeCreateRequest): Promise<Employee> {
    const response = await apiClient.post<Employee>(this.baseEndpoint, employee);
    return response.data!;
  }

  /**
   * Update employee
   */
  async updateEmployee(id: string, employee: EmployeeUpdateRequest): Promise<Employee> {
    const response = await apiClient.put<Employee>(`${this.baseEndpoint}/${id}`, employee);
    return response.data!;
  }

  /**
   * Delete employee
   */
  async deleteEmployee(id: string): Promise<void> {
    await apiClient.delete(`${this.baseEndpoint}/${id}`);
  }

  /**
   * Get employees by department
   */
  async getEmployeesByDepartment(departmentId: string, params?: Omit<EmployeeListRequest, 'departmentId'>): Promise<PaginatedResponse<EmployeeListItem>> {
    const requestParams = { ...params, departmentId };
    return this.getEmployees(requestParams);
  }

  /**
   * Get employees by project
   */
  async getEmployeesByProject(projectId: string, params?: Omit<EmployeeListRequest, 'projectId'>): Promise<PaginatedResponse<EmployeeListItem>> {
    const requestParams = { ...params, projectId };
    return this.getEmployees(requestParams);
  }

  /**
   * Get employees by company
   */
  async getEmployeesByCompany(companyId: string, params?: Omit<EmployeeListRequest, 'companyId'>): Promise<PaginatedResponse<EmployeeListItem>> {
    const requestParams = { ...params, companyId };
    return this.getEmployees(requestParams);
  }

  /**
   * Search employees
   */
  async searchEmployees(searchTerm: string, params?: Omit<EmployeeListRequest, 'searchTerm'>): Promise<PaginatedResponse<EmployeeListItem>> {
    const requestParams = { ...params, searchTerm: searchTerm };
    return this.getEmployees(requestParams);
  }

  /**
   * Get active employees
   */
  async getActiveEmployees(params?: Omit<EmployeeListRequest, 'status'>): Promise<PaginatedResponse<EmployeeListItem>> {
    const requestParams = { ...params, status: 1 };
    return this.getEmployees(requestParams);
  }

  /**
   * Check if employee ID is unique
   */
  async isEmployeeIdUnique(employeeId: string, excludeId?: string): Promise<boolean> {
    try {
      const params: any = { employeeId };
      if (excludeId) {
        params.excludeId = excludeId;
      }
      
      const response = await apiClient.get<{ isUnique: boolean }>(`${this.baseEndpoint}/check-unique`, params);
      return response.data?.isUnique ?? true;
    } catch (error) {
      // If API call fails, assume it's unique to allow creation
      return true;
    }
  }

  /**
   * Get employee statistics
   */
  async getEmployeeStatistics(): Promise<{
    total: number;
    active: number;
    inactive: number;
    byDepartment: Array<{ departmentId: string; departmentName: string; count: number }>;
    byProject: Array<{ projectId: string; projectName: string; count: number }>;
  }> {
    const response = await apiClient.get(`${this.baseEndpoint}/statistics`);
    return response.data as {
      total: number;
      active: number;
      inactive: number;
      byDepartment: Array<{ departmentId: string; departmentName: string; count: number }>;
      byProject: Array<{ projectId: string; projectName: string; count: number }>;
    } || {
      total: 0,
      active: 0,
      inactive: 0,
      byDepartment: [],
      byProject: []
    };
  }

  /**
   * Export employees to CSV
   */
  async exportEmployees(params?: EmployeeListRequest): Promise<Blob> {
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
   * Import employees from CSV data
   */
  async importEmployees(employees: EmployeeImportData[]): Promise<{
    success: boolean;
    imported: number;
    errors: Array<{ row: number; message: string }>;
  }> {
    const response = await apiClient.post<{
      success: boolean;
      imported: number;
      errors: Array<{ row: number; message: string }>;
    }>(`${this.baseEndpoint}/import`, employees);
    
    return response.data!;
  }
}

// Create singleton instance
export const employeeService = new EmployeeService();
