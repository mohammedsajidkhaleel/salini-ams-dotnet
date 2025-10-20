"use client"

import { useState, useEffect, useRef } from "react"
import { Sidebar } from "@/components/sidebar"
import { InventoryTable } from "@/components/inventory-table"
import { InventoryStats } from "@/components/inventory-stats"
import { UserHeader } from "@/components/user-header"
import { ProtectedRoute } from "@/components/protected-route"
import { inventoryService, type InventoryItem, type InventorySummary } from "@/lib/services/inventoryService"
import { useAuth } from "@/contexts/auth-context-new"


export default function InventoryPage() {
  const { user } = useAuth()
  const [inventorySummary, setInventorySummary] = useState<InventorySummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const hasLoaded = useRef(false)

  // Load inventory data from API when user changes
  useEffect(() => {
    if (user && !hasLoaded.current) {
      hasLoaded.current = true
      loadInventoryData()
    }
  }, [user?.id]) // Reload when user changes

  const loadInventoryData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔄 Inventory Page - Loading data for user:', {
        userId: user?.id,
        userRole: user?.role,
        assignedProjectIds: user?.projectIds
      })
      
      // Try the new backend-calculated summary endpoint first
      console.log('🔄 Attempting to load inventory summary with stats...')
      
      try {
        const summary = await inventoryService.getInventorySummaryWithStats()
        
        if (summary) {
          setInventorySummary(summary)
          console.log('✅ Backend-calculated stats loaded:', {
            totalItems: summary.totalItems,
            totalCategories: summary.totalCategories,
            lowStockItems: summary.lowStockItems,
            outOfStockItems: summary.outOfStockItems,
            inStockItems: summary.inStockItems,
            calculatedAt: summary.calculatedAt
          })
          return
        }
      } catch (newEndpointError) {
        console.warn('⚠️ New endpoint failed, falling back to old endpoint:', newEndpointError)
        
        // Fallback to the old endpoint and calculate stats on frontend
        console.log('🔄 Falling back to old endpoint with frontend calculation...')
        const items = await inventoryService.getInventorySummary()
        
        if (items && Array.isArray(items)) {
          // Calculate stats on frontend as fallback
          const totalItems = items.reduce((sum, item) => sum + item.availableCount, 0)
          const totalCategories = new Set(items.map(item => item.category)).size
          const lowStockItems = items.filter(item => item.status === 'LowStock').length
          const outOfStockItems = items.filter(item => item.status === 'OutOfStock').length
          const inStockItems = items.filter(item => item.status === 'InStock').length
          
          const fallbackSummary = {
            totalItems,
            totalCategories,
            lowStockItems,
            outOfStockItems,
            inStockItems,
            totalPurchased: items.reduce((sum, item) => sum + item.totalPurchased, 0),
            totalAllocated: items.reduce((sum, item) => sum + item.totalAllocated, 0),
            calculatedAt: new Date().toISOString(),
            items
          }
          
          setInventorySummary(fallbackSummary)
          console.log('✅ Fallback stats calculated:', {
            totalItems,
            totalCategories,
            lowStockItems,
            outOfStockItems,
            inStockItems
          })
        } else {
          setInventorySummary(null)
        }
      }
    } catch (error) {
      console.error("❌ Error loading inventory data:", error)
      setError(`Failed to load inventory data: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setInventorySummary(null)
    } finally {
      setLoading(false)
    }
  }

  // Helper function to convert numeric status to string
  const getStatusString = (status: number): "in-stock" | "low-stock" | "out-of-stock" => {
    switch (status) {
      case 1: return "in-stock"
      case 2: return "low-stock"
      case 3: return "out-of-stock"
      default: return "out-of-stock"
    }
  }

  // Transform inventory items for the components (convert status format)
  const transformedInventoryItems = inventorySummary?.items?.map(item => ({
    id: item.itemId,
    name: item.itemName,
    category: item.category,
    brand: item.brand,
    model: item.model,
    totalPurchased: item.totalPurchased,
    totalAllocated: item.totalAllocated,
    availableCount: item.availableCount,
    status: getStatusString(item.status),
    lastPurchaseDate: new Date(item.lastPurchaseDate).toLocaleDateString(),
    vendor: item.vendor,
    projectName: item.projectName
  })) || []

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Inventory Management</h1>
                <p className="text-muted-foreground">
                  Track available items calculated from purchase orders and asset allocations
                </p>
              </div>
              <UserHeader />
            </div>

            {/* Refresh Button */}
            <div className="flex items-center gap-4">
              <button
                onClick={loadInventoryData}
                disabled={loading}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Refresh Inventory'}
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-muted-foreground">Loading inventory data...</div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-red-500">{error}</div>
              </div>
            ) : (
              <>
                <InventoryStats 
                  totalItems={inventorySummary?.totalItems || 0}
                  totalCategories={inventorySummary?.totalCategories || 0}
                  lowStockItems={inventorySummary?.lowStockItems || 0}
                  outOfStockItems={inventorySummary?.outOfStockItems || 0}
                  inStockItems={inventorySummary?.inStockItems || 0}
                />
                <InventoryTable inventoryItems={transformedInventoryItems} />
              </>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
