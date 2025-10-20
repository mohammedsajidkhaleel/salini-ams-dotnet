"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/sidebar"
import { SettingsLayout } from "@/components/settings-layout"
import { MasterDataTable } from "@/components/master-data-table"
import { SubDepartmentTable } from "@/components/sub-department-table"
import { ItemsTable } from "@/components/items-table"
import { CostCenterTable } from "@/components/cost-center-table"
import { CompanyTable } from "@/components/company-table"
import { ProjectTable } from "@/components/project-table"
import { SimCardPlanTable } from "@/components/sim-card-plan-table"
import { SimCardPlanForm } from "@/components/sim-card-plan-form"
import { SimCardPlanDetails } from "@/components/sim-card-plan-details"
import { UserHeader } from "@/components/user-header"
import { ProtectedRoute } from "@/components/protected-route"
import { companyService } from "@/lib/services/companyService"
import { costCenterService } from "@/lib/services/costCenterService"
import { departmentService } from "@/lib/services/departmentService"
import { subDepartmentService } from "@/lib/services/subDepartmentService"
import { employeeCategoryService } from "@/lib/services/employeeCategoryService"
import { employeePositionService } from "@/lib/services/employeePositionService"
import { nationalityService } from "@/lib/services/nationalityService"
import { itemService } from "@/lib/services/itemService"
import { ProjectService } from "@/lib/services/projectService"
import { simCardPlanService } from "@/lib/services/simCardPlanService"
import { simProviderService } from "@/lib/services/simProviderService"
import { simTypeService } from "@/lib/services/simTypeService"

// Table mapping for different categories
const tableMapping = {
  projects: "projects",
  "cost-centers": "cost_centers",
  companies: "companies",
  vendors: "vendors", 
  departments: "departments",
  "sub-departments": "sub_departments",
  "employee-categories": "employee_categories",
  "employee-positions": "employee_positions",
  "item-categories": "item_categories",
  items: "items",
  accessories: "accessories",
  nationalities: "nationalities",
  "employee-sponsors": "employee_sponsors",
  "sim-card-plans": "sim_card_plans",
  "sim-providers": "sim_providers",
  "sim-types": "sim_types",
  "asset-models": "asset_models",
} as const

type MasterDataItem = {
  id: string
  name: string
  description?: string
  status: "active" | "inactive"
  createdAt: string
  [key: string]: any // Allow additional properties
}

type CostCenterItem = {
  id: string
  code: string
  name: string
  description?: string
  status: "active" | "inactive"
  createdAt: string
  [key: string]: any // Allow additional properties
}

type CompanyItem = {
  id: string
  code: string
  name: string
  description?: string
  status: "active" | "inactive"
  createdAt: string
  [key: string]: any // Allow additional properties
}

type ProjectItem = {
  id: string
  code: string
  name: string
  description?: string
  status: "active" | "inactive"
  companyId?: string
  companyName?: string
  createdAt: string
  [key: string]: any // Allow additional properties
}

type SubDepartmentItem = MasterDataItem & {
  departmentId: string
  departmentName: string
}

type Item = MasterDataItem & {
  itemCategoryId: string
  itemCategoryName: string
}

const categoryTitles = {
  projects: "Projects",
  "cost-centers": "Cost Centers",
  companies: "Companies",
  vendors: "Vendors",
  departments: "Departments",
  "sub-departments": "Sub Departments",
  "employee-categories": "Employee Categories",
  "employee-positions": "Employee Positions",
  "item-categories": "Item Categories",
  items: "Items",
  accessories: "Accessories",
  nationalities: "Nationalities",
  "employee-sponsors": "Employee Sponsors",
  "sim-card-plans": "SIM Card Plans",
  "sim-providers": "SIM Providers",
  "sim-types": "SIM Types",
  "asset-models": "Asset Models",
}

