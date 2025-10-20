"use client"

import { CostCenterTable } from "@/components/cost-center-table"
import { CostCenterService, CostCenter } from "@/lib/services/costCenterService"
import { useApiData } from "@/hooks/useApiData"

interface CostCenterPageProps {
  // No props needed as this is a standalone page
}

export function CostCenterPage({}: CostCenterPageProps) {
  const { data, loading, setData } = useApiData<CostCenter>({
    fetchFn: CostCenterService.getAll
  })

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
