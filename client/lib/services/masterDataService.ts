/**
 * Master Data Service
 * Handles API calls for master data operations
 */

import { apiClient, type PaginatedResponse } from '../apiClient';

export interface MasterDataStatistics {
  totalCompanies: number;
  totalDepartments: number;
  totalProjects: number;
  totalEmployees: number;
  totalAssets: number;
  totalSimCards: number;
  totalSoftwareLicenses: number;
}

export interface SimProvider {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
}

export interface SimType {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
}

export interface SimCardPlan {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
}

export interface MasterDataItem {
  id: string;
  name: string;
  description?: string;
  status: "active" | "inactive";
  createdAt: string;
}

export class MasterDataService {
  // Simple in-memory cache to prevent multiple API calls
  private static cache = new Map<string, { data: any[], timestamp: number }>()
  private static CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  /**
   * Get all items of a specific master data type
   */
  static async getAll(type: string): Promise<any[]> {
    // Check cache first
    const cached = this.cache.get(type)
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      console.log(`Using cached data for ${type}`)
      return cached.data
    }

    let result: any[] = []
    try {
      switch (type) {
        case 'item_categories':
        case 'item-categories':
          const response = await apiClient.get<PaginatedResponse<any>>('/api/ItemCategories?pageSize=1000');
          result = response.data?.items || [];
          break;
        case 'nationalities':
          const nationalityResponse = await apiClient.get<PaginatedResponse<any>>('/api/Nationalities?pageSize=1000');
          result = nationalityResponse.data?.items || [];
          break;
        case 'departments':
          const departmentResponse = await apiClient.get<PaginatedResponse<any>>('/api/Departments?pageSize=1000');
          result = departmentResponse.data?.items || [];
          break;
        case 'sub_departments':
        case 'sub-departments':
          const subDepartmentResponse = await apiClient.get<PaginatedResponse<any>>('/api/SubDepartments?pageSize=1000');
          result = subDepartmentResponse.data?.items || [];
          break;
        case 'items':
          const itemResponse = await apiClient.get<PaginatedResponse<any>>('/api/Items?pageSize=1000');
          result = itemResponse.data?.items || [];
          break;
        case 'cost_centers':
          const costCenterResponse = await apiClient.get<PaginatedResponse<any>>('/api/CostCenters?pageSize=1000');
          result = costCenterResponse.data?.items || [];
          break;
        case 'employee_categories':
        case 'employee-categories':
          const employeeCategoryResponse = await apiClient.get<PaginatedResponse<any>>('/api/EmployeeCategories?pageSize=1000');
          result = employeeCategoryResponse.data?.items || [];
          break;
        case 'employee_positions':
        case 'employee-positions':
          const employeePositionResponse = await apiClient.get<PaginatedResponse<any>>('/api/EmployeePositions?pageSize=1000');
          result = employeePositionResponse.data?.items || [];
          break;
        case 'suppliers':
        case 'vendors':
          const supplierResponse = await apiClient.get<PaginatedResponse<any>>('/api/Suppliers?pageSize=1000');
          result = supplierResponse.data?.items || [];
          break;
        case 'sim_providers':
        case 'sim-providers':
          const simProviderResponse = await apiClient.get<PaginatedResponse<any>>('/api/SimProviders?pageSize=1000');
          const simProviderData = simProviderResponse.data?.items || [];
          result = simProviderData.map((item: any) => {
            const isActive = item.isActive ?? item.IsActive ?? true;
            return {
              id: item.id || item.Id,
              name: item.name || item.Name,
              description: item.description || item.Description,
              contactInfo: item.contactInfo || item.ContactInfo,
              status: isActive ? "active" : "inactive",
              isActive: isActive,
              createdAt: item.createdAt || item.CreatedAt
            };
          });
          break;
        case 'sim_types':
        case 'sim-types':
          const simTypeResponse = await apiClient.get<PaginatedResponse<any>>('/api/SimTypes?pageSize=1000');
          const simTypeData = simTypeResponse.data?.items || [];
          result = simTypeData.map((item: any) => {
            const isActive = item.isActive ?? item.IsActive ?? true;
            return {
              id: item.id || item.Id,
              name: item.name || item.Name,
              description: item.description || item.Description,
              status: isActive ? "active" : "inactive",
              isActive: isActive,
              createdAt: item.createdAt || item.CreatedAt
            };
          });
          break;
        case 'sim_card_plans':
        case 'sim-card-plans':
          const simCardPlanResponse = await apiClient.get<PaginatedResponse<any>>('/api/SimCardPlans?pageSize=1000');
          const simCardPlanData = simCardPlanResponse.data?.items || [];
          result = simCardPlanData.map((item: any) => {
            const isActive = item.isActive ?? item.IsActive ?? true;
            return {
              id: item.id || item.Id,
              name: item.name || item.Name,
              description: item.description || item.Description,
              dataLimit: item.dataLimit || item.DataLimit,
              monthlyFee: item.monthlyFee || item.MonthlyFee,
              providerId: item.providerId || item.ProviderId,
              providerName: item.providerName || item.ProviderName,
              status: isActive ? "active" : "inactive",
              isActive: isActive,
              createdAt: item.createdAt || item.CreatedAt
            };
          });
          break;
        case 'accessories':
          const accessoriesResponse = await apiClient.get<PaginatedResponse<any>>('/api/Accessories?pageSize=1000');
          result = accessoriesResponse.data?.items || [];
          break;
        default:
          console.log(`MasterDataService.getAll called for type: ${type} (not implemented)`);
          result = [];
      }
    } catch (error) {
      console.error(`Error fetching master data for type ${type}:`, error);
      result = [];
    }

