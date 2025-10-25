"use client"

import { useState, useEffect, useRef } from "react"
import { MasterDataTable } from "@/components/master-data-table"
import { DepartmentService, Department } from "@/lib/services/departmentService"

interface DepartmentPageProps {
  // No props needed as this is a standalone page
}

export function DepartmentPage({}: DepartmentPageProps) {
  const [data, setData] = useState<Department[]>([])
  const [loading, setLoading] = useState(false)
  const isLoadingRef = useRef(false)
  const hasLoadedRef = useRef(false)

  const loadData = async () => {
    // Prevent multiple simultaneous calls
    if (isLoadingRef.current) {
      console.log('Departments API call already in progress, skipping...')
      return
    }

    try {
      console.log('Loading departments data...')
      isLoadingRef.current = true
      setLoading(true)
      const items = await DepartmentService.getAll()
      setData(items)
      hasLoadedRef.current = true
    } catch (error) {
      console.error('Error loading departments:', error)
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

  const handleAdd = async (item: Omit<Department, 'id' | 'createdAt'>): Promise<void> => {
    try {
      const newDepartment = await DepartmentService.create(item)
      setData(prev => [newDepartment, ...prev])
    } catch (error) {
      console.error('Error adding department:', error)
      throw error
    }
  }

  const handleEdit = async (id: string, item: Partial<Omit<Department, 'id' | 'createdAt'>>): Promise<void> => {
    try {
      await DepartmentService.update(id, item)
      setData(prev => prev.map(existing =>
        existing.id === id ? { ...existing, ...item } : existing
      ))
    } catch (error) {
      console.error('Error updating department:', error)
      throw error
    }
  }

  const handleDelete = async (id: string): Promise<void> => {
    try {
      await DepartmentService.delete(id)
      setData(prev => prev.filter(item => item.id !== id))
    } catch (error) {
      console.error('Error deleting department:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading Departments...</div>
      </div>
    )
  }

  return (
    <MasterDataTable
      title="Departments"
      data={data}
      onAdd={handleAdd}
      onEdit={handleEdit}
      onDelete={handleDelete}
    />
  )
}
