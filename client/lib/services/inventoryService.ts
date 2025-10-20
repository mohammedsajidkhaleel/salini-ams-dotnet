import { apiClient } from '../apiClient';

export interface InventoryItem {
  itemId: string;
  itemName: string;
  category: string;
  brand: string;
  model: string;
  totalPurchased: number;
  totalAllocated: number;
  availableCount: number;
  status: 'InStock' | 'LowStock' | 'OutOfStock';
  lastPurchaseDate: string;
  vendor: string;
  projectName?: string;
}

export interface InventoryStats {
  totalItems: number;
  totalCategories: number;
  lowStockItems: number;
  outOfStockItems: number;
  inStockItems: number;
}

export interface InventorySummary {
  totalItems: number;
  totalCategories: number;
  lowStockItems: number;
  outOfStockItems: number;
  inStockItems: number;
  totalPurchased: number;
  totalAllocated: number;
  calculatedAt: string;
  items: InventoryItem[];
}

class InventoryService {
  /**
   * Get inventory summary with calculated available quantities
   * Project filtering is now handled automatically at the API level based on user's assigned projects
   */
  async getInventorySummary(): Promise<InventoryItem[]> {
    try {
      const response = await apiClient.get<InventoryItem[]>('/api/Inventory/Summary');
      return response.data || [];
    } catch (error) {
      console.error('Error fetching inventory summary:', error);
      throw error;
    }
  }

  /**
   * Get inventory summary with pre-calculated statistics from backend
   * This is more efficient for displaying dashboard cards
   */
  async getInventorySummaryWithStats(): Promise<InventorySummary> {
    try {
      console.log('🔍 Calling /api/Inventory/SummaryWithStats endpoint...');
      const response = await apiClient.get<InventorySummary>('/api/Inventory/SummaryWithStats');
      console.log('📊 API Response received:', response);
      console.log('📊 Response data:', response.data);
      
      if (!response.data) {
        throw new Error('No data received from API');
      }
      
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching inventory summary with stats:', error);
      console.error('❌ Error type:', typeof error);
      console.error('❌ Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        status: (error as any)?.response?.status,
        statusText: (error as any)?.response?.statusText,
        data: (error as any)?.response?.data,
        url: (error as any)?.config?.url
      });
      throw error;
    }
  }

  /**
   * Calculate inventory statistics from inventory items
   */
  calculateStats(inventoryItems: InventoryItem[]): InventoryStats {
    const totalItems = inventoryItems.reduce((sum, item) => sum + item.availableCount, 0);
    const totalCategories = new Set(inventoryItems.map(item => item.category)).size;
    const lowStockItems = inventoryItems.filter(item => item.status === 'LowStock').length;
    const outOfStockItems = inventoryItems.filter(item => item.status === 'OutOfStock').length;
    const inStockItems = inventoryItems.filter(item => item.status === 'InStock').length;

    return {
      totalItems,
      totalCategories,
      lowStockItems,
      outOfStockItems,
      inStockItems
    };
  }

  /**
   * Filter inventory items by search term and filters
   */
  filterInventoryItems(
    items: InventoryItem[],
    searchTerm: string,
    categoryFilter: string,
    statusFilter: string,
    projectFilter: string
  ): InventoryItem[] {
    return items.filter(item => {
      const matchesSearch = 
        item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory = !categoryFilter || item.category === categoryFilter;
      const matchesStatus = !statusFilter || item.status === statusFilter;
      const matchesProject = !projectFilter || item.projectName === projectFilter;

      return matchesSearch && matchesCategory && matchesStatus && matchesProject;
    });
  }
}

export const inventoryService = new InventoryService();
