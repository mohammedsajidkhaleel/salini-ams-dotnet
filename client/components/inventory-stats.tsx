"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, TrendingUp, AlertTriangle } from "lucide-react"

interface InventoryItem {
  id: string
  name: string
  category: string
  brand: string
  model: string
  totalPurchased: number
  totalAllocated: number
  availableCount: number
  status: "in-stock" | "low-stock" | "out-of-stock"
  lastPurchaseDate: string
  vendor: string
}

interface InventoryStatsProps {
  totalItems: number
  totalCategories: number
  lowStockItems: number
  outOfStockItems: number
  inStockItems: number
}

export function InventoryStats({ 
  totalItems, 
  totalCategories, 
  lowStockItems, 
  outOfStockItems, 
  inStockItems 
}: InventoryStatsProps) {

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Items</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalItems.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">Available in inventory</p>
        </CardContent>
      </Card>


      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Categories</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalCategories}</div>
          <p className="text-xs text-muted-foreground">Item categories</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
          <AlertTriangle className="h-4 w-4 text-yellow-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-600">{lowStockItems}</div>
          <p className="text-xs text-muted-foreground">Items need reorder</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
          <AlertTriangle className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{outOfStockItems}</div>
          <p className="text-xs text-muted-foreground">Items unavailable</p>
        </CardContent>
      </Card>
    </div>
  )
}
