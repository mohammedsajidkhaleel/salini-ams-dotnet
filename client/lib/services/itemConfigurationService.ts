import { apiClient, type PaginatedResponse } from "../apiClient"

export interface LookupOption {
  id: string
  name: string
}

export interface ItemConfiguration {
  id: string
  itemTypeId: string
  itemTypeName: string
  specification: string
  processorId: string
  processorName: string
  configurationText: string
  isActive: boolean
  createdAt: string
  createdBy?: string
}

export interface ItemConfigurationCreateRequest {
  itemTypeId: string
  specification: string
  processorId: string
  configurationText: string
  isActive: boolean
}

export interface ItemConfigurationUpdateRequest extends ItemConfigurationCreateRequest {
  id: string
}

export class ItemConfigurationService {
  async getAll(): Promise<ItemConfiguration[]> {
    const response = await apiClient.get<PaginatedResponse<ItemConfiguration>>("/api/ItemConfigurations?pageSize=1000")
    return response.data?.items || []
  }

  async create(payload: ItemConfigurationCreateRequest): Promise<ItemConfiguration> {
    const response = await apiClient.post<ItemConfiguration>("/api/ItemConfigurations", payload)
    return response.data!
  }

  async update(id: string, payload: ItemConfigurationUpdateRequest): Promise<ItemConfiguration> {
    const response = await apiClient.put<ItemConfiguration>(`/api/ItemConfigurations/${id}`, payload)
    return response.data!
  }

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/api/ItemConfigurations/${id}`)
  }

  async getItemTypes(includeInactive = false): Promise<LookupOption[]> {
    const response = await apiClient.get<LookupOption[]>(`/api/Lookups/itemtypes?includeInactive=${includeInactive}`)
    return response.data || []
  }

  async getProcessors(includeInactive = false): Promise<LookupOption[]> {
    const response = await apiClient.get<LookupOption[]>(`/api/Lookups/processors?includeInactive=${includeInactive}`)
    return response.data || []
  }
}

export const itemConfigurationService = new ItemConfigurationService()
