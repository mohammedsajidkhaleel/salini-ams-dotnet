import { apiClient, type PaginatedResponse } from '../apiClient'

export interface Item {
  id: string
  name: string
  description?: string
  status: "active" | "inactive"
  itemCategoryId: string
  itemCategoryName: string
  createdAt: string
}

export interface BulkCreateResult {
  success: number
  errors: number
  created: Item[]
  errorMessages: string[]
}

export class ItemService {
  /**
   * Get all items with category information
   */
  async getAll(): Promise<Item[]> {
    try {
      const response = await apiClient.get<PaginatedResponse<Item>>('/api/Items?pageSize=1000');
      return response.data?.items || [];
    } catch (error) {
      console.error('Error in ItemService.getAll:', error)
      throw error
    }
  }

  /**
   * Get items with pagination and filtering
   */
  async getItems(params: {
    pageNumber?: number;
    pageSize?: number;
    searchTerm?: string;
    status?: number;
    itemCategoryId?: string;
  }): Promise<PaginatedResponse<Item> | null> {
    try {
      const queryParams = new URLSearchParams({
        pageNumber: (params.pageNumber || 1).toString(),
        pageSize: (params.pageSize || 10).toString(),
      });

      if (params.searchTerm) {
        queryParams.append('searchTerm', params.searchTerm);
      }

      if (params.status !== undefined) {
        queryParams.append('status', params.status.toString());
      }

      if (params.itemCategoryId) {
        queryParams.append('itemCategoryId', params.itemCategoryId);
      }

      const response = await apiClient.get<PaginatedResponse<Item>>(`/api/Items?${queryParams}`);
      return response.data || null;
    } catch (error) {
      console.error('Error in ItemService.getItems:', error);
      return null;
    }
  }

  /**
   * Create a new item
   */
  async create(item: Omit<Item, 'id' | 'createdAt' | 'itemCategoryName'>): Promise<Item> {
    try {
      const response = await apiClient.post<Item>('/api/Items', {
        name: item.name,
        description: item.description,
        status: item.status,
        itemCategoryId: item.itemCategoryId
      });
      return response.data!;
    } catch (error) {
      console.error('Error in ItemService.create:', error)
      throw error
    }
  }

  /**
   * Update an item
   */
  async update(id: string, item: Partial<Omit<Item, 'id' | 'createdAt' | 'itemCategoryName'>>): Promise<void> {
    try {
      await apiClient.put(`/api/Items/${id}`, {
        id: id,
        name: item.name,
        description: item.description,
        status: item.status,
        itemCategoryId: item.itemCategoryId
      });
    } catch (error) {
      console.error('Error in ItemService.update:', error)
      throw error
    }
  }

  /**
   * Delete an item
   */
  async delete(id: string): Promise<void> {
    try {
      await apiClient.delete(`/api/Items/${id}`);
    } catch (error) {
      console.error('Error in ItemService.delete:', error)
      throw error
    }
  }

  /**
   * Bulk create items from import
   */
  async bulkCreate(items: string[]): Promise<BulkCreateResult> {
    const result: BulkCreateResult = {
      success: 0,
      errors: 0,
      created: [],
      errorMessages: []
    }

    try {
      // TODO: Implement bulk create when backend supports it
      console.log('ItemService.bulkCreate called (not yet implemented)')
      return result
    } catch (error) {
      console.error('Error in ItemService.bulkCreate:', error)
      throw error
    }
  }

  /**
   * Get all item categories
   */
  async getItemCategories(params: { pageNumber: number; pageSize: number; searchTerm?: string }): Promise<PaginatedResponse<Item> | null> {
    try {
      const queryParams = new URLSearchParams({
        pageNumber: params.pageNumber.toString(),
        pageSize: params.pageSize.toString(),
      });

      if (params.searchTerm) {
        queryParams.append('searchTerm', params.searchTerm);
      }

      const response = await apiClient.get<PaginatedResponse<Item>>(`/api/ItemCategories?${queryParams}`);
      return response.data || null;
    } catch (error) {
      console.error('Error fetching item categories:', error);
      return null;
    }
  }

  /**
   * Create a new item category
   */
  async createItemCategory(data: { name: string; description?: string }): Promise<Item | null> {
    try {
      const response = await apiClient.post<Item>('/api/ItemCategories', data);
      return response.data || null;
    } catch (error) {
      console.error('Error creating item category:', error);
      return null;
    }
  }

  /**
   * Update an item category
   */
  async updateItemCategory(id: string, data: { name?: string; description?: string }): Promise<Item | null> {
    try {
      const response = await apiClient.put<Item>(`/api/ItemCategories/${id}`, data);
      return response.data || null;
    } catch (error) {
      console.error('Error updating item category:', error);
      return null;
    }
  }

  /**
   * Delete an item category
   */
  async deleteItemCategory(id: string): Promise<boolean> {
    try {
      await apiClient.delete(`/api/ItemCategories/${id}`);
      return true;
    } catch (error) {
      console.error('Error deleting item category:', error);
      return false;
    }
  }
}

// Create singleton instance
export const itemService = new ItemService();