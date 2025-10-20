/**
 * Asset Service
 * Handles all asset-related API calls
 */

import { apiClient, type PaginatedResponse } from '../apiClient';

export interface Asset {
  id: string;
  assetTag: string;
  name: string;
  description?: string;
  serialNumber?: string;
  status: number;
  condition?: string;
  poNumber?: string;
  location?: string;
  notes?: string;
  itemId?: string;
  projectId?: string;
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
  
  // Navigation properties (loaded separately)
  item?: {
    id: string;
    name: string;
    itemCategory?: {
      id: string;
      name: string;
    };
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

export interface AssetCreateRequest {
  assetTag: string;
  name: string;
  description?: string;
  serialNumber?: string;
  status: number;
  condition?: string;
  poNumber?: string;
  location?: string;
  notes?: string;
  itemId?: string;
  projectId?: string;
}

export interface AssetUpdateRequest {
  name?: string;
  description?: string;
  serialNumber?: string;
  status?: number;
  condition?: string;
  poNumber?: string;
  location?: string;
  notes?: string;
  itemId?: string;
  projectId?: string;
}

export interface AssetImportData {
  assetTag: string;
  assetName: string;
  itemCategory: string;
  item: string;
  serialNo: string | null;
  assignedTo?: string;
  condition: string;
}

export interface AssetListRequest {
  pageNumber?: number;
  pageSize?: number;
  search?: string;
  status?: number;
  condition?: string;
  itemId?: string;
  projectId?: string;
  location?: string;
  assigned?: boolean;
  assignedTo?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface AssetAssignmentRequest {
  assetId: string;
  employeeId: string;
  notes?: string;
}

export interface AssetUnassignmentRequest {
  assetId: string;
  notes?: string;
}

class AssetService {
  private readonly baseEndpoint = '/api/Assets';

  /**
   * Get paginated list of assets
   */
  async getAssets(params?: AssetListRequest): Promise<PaginatedResponse<Asset>> {
    const response = await apiClient.get<PaginatedResponse<Asset>>(this.baseEndpoint, params);
    return response.data!;
  }

  /**
   * Get asset by ID
   */
  async getAssetById(id: string): Promise<Asset> {
    const response = await apiClient.get<Asset>(`${this.baseEndpoint}/${id}`);
    return response.data!;
  }

  /**
   * Create new asset
   */
  async createAsset(asset: AssetCreateRequest): Promise<Asset> {
    const response = await apiClient.post<Asset>(this.baseEndpoint, asset);
    return response.data!;
  }

  /**
   * Update asset
   */
  async updateAsset(id: string, asset: AssetUpdateRequest): Promise<Asset> {
    const response = await apiClient.put<Asset>(`${this.baseEndpoint}/${id}`, asset);
    return response.data!;
  }

  /**
   * Delete asset
   */
  async deleteAsset(id: string): Promise<void> {
    await apiClient.delete(`${this.baseEndpoint}/${id}`);
  }

  /**
   * Assign asset to employee
   */
  async assignAsset(assignment: AssetAssignmentRequest): Promise<void> {
    await apiClient.post(`${this.baseEndpoint}/${assignment.assetId}/assign`, {
      employeeId: assignment.employeeId,
      notes: assignment.notes,
    });
  }

  /**
   * Unassign asset from employee
   */
  async unassignAsset(assetId: string, notes?: string): Promise<void> {
    await apiClient.post(`${this.baseEndpoint}/${assetId}/unassign`, {
      notes,
    });
  }

  /**
   * Get assets by project
   */
  async getAssetsByProject(projectId: string, params?: Omit<AssetListRequest, 'projectId'>): Promise<PaginatedResponse<Asset>> {
    const requestParams = { ...params, projectId };
    return this.getAssets(requestParams);
  }

  /**
   * Get assets by multiple projects (for user project filtering)
   */
  async getAssetsByProjects(projectIds: string[], params?: Omit<AssetListRequest, 'projectId'>): Promise<PaginatedResponse<Asset>> {
    if (projectIds.length === 0) {
      return { items: [], totalCount: 0, pageNumber: 1, pageSize: 10, totalPages: 0 };
    }
    
    // For multiple projects, we'll need to make separate calls and combine results
    // This is a limitation of the current API design - ideally the backend would support multiple project IDs
    const allAssets: Asset[] = [];
    let totalCount = 0;
    
    for (const projectId of projectIds) {
      const result = await this.getAssetsByProject(projectId, params);
      allAssets.push(...result.items);
      totalCount += result.totalCount;
    }
    
    return {
      items: allAssets,
      totalCount,
      pageNumber: params?.pageNumber || 1,
      pageSize: params?.pageSize || 10,
      totalPages: Math.ceil(totalCount / (params?.pageSize || 10))
    };
  }

  /**
   * Get assets by item
   */
  async getAssetsByItem(itemId: string, params?: Omit<AssetListRequest, 'itemId'>): Promise<PaginatedResponse<Asset>> {
    const requestParams = { ...params, itemId };
    return this.getAssets(requestParams);
  }

  /**
   * Get assigned assets
   */
  async getAssignedAssets(params?: Omit<AssetListRequest, 'assigned'>): Promise<PaginatedResponse<Asset>> {
    const requestParams = { ...params, assigned: true };
    return this.getAssets(requestParams);
  }

  /**
   * Get unassigned assets
   */
  async getUnassignedAssets(params?: Omit<AssetListRequest, 'assigned'>): Promise<PaginatedResponse<Asset>> {
    const requestParams = { ...params, assigned: false };
    return this.getAssets(requestParams);
  }

  /**
   * Search assets
   */
  async searchAssets(searchTerm: string, params?: Omit<AssetListRequest, 'search'>): Promise<PaginatedResponse<Asset>> {
    const requestParams = { ...params, search: searchTerm };
    return this.getAssets(requestParams);
  }

  /**
   * Get assets by status
   */
  async getAssetsByStatus(status: number, params?: Omit<AssetListRequest, 'status'>): Promise<PaginatedResponse<Asset>> {
    const requestParams = { ...params, status };
    return this.getAssets(requestParams);
  }

  /**
   * Check if asset tag is unique
   */
  async isAssetTagUnique(assetTag: string, excludeId?: string): Promise<boolean> {
    try {
      const params: any = { assetTag };
      if (excludeId) {
        params.excludeId = excludeId;
      }
      
      const response = await apiClient.get<{ isUnique: boolean }>(`${this.baseEndpoint}/check-unique-tag`, params);
      return response.data?.isUnique ?? true;
    } catch (error) {
      // If API call fails, assume it's unique to allow creation
      return true;
    }
  }

  /**
   * Check if serial number is unique
   */
  async isSerialNumberUnique(serialNumber: string, excludeId?: string): Promise<boolean> {
    try {
      const params: any = { serialNumber };
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
   * Get asset statistics
   */
  async getAssetStatistics(): Promise<{
    total: number;
    assigned: number;
    unassigned: number;
    byStatus: Array<{ status: number; count: number }>;
    byProject: Array<{ projectId: string; projectName: string; count: number }>;
    byItem: Array<{ itemId: string; itemName: string; count: number }>;
  }> {
    const response = await apiClient.get(`${this.baseEndpoint}/statistics`);
    return response.data!;
  }

  /**
   * Get asset history
   */
  async getAssetHistory(assetId: string): Promise<Array<{
    id: string;
    action: string;
    employeeId?: string;
    employeeName?: string;
    notes?: string;
    createdAt: string;
    createdBy?: string;
  }>> {
    const response = await apiClient.get(`${this.baseEndpoint}/${assetId}/history`);
    return response.data!;
  }

  /**
   * Export assets to CSV
   */
  async exportAssets(params?: AssetListRequest): Promise<Blob> {
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
   * Import assets from CSV data
   */
  async importAssets(assets: AssetImportData[], projectId?: string): Promise<{
    success: boolean;
    imported: number;
    updated: number;
    errors: Array<{ row: number; message: string }>;
  }> {
    // Convert camelCase to PascalCase for backend compatibility
    const convertedAssets = assets.map(asset => ({
      AssetTag: asset.assetTag,
      AssetName: asset.assetName,
      ItemCategory: asset.itemCategory,
      Item: asset.item,
      SerialNo: asset.serialNo || null, // Send null instead of empty string
      AssignedTo: asset.assignedTo || null,
      Condition: asset.condition
    }));

    const requestBody = {
      Assets: convertedAssets,
      ProjectId: projectId || null
    };
    
    const response = await apiClient.post<{
      success: boolean;
      imported: number;
      updated: number;
      errors: Array<{ row: number; message: string }>;
    }>(`${this.baseEndpoint}/import`, requestBody);
    
    return response.data!;
  }
}

// Create singleton instance
export const assetService = new AssetService();

// Export types
export type { 
  Asset, 
  AssetCreateRequest, 
  AssetUpdateRequest, 
  AssetListRequest,
  AssetAssignmentRequest,
  AssetUnassignmentRequest,
  AssetImportData
};
