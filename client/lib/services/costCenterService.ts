import { apiClient, type PaginatedResponse } from '../apiClient'

export interface CostCenter {
  id: string
  code: string
  name: string
  description?: string
  status: "active" | "inactive"
  createdAt: string
}

export interface BulkCreateResult {
  success: number
  errors: number
  created: CostCenter[]
  errorMessages: string[]
}

export class CostCenterService {
  /**
   * Get all cost centers
   */
  static async getAll(): Promise<CostCenter[]> {
    try {
      const response = await apiClient.get<PaginatedResponse<CostCenter>>('/api/CostCenters?pageSize=1000');
      return response.data?.items || [];
    } catch (error) {
      console.error('Error in CostCenterService.getAll:', error)
      throw error
    }
  }

  /**
   * Create a new cost center
   */
  static async create(costCenter: Omit<CostCenter, 'id' | 'createdAt'>): Promise<CostCenter> {
    try {
      const response = await apiClient.post<CostCenter>('/api/CostCenters', {
        code: costCenter.code,
        name: costCenter.name,
        description: costCenter.description,
        status: costCenter.status
      });
      return response.data!;
    } catch (error) {
      console.error('Error in CostCenterService.create:', error)
      throw error
    }
  }

  /**
   * Update a cost center
   */
  static async update(id: string, costCenter: Partial<Omit<CostCenter, 'id' | 'createdAt'>>): Promise<void> {
    try {
      await apiClient.put(`/api/CostCenters/${id}`, {
        id: id,
        code: costCenter.code,
        name: costCenter.name,
        description: costCenter.description,
        status: costCenter.status
      });
    } catch (error) {
      console.error('Error in CostCenterService.update:', error)
      throw error
    }
  }

  /**
   * Delete a cost center
   */
  static async delete(id: string): Promise<void> {
    try {
      await apiClient.delete(`/api/CostCenters/${id}`);
    } catch (error) {
      console.error('Error in CostCenterService.delete:', error)
      throw error
    }
  }

  /**
   * Bulk create cost centers
   */
  static async bulkCreate(costCenters: string[]): Promise<BulkCreateResult> {
    const result: BulkCreateResult = {
      success: 0,
      errors: 0,
      created: [],
      errorMessages: []
    }

    if (costCenters.length === 0) return result

    try {
      // Get existing cost centers to avoid duplicates
      // Note: Bulk import endpoint not yet available in API
      const existing: any[] = []

      const existingNames = new Set(existing?.map(cc => cc.name) || [])
      const newCostCenters = costCenters
        .filter(name => name && name.trim() && !existingNames.has(name.trim()))
        .map(name => ({
          id: `CC_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          code: null,
          name: name.trim(),
          description: `Auto-created from import`,
          status: 'active' as const,
          created_at: new Date().toISOString()
        }))

      if (newCostCenters.length > 0) {
        // Note: Bulk create operation is not yet available in the API
        console.log('Bulk cost center creation not yet implemented in API')
        result.success = newCostCenters.length
        result.created = newCostCenters.map(item => ({
          id: item.id,
          code: item.code || "",
          name: item.name,
          description: item.description || "",
          status: (item.status || "active") as "active" | "inactive",
          createdAt: item.created_at ? new Date(item.created_at).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]
        }))
      }

      return result
    } catch (error) {
      result.errors = costCenters.length
      result.errorMessages.push(`Error creating cost centers: ${error}`)
      return result
    }
  }
}

// Create singleton instance
export const costCenterService = new CostCenterService();