    // Cache the result
    this.cache.set(type, { data: result, timestamp: Date.now() })
    console.log(`Cached data for ${type}`)

    return result
  }

  /**
   * Get master data statistics
   */
  static async getStatistics(): Promise<MasterDataStatistics> {
    try {
      const response = await apiClient.get<MasterDataStatistics>('/api/MasterData/statistics');
      return response.data!;
    } catch (error) {
      console.error('Error fetching master data statistics:', error);
      // Return default values if API fails
      return {
        totalCompanies: 0,
        totalDepartments: 0,
        totalProjects: 0,
        totalEmployees: 0,
        totalAssets: 0,
        totalSimCards: 0,
        totalSoftwareLicenses: 0
      };
    }
  }

  /**
   * Get SIM providers
   */
  static async getSimProviders(): Promise<SimProvider[]> {
    return await this.getAll('sim_providers') as SimProvider[];
  }

  /**
   * Get SIM types
   */
  static async getSimTypes(): Promise<SimType[]> {
    return await this.getAll('sim_types') as SimType[];
  }

  /**
   * Get SIM card plans
   */
  static async getSimCardPlans(): Promise<SimCardPlan[]> {
    return await this.getAll('sim_card_plans') as SimCardPlan[];
  }

  /**
   * Create a new master data item
   */
  static async create(type: string, item: Omit<MasterDataItem, 'id' | 'createdAt'>): Promise<MasterDataItem> {
    try {
      const endpoint = this.getEndpointForType(type);
      const response = await apiClient.post(endpoint, item);
      // Clear cache after creating new item
      this.clearCache(type);
      return response.data;
    } catch (error) {
      console.error(`Error creating ${type}:`, error);
      throw error;
    }
  }

  /**
   * Update an existing master data item
   */
  static async update(type: string, id: string, item: Partial<Omit<MasterDataItem, 'id' | 'createdAt'>>): Promise<void> {
    try {
      const endpoint = this.getEndpointForType(type);
      // Include the ID in the request body as required by the backend
      const updateData = { ...item, id };
      console.log(`Updating ${type} with endpoint: ${endpoint}/${id}`, updateData);
      await apiClient.put(`${endpoint}/${id}`, updateData);
      // Clear cache after updating item
      this.clearCache(type);
    } catch (error) {
      console.error(`Error updating ${type}:`, error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      throw error;
    }
  }

  /**
   * Delete a master data item
   */
  static async delete(type: string, id: string): Promise<void> {
    try {
      const endpoint = this.getEndpointForType(type);
      await apiClient.delete(`${endpoint}/${id}`);
      // Clear cache after deleting item
      this.clearCache(type);
    } catch (error) {
      console.error(`Error deleting ${type}:`, error);
      throw error;
    }
  }

  /**
   * Clear cache for a specific type or all types
   */
  private static clearCache(type?: string): void {
    if (type) {
      this.cache.delete(type);
      console.log(`Cleared cache for ${type}`);
    } else {
      this.cache.clear();
      console.log('Cleared all cache');
    }
  }

  /**
   * Get the API endpoint for a given master data type
   */
  private static getEndpointForType(type: string): string {
    switch (type) {
      case 'item_categories':
      case 'item-categories':
        return '/api/ItemCategories';
      case 'nationalities':
        return '/api/Nationalities';
      case 'departments':
        return '/api/Departments';
      case 'sub_departments':
      case 'sub-departments':
        return '/api/SubDepartments';
      case 'items':
        return '/api/Items';
      case 'cost_centers':
      case 'cost-centers':
        return '/api/CostCenters';
      case 'employee_categories':
      case 'employee-categories':
        return '/api/EmployeeCategories';
      case 'employee_positions':
      case 'employee-positions':
        return '/api/EmployeePositions';
      case 'suppliers':
      case 'vendors':
        return '/api/Suppliers';
      case 'sim_providers':
      case 'sim-providers':
        return '/api/SimProviders';
      case 'sim_types':
      case 'sim-types':
        return '/api/SimTypes';
      case 'sim_card_plans':
      case 'sim-card-plans':
        return '/api/SimCardPlans';
      case 'accessories':
        return '/api/Accessories';
      default:
        throw new Error(`Unknown master data type: ${type}`);
    }
  }
}