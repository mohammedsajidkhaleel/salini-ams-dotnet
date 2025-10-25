"use client"

import { useState, useEffect, useRef } from "react"
import { ItemsTable } from "@/components/items-table"
import { itemService, Item } from "@/lib/services/itemService"
import { MasterDataService, MasterDataItem } from "@/lib/services/masterDataService"

interface ItemPageProps {
  // No props needed as this is a standalone page
}

export function ItemPage({}: ItemPageProps) {
  const [data, setData] = useState<Item[]>([])
  const [itemCategories, setItemCategories] = useState<MasterDataItem[]>([])
  const [loading, setLoading] = useState(false)
  const isLoadingRef = useRef(false)
  const hasLoadedRef = useRef(false)

  const loadData = async () => {
    // Prevent multiple simultaneous calls
    if (isLoadingRef.current) {
      console.log('Items API call already in progress, skipping...')
      return
    }

    try {
      console.log('Loading items data...')
      isLoadingRef.current = true
      setLoading(true)
      const [items, categoriesData] = await Promise.all([
        itemService.getAll(),
        MasterDataService.getAll('item_categories')
      ])
      
      setData(items)
      setItemCategories(categoriesData)
      hasLoadedRef.current = true
    } catch (error) {
      console.error('Error loading items:', error)
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

  const handleAdd = async (item: Omit<Item, 'id' | 'createdAt' | 'itemCategoryName'>): Promise<void> => {
    try {
      const newItem = await itemService.create(item)
      setData(prev => [newItem, ...prev])
    } catch (error) {
      console.error('Error adding item:', error)
      throw error
    }
  }

  const handleEdit = async (id: string, item: Partial<Omit<Item, 'id' | 'createdAt' | 'itemCategoryName'>>): Promise<void> => {
    try {
      await itemService.update(id, item)
      setData(prev => prev.map(existing =>
        existing.id === id ? { 
          ...existing, 
          ...item,
          itemCategoryName: itemCategories.find(c => c.id === item.itemCategoryId)?.name || ""
        } : existing
      ))
    } catch (error) {
      console.error('Error updating item:', error)
      throw error
    }
  }

  const handleDelete = async (id: string): Promise<void> => {
    try {
      await itemService.delete(id)
      setData(prev => prev.filter(item => item.id !== id))
    } catch (error) {
      console.error('Error deleting item:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading Items...</div>
      </div>
    )
  }

  return (
    <ItemsTable
      data={data}
      itemCategories={itemCategories}
      onAdd={handleAdd}
      onEdit={handleEdit}
      onDelete={handleDelete}
    />
  )
}
