"use client"

import { useState, useEffect, useRef } from "react"
import { CompanyTable } from "@/components/company-table"
import { CompanyService, Company } from "@/lib/services/companyService"

interface CompanyPageProps {
  // No props needed as this is a standalone page
}

export function CompanyPage({}: CompanyPageProps) {
  const [data, setData] = useState<Company[]>([])
  const [loading, setLoading] = useState(false)
  const isLoadingRef = useRef(false)
  const hasLoadedRef = useRef(false)

  const loadData = async () => {
    // Prevent multiple simultaneous calls
    if (isLoadingRef.current) {
      console.log('Companies API call already in progress, skipping...')
      return
    }

    try {
      console.log('Loading companies data...')
      isLoadingRef.current = true
      setLoading(true)
      const items = await CompanyService.getAll()
      setData(items)
      hasLoadedRef.current = true
    } catch (error) {
      console.error('Error loading companies:', error)
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

  const handleAdd = async (item: Omit<Company, 'id' | 'createdAt'>): Promise<void> => {
    try {
      const newCompany = await CompanyService.create(item)
      setData(prev => [newCompany, ...prev])
    } catch (error) {
      console.error('Error adding company:', error)
      throw error
    }
  }

  const handleEdit = async (id: string, item: Partial<Omit<Company, 'id' | 'createdAt'>>): Promise<void> => {
    try {
      await CompanyService.update(id, item)
      setData(prev => prev.map(existing =>
        existing.id === id ? { ...existing, ...item } : existing
      ))
    } catch (error) {
      console.error('Error updating company:', error)
      throw error
    }
  }

  const handleDelete = async (id: string): Promise<void> => {
    try {
      await CompanyService.delete(id)
      setData(prev => prev.filter(item => item.id !== id))
    } catch (error) {
      console.error('Error deleting company:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading Companies...</div>
      </div>
    )
  }

  return (
    <CompanyTable
      data={data}
      onAdd={handleAdd}
      onEdit={handleEdit}
      onDelete={handleDelete}
    />
  )
}
