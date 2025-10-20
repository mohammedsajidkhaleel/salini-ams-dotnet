"use client"

import { useState, useEffect } from "react"
import { SubDepartmentTable } from "@/components/sub-department-table"
import { SubDepartmentService, SubDepartment } from "@/lib/services/subDepartmentService"
import { DepartmentService, Department } from "@/lib/services/departmentService"

interface SubDepartmentPageProps {
  // No props needed as this is a standalone page
}

export function SubDepartmentPage({}: SubDepartmentPageProps) {
  const [data, setData] = useState<SubDepartment[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(false)

  const loadData = async () => {
    try {
      setLoading(true)
      const [subDepartments, departmentsData] = await Promise.all([
        SubDepartmentService.getAll(),
        DepartmentService.getAll()
      ])
      
      setData(subDepartments)
      setDepartments(departmentsData)
    } catch (error) {
      console.error('Error loading sub-departments:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleAdd = async (item: Omit<SubDepartment, 'id' | 'createdAt' | 'departmentName'>): Promise<void> => {
    try {
      const newSubDepartment = await SubDepartmentService.create(item)
      setData(prev => [newSubDepartment, ...prev])
    } catch (error) {
      console.error('Error adding sub-department:', error)
      throw error
    }
  }

  const handleEdit = async (id: string, item: Partial<Omit<SubDepartment, 'id' | 'createdAt' | 'departmentName'>>): Promise<void> => {
    try {
      await SubDepartmentService.update(id, item)
      setData(prev => prev.map(existing =>
        existing.id === id ? { 
          ...existing, 
          ...item,
          departmentName: departments.find(d => d.id === item.departmentId)?.name || ""
        } : existing
      ))
    } catch (error) {
      console.error('Error updating sub-department:', error)
      throw error
    }
  }

  const handleDelete = async (id: string): Promise<void> => {
    try {
      await SubDepartmentService.delete(id)
      setData(prev => prev.filter(item => item.id !== id))
    } catch (error) {
      console.error('Error deleting sub-department:', error)
    }
  }

  const loadDependenciesForForm = async () => {
    if (departments.length === 0) {
      try {
        const departmentsData = await DepartmentService.getAll()
        setDepartments(departmentsData)
      } catch (error) {
        console.error('Error loading departments for form:', error)
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading Sub Departments...</div>
      </div>
    )
  }

  return (
    <SubDepartmentTable
      data={data}
      departments={departments}
      onAdd={handleAdd}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onLoadDependencies={loadDependenciesForForm}
    />
  )
}
