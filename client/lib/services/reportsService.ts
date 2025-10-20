/**
 * Reports Service
 * Handles all reporting-related API calls
 */

import { apiClient } from '../apiClient';

export interface AssetSummaryReport {
  totalAssets: number;
  assignedAssets: number;
  unassignedAssets: number;
  assetsByStatus: Array<{
    status: number;
    statusName: string;
    count: number;
  }>;
  assetsByProject: Array<{
    projectId: string;
    projectName: string;
    count: number;
  }>;
  assetsByItem: Array<{
    itemId: string;
    itemName: string;
    count: number;
  }>;
  totalValue: number;
  averageValue: number;
}

export interface EmployeeAssetReport {
  totalEmployees: number;
  employeesWithAssets: number;
  employeesWithoutAssets: number;
  averageAssetsPerEmployee: number;
  topAssetHolders: Array<{
    employeeId: string;
    employeeName: string;
    assetCount: number;
  }>;
  assetsByDepartment: Array<{
    departmentId: string;
    departmentName: string;
    employeeCount: number;
    assetCount: number;
  }>;
  assetsByProject: Array<{
    projectId: string;
    projectName: string;
    employeeCount: number;
    assetCount: number;
  }>;
}

export interface AssetUtilizationReport {
  totalAssets: number;
  utilizedAssets: number;
  utilizationRate: number;
  utilizationByProject: Array<{
    projectId: string;
    projectName: string;
    totalAssets: number;
    utilizedAssets: number;
    utilizationRate: number;
  }>;
  utilizationByItem: Array<{
    itemId: string;
    itemName: string;
    totalAssets: number;
    utilizedAssets: number;
    utilizationRate: number;
  }>;
  utilizationTrend: Array<{
    month: string;
    totalAssets: number;
    utilizedAssets: number;
    utilizationRate: number;
  }>;
}

export interface AssetMaintenanceReport {
  totalAssets: number;
  assetsRequiringMaintenance: number;
  maintenanceOverdue: number;
  maintenanceDueSoon: number;
  maintenanceByStatus: Array<{
    status: number;
    statusName: string;
    count: number;
  }>;
  maintenanceByProject: Array<{
    projectId: string;
    projectName: string;
    count: number;
  }>;
  maintenanceHistory: Array<{
    month: string;
    maintenanceCount: number;
    cost: number;
  }>;
}

export interface AssetExpiringWarranty {
  id: string;
  assetTag: string;
  name: string;
  warrantyExpiryDate: string;
  daysUntilExpiry: number;
  projectId?: string;
  projectName?: string;
  assignedTo?: string;
  employeeName?: string;
}

export interface ReportRequest {
  startDate?: string;
  endDate?: string;
  projectId?: string;
  departmentId?: string;
  companyId?: string;
  format?: 'json' | 'csv' | 'pdf';
}

class ReportsService {
  private readonly baseEndpoint = '/api/Reports';

  /**
   * Get asset summary report
   */
  async getAssetSummaryReport(params?: ReportRequest): Promise<AssetSummaryReport> {
    const response = await apiClient.get<AssetSummaryReport>(`${this.baseEndpoint}/asset-summary`, params);
    return response.data!;
  }

  /**
   * Get employee asset report
   */
  async getEmployeeAssetReport(params?: ReportRequest): Promise<EmployeeAssetReport> {
    const response = await apiClient.get<EmployeeAssetReport>(`${this.baseEndpoint}/employee-asset`, params);
    return response.data!;
  }

  /**
   * Get asset utilization report
   */
  async getAssetUtilizationReport(params?: ReportRequest): Promise<AssetUtilizationReport> {
    const response = await apiClient.get<AssetUtilizationReport>(`${this.baseEndpoint}/asset-utilization`, params);
    return response.data!;
  }

  /**
   * Get asset maintenance report
   */
  async getAssetMaintenanceReport(params?: ReportRequest): Promise<AssetMaintenanceReport> {
    const response = await apiClient.get<AssetMaintenanceReport>(`${this.baseEndpoint}/asset-maintenance`, params);
    return response.data!;
  }

  /**
   * Get assets with expiring warranty
   */
  async getAssetsWithExpiringWarranty(daysAhead: number = 30): Promise<AssetExpiringWarranty[]> {
    const response = await apiClient.get<AssetExpiringWarranty[]>(`${this.baseEndpoint}/assets-expiring-warranty`, {
      daysAhead,
    });
    return response.data!;
  }

  /**
   * Export report to CSV
   */
  async exportReportToCsv(reportType: string, params?: ReportRequest): Promise<Blob> {
    const searchParams = new URLSearchParams();
    searchParams.append('format', 'csv');
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
    }

    const url = `${apiClient['baseUrl']}${this.baseEndpoint}/${reportType}/export?${searchParams.toString()}`;
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
   * Export report to PDF
   */
  async exportReportToPdf(reportType: string, params?: ReportRequest): Promise<Blob> {
    const searchParams = new URLSearchParams();
    searchParams.append('format', 'pdf');
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
    }

    const url = `${apiClient['baseUrl']}${this.baseEndpoint}/${reportType}/export?${searchParams.toString()}`;
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
   * Get available report types
   */
  async getAvailableReports(): Promise<Array<{
    id: string;
    name: string;
    description: string;
    category: string;
  }>> {
    const response = await apiClient.get(`${this.baseEndpoint}/available`);
    return response.data!;
  }

  /**
   * Get report parameters for a specific report type
   */
  async getReportParameters(reportType: string): Promise<Array<{
    name: string;
    type: string;
    required: boolean;
    description: string;
    options?: Array<{ value: string; label: string }>;
  }>> {
    const response = await apiClient.get(`${this.baseEndpoint}/${reportType}/parameters`);
    return response.data!;
  }

  /**
   * Schedule a report
   */
  async scheduleReport(reportType: string, schedule: {
    frequency: 'daily' | 'weekly' | 'monthly';
    time: string;
    email: string;
    parameters?: Record<string, any>;
  }): Promise<{
    id: string;
    status: string;
    nextRun: string;
  }> {
    const response = await apiClient.post(`${this.baseEndpoint}/${reportType}/schedule`, schedule);
    return response.data!;
  }

  /**
   * Get scheduled reports
   */
  async getScheduledReports(): Promise<Array<{
    id: string;
    reportType: string;
    frequency: string;
    nextRun: string;
    status: string;
    email: string;
  }>> {
    const response = await apiClient.get(`${this.baseEndpoint}/scheduled`);
    return response.data!;
  }

  /**
   * Cancel scheduled report
   */
  async cancelScheduledReport(scheduleId: string): Promise<void> {
    await apiClient.delete(`${this.baseEndpoint}/scheduled/${scheduleId}`);
  }
}

// Create singleton instance
export const reportsService = new ReportsService();

// Export types
export type {
  AssetSummaryReport,
  EmployeeAssetReport,
  AssetUtilizationReport,
  AssetMaintenanceReport,
  AssetExpiringWarranty,
  ReportRequest,
};
