"use client"

import { useState, useEffect } from "react"
import { ItemsTable } from "@/components/items-table"
import { ItemService, Item } from "@/lib/services/itemService"
import { MasterDataService, MasterDataItem } from "@/lib/services/masterDataService"

interface ItemPageProps {
  // No props needed as this is a standalone page
}

export function ItemPage({}: ItemPageProps) {
  const [data, setData] = useState<Item[]>([])
  const [itemCategories, setItemCategories] = useState<MasterDataItem[]>([])
  const [loading, setLoading] = useState(false)

  const loadData = async () => {
    try {
      setLoading(true)
      const [items, categoriesData] = await Promise.all([
        ItemService.getAll(),
        MasterDataService.getAll('item_categories')
      ])
      
      setData(items)
      setItemCategories(categoriesData)
    } catch (error) {
      console.error('Error loading items:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleAdd = async (item: Omit<Item, 'id' | 'createdAt' | 'itemCategoryName'>): Promise<void> => {
    try {
      const newItem = await ItemService.create(item)
      setData(prev => [newItem, ...prev])
    } catch (error) {
      console.error('Error adding item:', error)
      throw error
    }
  }

  const handleEdit = async (id: string, item: Partial<Omit<Item, 'id' | 'createdAt' | 'itemCategoryName'>>): Promise<void> => {
    try {
      await ItemService.update(id, item)
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
      await ItemService.delete(id)
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