export default function SettingsPage() {
  const [activeCategory, setActiveCategory] = useState("projects")
  const [data, setData] = useState<Record<string, MasterDataItem[]>>({
    projects: [],
    "cost-centers": [],
    companies: [],
    vendors: [],
    departments: [],
    "sub-departments": [],
    "employee-categories": [],
    "employee-positions": [],
    "item-categories": [],
    items: [],
    accessories: [],
    nationalities: [],
    "employee-sponsors": [],
    "sim-card-plans": [],
    "sim-providers": [],
    "sim-types": [],
    "asset-models": [],
  })
  const [costCenters, setCostCenters] = useState<CostCenterItem[]>([])
  const [companies, setCompanies] = useState<CompanyItem[]>([])
  const [departments, setDepartments] = useState<MasterDataItem[]>([])
  const [itemCategories, setItemCategories] = useState<MasterDataItem[]>([])
  const [nationalities, setNationalities] = useState<MasterDataItem[]>([])
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [loadedCategories, setLoadedCategories] = useState<Set<string>>(new Set())
  
  // SIM Card Plans specific state
  const [simCardPlans, setSimCardPlans] = useState<any[]>([])
  const [showSimCardPlanForm, setShowSimCardPlanForm] = useState(false)
  const [editingSimCardPlan, setEditingSimCardPlan] = useState<any>(undefined)
  const [viewingSimCardPlan, setViewingSimCardPlan] = useState<any>(null)

  // Load data when category changes
  useEffect(() => {
    if (!loadedCategories.has(activeCategory)) {
      if (activeCategory === "sim-card-plans") {
        loadSimCardPlansData()
      } else {
        loadCategoryData(activeCategory)
      }
    }
  }, [activeCategory, loadedCategories])

  // Load SIM Card Plans with provider data
  const loadSimCardPlansData = async () => {
    try {
      setLoading(prev => ({ ...prev, "sim-card-plans": true }))

      // Load SIM card plans
      const plansResponse = await simCardPlanService.getSimCardPlans({
        pageNumber: 1,
        pageSize: 1000
      })

      if (!plansResponse?.items) {
        console.error("Error loading SIM card plans")
        return
      }

      // Load providers for name lookup
      const providersResponse = await simProviderService.getSimProviders({
        pageNumber: 1,
        pageSize: 1000
      })

      const providers = providersResponse?.items || []
      
      // Map plans with provider names
      const mappedPlans = plansResponse.items.map((plan: any) => ({
        id: plan.id,
        name: plan.name,
        description: plan.description,
        data_limit: plan.dataLimit,
        monthly_fee: plan.monthlyFee,
        provider_id: plan.providerId,
        is_active: plan.isActive,
        provider_name: providers.find(p => p.id === plan.providerId)?.name || "Unknown Provider",
        status: (plan.isActive ? "active" : "inactive") as "active" | "inactive",
        createdAt: new Date(plan.createdAt).toISOString().split("T")[0],
      }))

      setSimCardPlans(mappedPlans)
      setData(prev => ({ ...prev, "sim-card-plans": mappedPlans }))
      setLoadedCategories(prev => new Set([...prev, "sim-card-plans"]))
    } catch (error) {
      console.error("Error loading SIM card plans:", error)
    } finally {
      setLoading(prev => ({ ...prev, "sim-card-plans": false }))
    }
  }

  // Load dependencies first (departments, item categories, cost centers, companies, nationalities)
  const loadDependencies = async () => {
    const dependencies = [
      { key: 'departments', table: 'departments', setter: setDepartments },
      { key: 'item-categories', table: 'item_categories', setter: setItemCategories },
      { key: 'cost-centers', table: 'cost_centers', setter: setCostCenters },
      { key: 'companies', table: 'companies', setter: setCompanies },
      { key: 'nationalities', table: 'nationalities', setter: setNationalities },
    ]

    const promises = dependencies.map(async ({ key, table, setter }) => {
      try {
        let response: any = null
        
        // Call appropriate service based on category
        switch (key) {
          case 'departments':
            response = await departmentService.getDepartments({ pageNumber: 1, pageSize: 1000 })
            break
          case 'sub-departments':
            response = await subDepartmentService.getSubDepartments({ pageNumber: 1, pageSize: 1000 })
            break
          case 'employee-positions':
            response = await employeePositionService.getEmployeePositions({ pageNumber: 1, pageSize: 1000 })
            break
          case 'employee-categories':
            response = await employeeCategoryService.getEmployeeCategories({ pageNumber: 1, pageSize: 1000 })
            break
          case 'item-categories':
            response = await itemService.getItemCategories({ pageNumber: 1, pageSize: 1000 })
            break
          case 'cost-centers':
            response = await costCenterService.getCostCenters({ pageNumber: 1, pageSize: 1000 })
            break
          case 'companies':
            response = await companyService.getCompanies({ pageNumber: 1, pageSize: 1000 })
            break
          case 'nationalities':
            response = await nationalityService.getNationalities({ pageNumber: 1, pageSize: 1000 })
            break
          default:
            console.warn(`Unknown category: ${key}`)
            return
        }

        if (!response?.items) {
          console.error(`Error loading ${key}: No data returned`)
          return
        }

        const formattedData = response.items.map((item: any) => ({
          id: item.id,
          name: item.name,
          description: item.description || "",
          status: (item.isActive ? "active" : "inactive") as "active" | "inactive",
          createdAt: new Date(item.createdAt).toISOString().split("T")[0],
          ...(key === 'cost-centers' && { code: item.code }),
          ...(key === 'companies' && { code: item.code }),
        }))

        setter(formattedData as any)
        setData(prev => ({ ...prev, [key]: formattedData }))
      } catch (error) {
        console.error(`Error loading ${key}:`, error)
      }
    })

    await Promise.all(promises)
  }

  // Load specific category data on demand
  const loadCategoryData = async (category: string) => {
    try {
      setLoading(prev => ({ ...prev, [category]: true }))

      // Load dependencies first if not already loaded
      if (!loadedCategories.has('departments') && 
          (category === 'sub-departments' || category === 'projects')) {
        await loadDependencies()
      }

      const tableName = tableMapping[category as keyof typeof tableMapping]
      if (!tableName) return

      // TODO: Replace with new API implementation
      // For now, return empty data to prevent runtime errors
      console.log(`Loading data for category: ${category}, table: ${tableName}`)
      setData([])
      return
      
      const { data: tableData, error } = await query.order("created_at", { ascending: false })

      if (error) {
        console.error(`Error loading ${category}:`, error)
        return
      }

      const formattedData = tableData?.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description || "",
        status: item.status as "active" | "inactive",
        createdAt: new Date(item.created_at).toISOString().split("T")[0],
        ...(category === "sub-departments" && {
          departmentId: item.department_id,
          departmentName: departments.find(d => d.id === item.department_id)?.name || "",
        }),
        ...(category === "items" && {
          itemCategoryId: item.item_category_id,
          itemCategoryName: itemCategories.find(c => c.id === item.item_category_id)?.name || "",
        }),
        ...(category === "projects" && {
          code: item.code,
          companyId: item.company_id,
          companyName: item.companies?.name || "",
        }),
        ...(category === "cost-centers" && { code: item.code }),
        ...(category === "companies" && { code: item.code }),
        ...(category === "sim-providers" && { 
          status: (item.is_active ? "active" : "inactive") as "active" | "inactive" 
        }),
        ...(category === "sim-types" && { 
          status: (item.is_active ? "active" : "inactive") as "active" | "inactive" 
        }),
      })) || []

      setData(prev => ({
        ...prev,
        [category]: formattedData
      }))

      setLoadedCategories(prev => new Set([...prev, category]))
    } catch (error) {
      console.error(`Error loading ${category}:`, error)
    } finally {
      setLoading(prev => ({ ...prev, [category]: false }))
    }
  }

  const handleAdd = async (category: string, item: any) => {
    try {
      const tableName = tableMapping[category as keyof typeof tableMapping]
      
      // For cost centers, companies, and projects, check if the code is unique before adding
      // Note: Backend should handle uniqueness validation
      if ((category === "cost-centers" || category === "companies" || category === "projects") && item.code && item.code.trim()) {
        // TODO: Implement code uniqueness check via API if needed
        // For now, let the backend handle validation
      }
      
      // Generate a unique ID for text-based primary keys
      const generateId = () => {
        const timestamp = Date.now()
        const random = Math.random().toString(36).substr(2, 9)
        return `${category.toUpperCase()}_${timestamp}_${random}`
      }

      const payload = {
        id: generateId(),
        name: item.name,
        description: item.description || "",
        status: item.status,
        created_at: new Date().toISOString(),
        ...(category === "sub-departments" && {
          department_id: (item as SubDepartmentItem).departmentId || null,
        }),
        ...(category === "items" && {
          item_category_id: (item as Item).itemCategoryId || null,
        }),
        ...(category === "cost-centers" && {
          code: (item as CostCenterItem).code?.trim() || null,
        }),
        ...(category === "companies" && {
          code: (item as CompanyItem).code?.trim() || null,
        }),
        ...(category === "projects" && {
          code: (item as ProjectItem).code?.trim() || null,
          cost_center_id: (item as ProjectItem).costCenterId || null,
          company_id: (item as ProjectItem).companyId || null,
          nationality_id: (item as ProjectItem).nationalityId || null,
        })
      }

      let newItem: any = null
      
      // Call appropriate service based on category
      switch (category) {
        case 'departments':
          newItem = await departmentService.createDepartment(payload)
          break
        case 'sub-departments':
          newItem = await subDepartmentService.createSubDepartment(payload)
          break
        case 'employee-positions':
          newItem = await employeePositionService.createEmployeePosition(payload)
          break
        case 'employee-categories':
          newItem = await employeeCategoryService.createEmployeeCategory(payload)
          break
        case 'item-categories':
          newItem = await itemService.createItemCategory(payload)
          break
        case 'cost-centers':
          newItem = await costCenterService.createCostCenter(payload)
          break
        case 'companies':
          newItem = await companyService.createCompany(payload)
          break
        case 'nationalities':
          newItem = await nationalityService.createNationality(payload)
          break
        default:
          console.error(`Unknown category: ${category}`)
          return
      }

      if (!newItem) {
        console.error(`Error adding ${category}`)
        return
      }

      const formattedItem = {
        id: newItem.id,
        name: newItem.name,
        description: newItem.description || "",
        status: (newItem.isActive ? "active" : "inactive") as "active" | "inactive",
        createdAt: new Date(newItem.createdAt).toISOString().split("T")[0],
        ...(category === "sub-departments" && {
          departmentId: newItem.departmentId,
          departmentName: departments.find(d => d.id === newItem.departmentId)?.name || "",
        }),
        ...(category === "items" && {
          itemCategoryId: newItem.itemCategoryId,
          itemCategoryName: itemCategories.find(c => c.id === newItem.itemCategoryId)?.name || "",
        }),
        ...(category === "cost-centers" && {
          code: newItem.code,
        }),
        ...(category === "companies" && {
          code: newItem.code,
        }),
        ...(category === "projects" && {
          code: newItem.code,
          companyId: newItem.company_id,
          companyName: companies.find(c => c.id === newItem.company_id)?.name || "",
        })
      }

      setData(prev => ({
        ...prev,
        [category]: [formattedItem, ...prev[category as keyof typeof prev]]
      }))
      
      // Reload data from database to ensure consistency
      console.log(`Reloading data from database after successful add...`)
      await loadCategoryData(category)
    } catch (error) {
      console.error(`Error adding ${category}:`, error)
    }
  }

  const handleEdit = async (category: string, id: string, item: any) => {
    try {
      const tableName = tableMapping[category as keyof typeof tableMapping]
      
      // For cost centers, companies, and projects, check if the code is unique before updating
      // Note: Backend should handle uniqueness validation
      if ((category === "cost-centers" || category === "companies" || category === "projects") && item.code && item.code.trim()) {
        // TODO: Implement code uniqueness check via API if needed
        // For now, let the backend handle validation
      }
      
      const payload = {
        name: item.name,
        description: item.description || "",
        status: item.status,
        ...(category === "sub-departments" && {
          department_id: (item as SubDepartmentItem).departmentId,
        }),
        ...(category === "items" && {
          item_category_id: (item as Item).itemCategoryId,
        }),
        ...(category === "cost-centers" && {
          code: (item as CostCenterItem).code?.trim() || null,
        }),
        ...(category === "companies" && {
          code: (item as CompanyItem).code?.trim() || null,
        }),
        ...(category === "projects" && {
          code: (item as ProjectItem).code?.trim() || null,
          cost_center_id: (item as ProjectItem).costCenterId || null,
          company_id: (item as ProjectItem).companyId || null,
          nationality_id: (item as ProjectItem).nationalityId || null,
        })
      }

      let updatedItem: any = null
      
      // Call appropriate service based on category
      switch (category) {
        case 'departments':
          updatedItem = await departmentService.updateDepartment(id, payload)
          break
        case 'sub-departments':
          updatedItem = await subDepartmentService.updateSubDepartment(id, payload)
          break
        case 'employee-positions':
          updatedItem = await employeePositionService.updateEmployeePosition(id, payload)
          break
        case 'employee-categories':
          updatedItem = await employeeCategoryService.updateEmployeeCategory(id, payload)
          break
        case 'item-categories':
          updatedItem = await itemService.updateItemCategory(id, payload)
          break
        case 'cost-centers':
          updatedItem = await costCenterService.updateCostCenter(id, payload)
          break
        case 'companies':
          updatedItem = await companyService.updateCompany(id, payload)
          break
        case 'nationalities':
          updatedItem = await nationalityService.updateNationality(id, payload)
          break
        default:
          console.error(`Unknown category: ${category}`)
          return
      }

      if (!updatedItem) {
        console.error(`Error updating ${category}`)
        return
      }

      setData(prev => ({
        ...prev,
        [category]: prev[category as keyof typeof prev].map((existing) =>
          existing.id === id ? { 
            ...existing, 
            ...item,
            ...(category === "sub-departments" && {
              departmentName: departments.find(d => d.id === (item as SubDepartmentItem).departmentId)?.name || "",
            }),
            ...(category === "items" && {
              itemCategoryName: itemCategories.find(c => c.id === (item as Item).itemCategoryId)?.name || "",
            }),
            ...(category === "cost-centers" && {
              code: (item as CostCenterItem).code,
            }),
            ...(category === "companies" && {
              code: (item as CompanyItem).code,
            }),
            ...(category === "projects" && {
              costCenterName: costCenters.find(cc => cc.id === (item as ProjectItem).costCenterId)?.name || "",
              companyName: companies.find(c => c.id === (item as ProjectItem).companyId)?.name || "",
              nationalityName: nationalities.find(n => n.id === (item as ProjectItem).nationalityId)?.name || "",
            })
          } : existing,
        ),
      }))
      
      // Reload data from database to ensure consistency
      console.log(`Reloading data from database after successful edit...`)
      await loadCategoryData(category)
    } catch (error) {
      console.error(`Error updating ${category}:`, error)
    }
  }

  const handleDelete = async (category: string, id: string) => {
    try {
      const tableName = tableMapping[category as keyof typeof tableMapping]
      
      let success = false
      
      // Call appropriate service based on category
      switch (category) {
        case 'departments':
          success = await departmentService.deleteDepartment(id)
          break
        case 'sub-departments':
          success = await subDepartmentService.deleteSubDepartment(id)
          break
        case 'employee-positions':
          success = await employeePositionService.deleteEmployeePosition(id)
          break
        case 'employee-categories':
          success = await employeeCategoryService.deleteEmployeeCategory(id)
          break
        case 'item-categories':
          success = await itemService.deleteItemCategory(id)
          break
        case 'cost-centers':
          success = await costCenterService.deleteCostCenter(id)
          break
        case 'companies':
          success = await companyService.deleteCompany(id)
          break
        case 'nationalities':
          success = await nationalityService.deleteNationality(id)
          break
        default:
          console.error(`Unknown category: ${category}`)
          return
      }

      if (!success) {
        console.error(`Error deleting ${category}`)
        return
      }

      setData(prev => ({
        ...prev,
        [category]: prev[category as keyof typeof prev].filter((item) => item.id !== id),
      }))
      
      // Reload data from database to ensure consistency
      console.log(`Reloading data from database after successful delete...`)
      await loadCategoryData(category)
    } catch (error) {
      console.error(`Error deleting ${category}:`, error)
    }
  }

  // SIM Card Plans specific handlers
  const handleSimCardPlanAdd = () => {
    setEditingSimCardPlan(undefined)
    setShowSimCardPlanForm(true)
  }

  const handleSimCardPlanEdit = (plan: any) => {
    setEditingSimCardPlan(plan)
    setShowSimCardPlanForm(true)
  }

  const handleSimCardPlanView = (plan: any) => {
    setViewingSimCardPlan(plan)
  }

  const handleSimCardPlanDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this SIM card plan?")) {
      return
    }

    try {
      const success = await simCardPlanService.deleteSimCardPlan(id)

      if (!success) {
        console.error("Error deleting SIM card plan")
        alert("Failed to delete SIM card plan. Please try again.")
        return
      }

      setSimCardPlans((prev) => prev.filter((plan) => plan.id !== id))
      setData(prev => ({
        ...prev,
        "sim-card-plans": prev["sim-card-plans"].filter((item) => item.id !== id),
      }))
    } catch (error) {
      console.error("Error deleting SIM card plan:", error)
      alert("Failed to delete SIM card plan. Please try again.")
    }
  }

  const handleSimCardPlanSubmit = async (planData: any) => {
    try {
      if (editingSimCardPlan) {
        // Update existing plan
        const updatedPlan = await simCardPlanService.updateSimCardPlan(editingSimCardPlan.id, {
          name: planData.name,
          description: planData.description,
          dataLimit: planData.data_limit,
          monthlyFee: planData.monthly_fee,
          providerId: planData.provider_id,
          isActive: planData.is_active,
        })

        if (!updatedPlan) {
          console.error("Error updating SIM card plan")
          alert("Failed to update SIM card plan. Please try again.")
          return
        }

        // Update local state
        setSimCardPlans((prev) =>
          prev.map((plan) =>
            plan.id === editingSimCardPlan.id
              ? { ...plan, ...planData, status: (planData.is_active ? "active" : "inactive") as "active" | "inactive" }
              : plan
          )
        )
        setData(prev => ({
          ...prev,
          "sim-card-plans": prev["sim-card-plans"].map((item) =>
            item.id === editingSimCardPlan.id
              ? { ...item, ...planData, status: (planData.is_active ? "active" : "inactive") as "active" | "inactive" }
              : item
          )
        }))
      } else {
        // Add new plan
        const newPlan = await simCardPlanService.createSimCardPlan({
          name: planData.name,
          description: planData.description,
          dataLimit: planData.data_limit,
          monthlyFee: planData.monthly_fee,
          providerId: planData.provider_id,
          isActive: planData.is_active,
        })

        if (!newPlan) {
          console.error("Error adding SIM card plan")
          alert("Failed to add SIM card plan. Please try again.")
          return
        }

        // Add to local state with provider name
        const provider = await simProviderService.getSimProvider(planData.provider_id)

        const newPlanWithProvider = {
          ...newPlan,
          provider_name: provider?.name || "Unknown Provider",
          status: (newPlan.isActive ? "active" : "inactive") as "active" | "inactive",
          createdAt: new Date(newPlan.createdAt).toISOString().split("T")[0],
        }

        setSimCardPlans((prev) => [newPlanWithProvider, ...prev])
        setData(prev => ({
          ...prev,
          "sim-card-plans": [newPlanWithProvider, ...prev["sim-card-plans"]]
        }))
      }

      setShowSimCardPlanForm(false)
      setEditingSimCardPlan(undefined)
    } catch (error) {
      console.error("Error submitting SIM card plan:", error)
      alert("Failed to save SIM card plan. Please try again.")
    }
  }

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Settings</h1>
                <p className="text-muted-foreground">Manage master data and system configuration</p>
              </div>
              <UserHeader />
            </div>

            <SettingsLayout activeCategory={activeCategory} onCategoryChange={setActiveCategory}>
              {loading[activeCategory] ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-muted-foreground">Loading {categoryTitles[activeCategory as keyof typeof categoryTitles]}...</div>
                </div>
              ) : activeCategory === "sub-departments" ? (
                <SubDepartmentTable
                  data={data["sub-departments"] as SubDepartmentItem[]}
                  departments={departments}
                  onAdd={(item) => handleAdd(activeCategory, item)}
                  onEdit={(id, item) => handleEdit(activeCategory, id, item)}
                  onDelete={(id) => handleDelete(activeCategory, id)}
                />
              ) : activeCategory === "items" ? (
                <ItemsTable
                  data={data["items"] as Item[]}
                  itemCategories={itemCategories}
                  onAdd={(item) => handleAdd(activeCategory, item)}
                  onEdit={(id, item) => handleEdit(activeCategory, id, item)}
                  onDelete={(id) => handleDelete(activeCategory, id)}
                />
              ) : activeCategory === "cost-centers" ? (
                <CostCenterTable
                  data={data["cost-centers"] as CostCenterItem[]}
                  onAdd={(item) => handleAdd(activeCategory, item)}
                  onEdit={(id, item) => handleEdit(activeCategory, id, item)}
                  onDelete={(id) => handleDelete(activeCategory, id)}
                />
              ) : activeCategory === "companies" ? (
                <CompanyTable
                  data={data["companies"] as CompanyItem[]}
                  onAdd={(item) => handleAdd(activeCategory, item)}
                  onEdit={(id, item) => handleEdit(activeCategory, id, item)}
                  onDelete={(id) => handleDelete(activeCategory, id)}
                />
              ) : activeCategory === "projects" ? (
                <ProjectTable
                  data={data["projects"] as ProjectItem[]}
                  companies={companies}
                  onAdd={(item) => handleAdd(activeCategory, item)}
                  onEdit={(id, item) => handleEdit(activeCategory, id, item)}
                  onDelete={(id) => handleDelete(activeCategory, id)}
                />
              ) : activeCategory === "sim-card-plans" ? (
                <>
                  <SimCardPlanTable
                    simCardPlans={simCardPlans}
                    onEdit={handleSimCardPlanEdit}
                    onDelete={handleSimCardPlanDelete}
                    onAdd={handleSimCardPlanAdd}
                    onView={handleSimCardPlanView}
                  />
                  {showSimCardPlanForm && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <SimCardPlanForm
                          simCardPlan={editingSimCardPlan}
                          onSubmit={handleSimCardPlanSubmit}
                          onCancel={() => {
                            setShowSimCardPlanForm(false)
                            setEditingSimCardPlan(undefined)
                          }}
                        />
                      </div>
                    </div>
                  )}
                  <SimCardPlanDetails
                    simCardPlan={viewingSimCardPlan}
                    isOpen={!!viewingSimCardPlan}
                    onClose={() => setViewingSimCardPlan(null)}
                  />
                </>
              ) : (
                <MasterDataTable
                  title={categoryTitles[activeCategory as keyof typeof categoryTitles]}
                  data={data[activeCategory as keyof typeof data] as MasterDataItem[]}
                  onAdd={(item) => handleAdd(activeCategory, item)}
                  onEdit={(id, item) => handleEdit(activeCategory, id, item)}
                  onDelete={(id) => handleDelete(activeCategory, id)}
                />
              )}
            </SettingsLayout>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
