import { apiClient } from '../apiClient'

export interface SimCardPlan {
  id: string
  name: string
  description?: string
  data_limit?: number
  monthly_fee?: number
  provider_id?: string
  provider_name?: string
  is_active: boolean
  status: "active" | "inactive"
  createdAt: string
}

export interface SimProvider {
  id: string
  name: string
}

export class SimCardPlanService {
  /**
   * Get all SIM card plans with provider information
   */
  static async getAll(): Promise<SimCardPlan[]> {
    try {
      const response = await apiClient.get('/api/SimCardPlans?pageSize=1000')
      const items = response.data?.items || []
      
      // Map backend DTOs to frontend interface
      return items.map((item: any) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        data_limit: item.dataLimit,
        monthly_fee: item.monthlyFee,
        provider_id: item.providerId,
        provider_name: item.providerName,
        is_active: item.isActive,
        status: (item.isActive ? "active" : "inactive") as "active" | "inactive",
        createdAt: item.createdAt
      }))
    } catch (error) {
      console.error("Error in SimCardPlanService.getAll:", error)
      throw error
    }
  }

  /**
   * Get all SIM providers
   */
  static async getProviders(): Promise<SimProvider[]> {
    try {
      const response = await apiClient.get('/api/SimProviders?pageSize=1000')
      return response.data?.items || []
    } catch (error) {
      console.error("Error in SimCardPlanService.getProviders:", error)
      throw error
    }
  }

  /**
   * Create a new SIM card plan
   */
  static async create(plan: Omit<SimCardPlan, 'id' | 'createdAt' | 'provider_name'>): Promise<SimCardPlan> {
    try {
      const response = await apiClient.post('/api/SimCardPlans', {
        name: plan.name,
        description: plan.description,
        dataLimit: plan.data_limit,
        monthlyFee: plan.monthly_fee,
        providerId: plan.provider_id,
        isActive: plan.is_active
      })
      
      // Map response to frontend interface
      const data = response.data
      return {
        id: data.id,
        name: data.name,
        description: data.description,
        data_limit: data.dataLimit,
        monthly_fee: data.monthlyFee,
        provider_id: data.providerId,
        provider_name: data.providerName,
        is_active: data.isActive,
        status: (data.isActive ? "active" : "inactive") as "active" | "inactive",
        createdAt: data.createdAt
      }
    } catch (error) {
      console.error("Error in SimCardPlanService.create:", error)
      throw error
    }
  }

  /**
   * Update a SIM card plan
   */
  static async update(id: string, plan: Partial<Omit<SimCardPlan, 'id' | 'createdAt' | 'provider_name'>>): Promise<void> {
    try {
      await apiClient.put(`/api/SimCardPlans/${id}`, {
        id: id,
        name: plan.name,
        description: plan.description,
        dataLimit: plan.data_limit,
        monthlyFee: plan.monthly_fee,
        providerId: plan.provider_id,
        isActive: plan.is_active
      })
    } catch (error) {
      console.error("Error in SimCardPlanService.update:", error)
      throw error
    }
  }

  /**
   * Delete a SIM card plan
   */
  static async delete(id: string): Promise<void> {
    try {
      await apiClient.delete(`/api/SimCardPlans/${id}`)
    } catch (error) {
      console.error("Error in SimCardPlanService.delete:", error)
      throw error
    }
  }
}

// Create singleton instance
export const simCardPlanService = new SimCardPlanService();