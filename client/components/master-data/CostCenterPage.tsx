"use client"

import { useState, useEffect, useRef } from "react"
import { CostCenterTable } from "@/components/cost-center-table"
import { CostCenterService, CostCenter } from "@/lib/services/costCenterService"

interface CostCenterPageProps {
  // No props needed as this is a standalone page
}

export function CostCenterPage({}: CostCenterPageProps) {
  const [data, setData] = useState<CostCenter[]>([])
  const [loading, setLoading] = useState(false)
  const isLoadingRef = useRef(false)
  const hasLoadedRef = useRef(false)

  const loadData = async () => {
    // Prevent multiple simultaneous calls
    if (isLoadingRef.current) {
      console.log('Cost Centers API call already in progress, skipping...')
      return
    }

    try {
      console.log('Loading cost centers data...')
      isLoadingRef.current = true
      setLoading(true)
      const items = await CostCenterService.getAll()
      setData(items)
      hasLoadedRef.current = true
    } catch (error) {
      console.error('Error loading cost centers:', error)
    } finally {
      setLoading(false)
      isLoadingRef.current = false
    }
  }

  useEffect(() => {
    // Only load if not already loaded
    if (!hasLoadedRef.current) {
      loadData()
    }
  }, [])

  const handleAdd = async (item: Omit<CostCenter, 'id' | 'createdAt'>): Promise<void> => {
    try {
      const newCostCenter = await CostCenterService.create(item)
      setData(prev => [newCostCenter, ...prev])
    } catch (error) {
      console.error('Error adding cost center:', error)
      throw error
    }
  }

  const handleEdit = async (id: string, item: Partial<Omit<CostCenter, 'id' | 'createdAt'>>): Promise<void> => {
    try {
      await CostCenterService.update(id, item)
      setData(prev => prev.map(existing =>
        existing.id === id ? { ...existing, ...item } : existing
      ))
    } catch (error) {
      console.error('Error updating cost center:', error)
      throw error
    }
  }

  const handleDelete = async (id: string): Promise<void> => {
    try {
      await CostCenterService.delete(id)
      setData(prev => prev.filter(item => item.id !== id))
    } catch (error) {
      console.error('Error deleting cost center:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading Cost Centers...</div>
      </div>
    )
  }

  return (
    <CostCenterTable
      data={data}
      onAdd={handleAdd}
      onEdit={handleEdit}
      onDelete={handleDelete}
    />
  )
}
