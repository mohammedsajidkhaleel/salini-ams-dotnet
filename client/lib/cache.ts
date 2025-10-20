/**
 * Simple in-memory cache for API responses
 * Provides TTL (Time To Live) functionality
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class ApiCache {
  private cache = new Map<string, CacheEntry<any>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Get cached data if it exists and hasn't expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Set cached data with TTL
   */
  set<T>(key: string, data: T, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    });
  }

  /**
   * Remove specific cache entry
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Clear expired entries
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Create singleton instance
export const apiCache = new ApiCache();

// Auto-cleanup every 10 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    apiCache.cleanup();
  }, 10 * 60 * 1000);
}

/**
 * Cache key generators for common API endpoints
 */
export const cacheKeys = {
  // User management
  users: (page?: number, pageSize?: number) => 
    `users_${page || 1}_${pageSize || 10}`,
  user: (id: string) => `user_${id}`,
  userPermissions: (id: string) => `user_permissions_${id}`,
  userProjects: (id: string) => `user_projects_${id}`,

  // Assets
  assets: (page?: number, pageSize?: number, projectId?: string) => 
    `assets_${page || 1}_${pageSize || 10}_${projectId || 'all'}`,
  asset: (id: string) => `asset_${id}`,
  assetStats: () => 'asset_stats',

  // Employees
  employees: (page?: number, pageSize?: number, projectId?: string) => 
    `employees_${page || 1}_${pageSize || 10}_${projectId || 'all'}`,
  employee: (id: string) => `employee_${id}`,

  // Inventory
  inventory: () => 'inventory_summary',

  // Purchase Orders
  purchaseOrders: (page?: number, pageSize?: number, projectId?: string) => 
    `purchase_orders_${page || 1}_${pageSize || 10}_${projectId || 'all'}`,
  purchaseOrder: (id: string) => `purchase_order_${id}`,

  // SIM Cards
  simCards: (page?: number, pageSize?: number, projectId?: string) => 
    `sim_cards_${page || 1}_${pageSize || 10}_${projectId || 'all'}`,
  simCard: (id: string) => `sim_card_${id}`,

  // Software Licenses
  softwareLicenses: (page?: number, pageSize?: number, projectId?: string) => 
    `software_licenses_${page || 1}_${pageSize || 10}_${projectId || 'all'}`,
  softwareLicense: (id: string) => `software_license_${id}`,

  // Master data (longer TTL)
  projects: () => 'projects_all',
  departments: () => 'departments_all',
  subDepartments: () => 'sub_departments_all',
  companies: () => 'companies_all',
  costCenters: () => 'cost_centers_all',
  nationalities: () => 'nationalities_all',
  employeeCategories: () => 'employee_categories_all',
  employeePositions: () => 'employee_positions_all',
  itemCategories: () => 'item_categories_all',
  simProviders: () => 'sim_providers_all',
  simTypes: () => 'sim_types_all',
  simCardPlans: () => 'sim_card_plans_all',
  accessories: () => 'accessories_all',
};

/**
 * Higher-order function to add caching to API calls
 */
export function withCache<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  keyGenerator: (...args: T) => string,
  ttl?: number
) {
  return async (...args: T): Promise<R> => {
    const key = keyGenerator(...args);
    
    // Try to get from cache first
    const cached = apiCache.get<R>(key);
    if (cached !== null) {
      return cached;
    }

    // If not in cache, make the API call
    const result = await fn(...args);
    
    // Cache the result
    apiCache.set(key, result, ttl);
    
    return result;
  };
}

/**
 * Cache invalidation helpers
 */
export const cacheInvalidation = {
  // Invalidate all user-related cache
  invalidateUsers: () => {
    const stats = apiCache.getStats();
    stats.keys.forEach(key => {
      if (key.startsWith('users_') || key.startsWith('user_')) {
        apiCache.delete(key);
      }
    });
  },

  // Invalidate all asset-related cache
  invalidateAssets: () => {
    const stats = apiCache.getStats();
    stats.keys.forEach(key => {
      if (key.startsWith('assets_') || key.startsWith('asset_')) {
        apiCache.delete(key);
      }
    });
  },

  // Invalidate all employee-related cache
  invalidateEmployees: () => {
    const stats = apiCache.getStats();
    stats.keys.forEach(key => {
      if (key.startsWith('employees_') || key.startsWith('employee_')) {
        apiCache.delete(key);
      }
    });
  },

  // Invalidate all purchase order-related cache
  invalidatePurchaseOrders: () => {
    const stats = apiCache.getStats();
    stats.keys.forEach(key => {
      if (key.startsWith('purchase_orders_') || key.startsWith('purchase_order_')) {
        apiCache.delete(key);
      }
    });
  },

  // Invalidate all SIM card-related cache
  invalidateSimCards: () => {
    const stats = apiCache.getStats();
    stats.keys.forEach(key => {
      if (key.startsWith('sim_cards_') || key.startsWith('sim_card_')) {
        apiCache.delete(key);
      }
    });
  },

  // Invalidate all software license-related cache
  invalidateSoftwareLicenses: () => {
    const stats = apiCache.getStats();
    stats.keys.forEach(key => {
      if (key.startsWith('software_licenses_') || key.startsWith('software_license_')) {
        apiCache.delete(key);
      }
    });
  },

  // Invalidate inventory cache
  invalidateInventory: () => {
    apiCache.delete('inventory_summary');
  },

  // Invalidate all master data cache
  invalidateMasterData: () => {
    const masterDataKeys = [
      'projects_all',
      'departments_all',
      'sub_departments_all',
      'companies_all',
      'cost_centers_all',
      'nationalities_all',
      'employee_categories_all',
      'employee_positions_all',
      'item_categories_all',
      'sim_providers_all',
      'sim_types_all',
      'sim_card_plans_all',
      'accessories_all',
    ];
    
    masterDataKeys.forEach(key => apiCache.delete(key));
  },

  // Invalidate all cache
  invalidateAll: () => {
    apiCache.clear();
  }
};