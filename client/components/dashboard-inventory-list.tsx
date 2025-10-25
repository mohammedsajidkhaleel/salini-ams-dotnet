"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Package } from "lucide-react"
import { InventoryItem } from "@/lib/services/inventoryService"
import { Project } from "@/lib/services/projectService"

interface DashboardInventoryListProps {
  inventoryItems: InventoryItem[]
  projects: Project[]
}

export function DashboardInventoryList({ inventoryItems, projects }: DashboardInventoryListProps) {
  const [selectedProject, setSelectedProject] = useState<string>("all")

  // Filter inventory by selected project
  const filteredInventory = useMemo(() => {
    if (selectedProject === "all") {
      return inventoryItems
    }
    return inventoryItems.filter(item => item.projectName === selectedProject)
  }, [inventoryItems, selectedProject])

  // Get unique project names from inventory items
  const projectNames = useMemo(() => {
    const names = new Set(inventoryItems.map(item => item.projectName).filter(Boolean))
    return Array.from(names)
  }, [inventoryItems])

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Inventory Overview
          </CardTitle>
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projectNames.map((projectName) => (
                <SelectItem key={projectName} value={projectName}>
                  {projectName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Total Count</TableHead>
                <TableHead className="text-right">Available</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInventory.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    No inventory items found
                  </TableCell>
                </TableRow>
              ) : (
                filteredInventory.map((item) => (
                  <TableRow key={item.itemId}>
                    <TableCell className="font-medium">
                      {item.itemName}
                      {item.brand && item.model && (
                        <div className="text-sm text-muted-foreground">
                          {item.brand} - {item.model}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell className="text-right">{item.totalPurchased}</TableCell>
                    <TableCell className="text-right">{item.availableCount}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        {filteredInventory.length > 0 && (
          <div className="mt-4 text-sm text-muted-foreground">
            Showing {filteredInventory.length} item{filteredInventory.length !== 1 ? "s" : ""}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

