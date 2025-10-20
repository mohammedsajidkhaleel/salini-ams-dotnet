"use client"

import { useState, useEffect, useRef } from "react"
import { MasterDataTable } from "@/components/master-data-table"
import { MasterDataService, MasterDataItem } from "@/lib/services/masterDataService"

interface GenericMasterDataPageProps {
  category: string
  title: string
}

export function GenericMasterDataPage({ category, title }: GenericMasterDataPageProps) {
  const [data, setData] = useState<MasterDataItem[]>([])
  const [loading, setLoading] = useState(false)
  const isLoadingRef = useRef(false)
  const hasLoadedRef = useRef(false)

  const loadData = async () => {
    // Prevent multiple simultaneous calls
    if (isLoadingRef.current) {
      console.log(`API call for ${category} already in progress, skipping...`)
      return
    }

    try {
      console.log(`Loading ${category} data...`)
      isLoadingRef.current = true
      setLoading(true)
      const items = await MasterDataService.getAll(category)
      setData(items)
      hasLoadedRef.current = true
    } catch (error) {
      console.error(`Error loading ${category}:`, error)
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
  }, [category])

  const refreshData = () => {
    hasLoadedRef.current = false
    loadData()
  }

  const handleAdd = async (item: Omit<MasterDataItem, 'id' | 'createdAt'>): Promise<void> => {
    try {
      const newItem = await MasterDataService.create(category, item)
      setData(prev => [newItem, ...prev])
    } catch (error) {
      console.error(`Error adding ${category}:`, error)
      throw error
    }
  }

  const handleEdit = async (id: string, item: Partial<Omit<MasterDataItem, 'id' | 'createdAt'>>): Promise<void> => {
    try {
      await MasterDataService.update(category, id, item)
      setData(prev => prev.map(existing =>
        existing.id === id ? { ...existing, ...item } : existing
      ))
    } catch (error) {
      console.error(`Error updating ${category}:`, error)
      throw error
    }
  }

  const handleDelete = async (id: string): Promise<void> => {
    try {
      await MasterDataService.delete(category, id)
      setData(prev => prev.filter(item => item.id !== id))
    } catch (error) {
      console.error(`Error deleting ${category}:`, error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading {title}...</div>
      </div>
    )
  }

  return (
    <MasterDataTable
      title={title}
      data={data}
      onAdd={handleAdd}
      onEdit={handleEdit}
      onDelete={handleDelete}
    />
  )
}
