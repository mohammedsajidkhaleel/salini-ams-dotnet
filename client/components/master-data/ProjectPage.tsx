"use client"

import { useState, useEffect } from "react"
import { ProjectTable } from "@/components/project-table"
import { ProjectService, Project } from "@/lib/services/projectService"
import { CompanyService, Company } from "@/lib/services/companyService"
import { CostCenterService, CostCenter } from "@/lib/services/costCenterService"
import { MasterDataService, MasterDataItem } from "@/lib/services/masterDataService"
import { useApiData } from "@/hooks/useApiData"

interface ProjectPageProps {
  // No props needed as this is a standalone page
}

export function ProjectPage({}: ProjectPageProps) {
  const { data, loading, setData } = useApiData<Project>({
    fetchFn: ProjectService.getAll
  })
  
  const [costCenters, setCostCenters] = useState<CostCenter[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [nationalities, setNationalities] = useState<MasterDataItem[]>([])
  const [masterDataLoading, setMasterDataLoading] = useState(false)

  const loadMasterData = async () => {
    try {
      setMasterDataLoading(true)
      const [costCentersData, companiesData, nationalitiesData] = await Promise.all([
        CostCenterService.getAll(),
        CompanyService.getAll(),
        MasterDataService.getAll('nationalities')
      ])
      
      setCostCenters(costCentersData)
      setCompanies(companiesData)
      setNationalities(nationalitiesData)
    } catch (error) {
      console.error('Error loading master data:', error)
    } finally {
      setMasterDataLoading(false)
    }
  }

  useEffect(() => {
    loadMasterData()
  }, [])

  const handleAdd = async (item: Omit<Project, 'id' | 'createdAt' | 'costCenterName' | 'companyName' | 'nationalityName'>): Promise<void> => {
    try {
      console.log("📝 ProjectPage.handleAdd called with:", item)
      const newProject = await ProjectService.create(item)
      console.log("✅ Project created successfully:", newProject)
      setData(prev => [newProject, ...prev])
    } catch (error) {
      console.error('❌ Error adding project:', error)
      throw error
    }
  }

  const handleEdit = async (id: string, item: Partial<Omit<Project, 'id' | 'createdAt' | 'costCenterName' | 'companyName' | 'nationalityName'>>): Promise<void> => {
    try {
      await ProjectService.update(id, item)
      setData(prev => prev.map(existing =>
        existing.id === id ? { 
          ...existing, 
          ...item,
          costCenterName: costCenters.find(cc => cc.id === item.costCenterId)?.name || "",
          companyName: companies.find(c => c.id === item.companyId)?.name || "",
          nationalityName: nationalities.find(n => n.id === item.nationalityId)?.name || ""
        } : existing
      ))
    } catch (error) {
      console.error('Error updating project:', error)
      throw error
    }
  }

  const handleDelete = async (id: string): Promise<void> => {
    try {
      await ProjectService.delete(id)
      setData(prev => prev.filter(item => item.id !== id))
    } catch (error) {
      console.error('Error deleting project:', error)
    }
  }

  if (loading || masterDataLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading Projects...</div>
      </div>
    )
  }

  return (
    <ProjectTable
      data={data}
      costCenters={costCenters}
      companies={companies}
      nationalities={nationalities}
      onAdd={handleAdd}
      onEdit={handleEdit}
      onDelete={handleDelete}
    />
  )
}
