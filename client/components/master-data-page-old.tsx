"use client"

import { useState, useEffect } from "react"
import { MasterDataTable } from "@/components/master-data-table"
import { SubDepartmentTable } from "@/components/sub-department-table"
import { ItemsTable } from "@/components/items-table"
import { CostCenterTable } from "@/components/cost-center-table"
import { CompanyTable } from "@/components/company-table"
import { ProjectTable } from "@/components/project-table"
import { SimCardPlanTable } from "@/components/sim-card-plan-table"
import { SimCardPlanForm } from "@/components/sim-card-plan-form"
import { SimCardPlanDetails } from "@/components/sim-card-plan-details"
import { supabase } from "@/lib/supabaseClient"

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
  costCenterId?: string
  costCenterName?: string
  companyId?: string
  companyName?: string
  nationalityId?: string
  nationalityName?: string
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
  "sim-card-plans": "SIM Card Plans",
  "sim-providers": "SIM Providers",
  "sim-types": "SIM Types",
  "asset-models": "Asset Models",
}

interface MasterDataPageProps {
  category: string
}

export function MasterDataPage({ category }: MasterDataPageProps) {
  const [data, setData] = useState<MasterDataItem[]>([])
  const [costCenters, setCostCenters] = useState<CostCenterItem[]>([])
  const [companies, setCompanies] = useState<CompanyItem[]>([])
  const [departments, setDepartments] = useState<MasterDataItem[]>([])
  const [itemCategories, setItemCategories] = useState<MasterDataItem[]>([])
  const [nationalities, setNationalities] = useState<MasterDataItem[]>([])
  const [loading, setLoading] = useState(false)
  
  // SIM Card Plans specific state
  const [simCardPlans, setSimCardPlans] = useState<any[]>([])
  const [showSimCardPlanForm, setShowSimCardPlanForm] = useState(false)
  const [editingSimCardPlan, setEditingSimCardPlan] = useState<any>(undefined)
  const [viewingSimCardPlan, setViewingSimCardPlan] = useState<any>(null)

  // Load specific dependencies based on category and return the data
  const loadSpecificDependencies = async (requiredDeps: string[]) => {
    try {
      const dependencyMap = {
        'departments': { table: 'departments', setter: setDepartments },
        'item-categories': { table: 'item_categories', setter: setItemCategories },
        'cost-centers': { table: 'cost_centers', setter: setCostCenters },
        'companies': { table: 'companies', setter: setCompanies },
        'nationalities': { table: 'nationalities', setter: setNationalities },
      }

      const results: { [key: string]: any[] } = {}

      const promises = requiredDeps.map(async (key) => {
        const dep = dependencyMap[key as keyof typeof dependencyMap]
        if (!dep) return

        console.log(`Loading dependency: ${key} from table: ${dep.table}`)
        const { data, error } = await supabase
          .from(dep.table)
          .select("*")
          .order("created_at", { ascending: false })

        if (error) {
          console.error(`Error loading ${key}:`, error)
          return
        }

        const formattedData = data?.map(item => ({
          id: item.id,
          name: item.name,
          description: item.description || "",
          status: item.status as "active" | "inactive",
          createdAt: new Date(item.created_at).toISOString().split("T")[0],
          ...(key === 'cost-centers' && { code: item.code }),
          ...(key === 'companies' && { code: item.code }),
        })) || []

        dep.setter(formattedData as any)
        results[key] = formattedData
        console.log(`Loaded ${formattedData.length} ${key}`)
      })

      await Promise.all(promises)
      console.log(`Loaded ${requiredDeps.length} specific dependencies successfully`)
      return results
    } catch (error) {
      console.error('Error in loadSpecificDependencies:', error)
      throw error
    }
  }

  // Load specific category data
  const loadCategoryData = async () => {
    try {
      setLoading(true)
      console.log(`Loading category: ${category}`)
      
      // Add debugging for accessories specifically
      if (category === "accessories") {
        console.log("🔍 Starting to load accessories data...")
        console.log("🔍 Current data state:", data)
      }

      // Add timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        console.warn(`Loading timeout for category: ${category}`)
        setLoading(false)
      }, 10000) // 10 second timeout

      if (category === "sim-card-plans") {
        await loadSimCardPlansData()
        clearTimeout(timeoutId)
        return
      }

      const tableName = tableMapping[category as keyof typeof tableMapping]
      if (!tableName) {
        console.error(`No table mapping found for category: ${category}`)
        setLoading(false)
        return
      }
      
      console.log(`Loading data from table: ${tableName}`)
      
      // Add specific debugging for accessories
      if (category === "accessories") {
        console.log("🔍 Loading accessories data...")
      }

      let query = supabase.from(tableName).select("*")
      
      // Use joins for categories that need related data
      // Note: These joins will work after the foreign key migration is applied
      if (category === "sub-departments") {
        query = supabase
          .from(tableName)
          .select(`
            *,
            departments!left(name)
          `)
      } else if (category === "items") {
        query = supabase
          .from(tableName)
          .select(`
            *,
            item_categories!left(name)
          `)
      } else if (category === "projects") {
        query = supabase
          .from(tableName)
          .select(`
            *,
            companies!company_id(name),
            cost_centers!cost_center_id(name),
            nationalities!nationality_id(name)
          `)
      }
      
      const { data: tableData, error } = await query.order("created_at", { ascending: false })

      if (error) {
        console.error(`Error loading ${category}:`, error)
        setLoading(false)
        return
      }

      // Add specific debugging for accessories
      if (category === "accessories") {
        console.log("📊 Raw accessories data from database:", tableData)
        console.log("📊 Number of accessories found:", tableData?.length || 0)
      }

      // Debug logging for projects
      if (category === "projects") {
        console.log("Projects data:", tableData)
      }

      const formattedData = tableData?.map(item => ({
        id: item.id || "",
        name: item.name || "",
        description: item.description || "",
        status: (item.status || "active") as "active" | "inactive",
        createdAt: item.created_at ? new Date(item.created_at).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
        ...(category === "sub-departments" && {
          departmentId: item.department_id,
          departmentName: item.departments?.name || "",
        }),
        ...(category === "items" && {
          itemCategoryId: item.item_category_id,
          itemCategoryName: item.item_categories?.name || "",
        }),
        ...(category === "projects" && {
          code: item.code || "",
          costCenterId: item.cost_center_id,
          costCenterName: item.cost_centers?.name || item.cost_center_id || "",
          companyId: item.company_id,
          companyName: item.companies?.name || item.company_id || "",
          nationalityId: item.nationality_id,
          nationalityName: item.nationalities?.name || item.nationality_id || "",
          // Debug info
          _debug: {
            companies: item.companies,
            cost_centers: item.cost_centers,
            nationalities: item.nationalities,
            company_id: item.company_id,
            cost_center_id: item.cost_center_id,
            nationality_id: item.nationality_id
          }
        }),
        ...(category === "cost-centers" && { code: item.code || "" }),
        ...(category === "companies" && { code: item.code || "" }),
        ...(category === "sim-providers" && { 
          status: (item.is_active ? "active" : "inactive") as "active" | "inactive" 
        }),
        ...(category === "sim-types" && { 
          status: (item.is_active ? "active" : "inactive") as "active" | "inactive" 
        }),
      })) || []

      // Add specific debugging for accessories
      if (category === "accessories") {
        console.log("📊 Formatted accessories data:", formattedData)
        console.log("📊 Number of formatted accessories:", formattedData?.length || 0)
      }

      setData(formattedData)
      
      // Add debugging for accessories specifically
      if (category === "accessories") {
        console.log("🔍 Data set in state:", formattedData)
        console.log("🔍 Data length:", formattedData?.length || 0)
      }
      
      setLoading(false)
      clearTimeout(timeoutId)
    } catch (error) {
      console.error(`Error loading ${category}:`, error)
      setLoading(false)
      clearTimeout(timeoutId)
    }
  }

  // Load SIM Card Plans with provider data
  const loadSimCardPlansData = async () => {
    try {
      // Load SIM card plans with provider information
      const { data: plansData, error: plansError } = await supabase
        .from("sim_card_plans")
        .select(`
          id,
          name,
          description,
          data_limit,
          monthly_fee,
          provider_id,
          is_active,
          created_at
        `)
        .order("created_at", { ascending: false })

      if (plansError) {
        console.error("Error loading SIM card plans:", plansError)
        return
      }

      // Load providers for name lookup
      const { data: providersData, error: providersError } = await supabase
        .from("sim_providers")
        .select("id, name")

      if (providersError) {
        console.error("Error loading providers:", providersError)
        return
      }

      const providers = providersData || []
      
      // Map plans with provider names
      const mappedPlans = (plansData || []).map((plan: any) => ({
        id: plan.id,
        name: plan.name,
        description: plan.description,
        data_limit: plan.data_limit,
        monthly_fee: plan.monthly_fee,
        provider_id: plan.provider_id,
        is_active: plan.is_active,
        provider_name: providers.find(p => p.id === plan.provider_id)?.name || "Unknown Provider",
        status: (plan.is_active ? "active" : "inactive") as "active" | "inactive",
        createdAt: new Date(plan.created_at).toISOString().split("T")[0],
      }))

      setSimCardPlans(mappedPlans)
      setData(mappedPlans)
    } catch (error) {
      console.error("Error loading SIM card plans:", error)
    }
  }

  useEffect(() => {
    console.log('MasterDataPage useEffect triggered for category:', category)
    
    // Add debugging for accessories specifically
    if (category === "accessories") {
      console.log("🔍 useEffect triggered for accessories")
    }
    
    loadCategoryData()
    
    // Load dependencies immediately for categories that need them for filtering
    if (category === 'sub-departments' && departments.length === 0) {
      loadSpecificDependencies(['departments'])
    } else if (category === 'items' && itemCategories.length === 0) {
      loadSpecificDependencies(['item-categories'])
    } else if (category === 'projects' && (costCenters.length === 0 || companies.length === 0 || nationalities.length === 0)) {
      loadSpecificDependencies(['cost-centers', 'companies', 'nationalities'])
    }
  }, [category])

  // Load dependencies on-demand for forms only
  const loadDependenciesForForm = async () => {
    if (category === 'sub-departments' && departments.length === 0) {
      await loadSpecificDependencies(['departments'])
    } else if (category === 'items' && itemCategories.length === 0) {
      await loadSpecificDependencies(['item-categories'])
    } else if (category === 'projects' && (costCenters.length === 0 || companies.length === 0 || nationalities.length === 0)) {
      await loadSpecificDependencies(['cost-centers', 'companies', 'nationalities'])
    }
  }

  // Test function to diagnose database connectivity
  const testDatabaseConnection = async () => {
    console.log(`🔍 Testing database connection...`)
    try {
      const { data, error } = await supabase
        .from('employee_positions')
        .select('count')
        .limit(1)
      
      if (error) {
        console.error(`❌ Database test failed:`, error)
        return false
      }
      
      return true
    } catch (err) {
      console.error(`❌ Database test error:`, err)
      return false
    }
  }

  // Make test function available globally for debugging
  if (typeof window !== 'undefined') {
    (window as any).testDatabaseConnection = testDatabaseConnection
  }

  const handleAdd = async (item: any): Promise<void> => {
    console.log(`handleAdd called for category: ${category}`, item)
    console.log(`handleAdd function started at:`, new Date().toISOString())
    try {
      const tableName = tableMapping[category as keyof typeof tableMapping]
      console.log(`Using table: ${tableName}`)
      
      // Check if Supabase is configured
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        console.error("❌ Supabase not configured - creating mock item for UI")
        const mockItem = {
          id: `mock_${Date.now()}`,
          name: item.name || "",
          description: item.description || "",
          status: (item.status || "active") as "active" | "inactive",
          createdAt: new Date().toISOString().split('T')[0]
        }
        setData(prevData => [...prevData, mockItem])
        console.warn("⚠️ Database not configured. Item added to UI only. Please configure Supabase to persist data.")
        
        // No need to reload data since database is not configured
        return
      }
      
      // Skip connection test and go directly to insert
      console.log(`Proceeding directly to insert operation...`)
      
      // Test Supabase connection
      console.log(`Testing Supabase connection...`)
      try {
        const { data: testData, error: testError } = await supabase
          .from(tableName)
          .select('id')
          .limit(1)
        console.log(`Supabase connection test result:`, testData, `error:`, testError)
        
        if (testError) {
          console.error(`Table ${tableName} might not exist or have wrong schema:`, testError)
          throw new Error(`Database table error: ${testError.message}`)
        }
      } catch (testErr) {
        console.error(`Supabase connection test failed:`, testErr)
        throw testErr
      }
      
      // For cost centers, companies, and projects, check if the code is unique before adding
      if ((category === "cost-centers" || category === "companies" || category === "projects") && item.code && item.code.trim()) {
        console.log(`Checking for existing code: ${item.code.trim()}`)
        const { data: existingWithCode, error: validationError } = await supabase
          .from(tableName)
          .select("id, code")
          .eq("code", item.code.trim())
        
        console.log(`Validation query result:`, existingWithCode, `error:`, validationError)
        
        if (validationError) {
          console.error(`Validation query error:`, validationError)
          throw new Error(`Failed to validate code uniqueness: ${validationError.message}`)
        }
        
        if (existingWithCode && existingWithCode.length > 0) {
          const errorMessage = `${category === "cost-centers" ? "Cost center" : category === "companies" ? "Company" : "Project"} code "${item.code}" already exists. Please use a unique code.`
          console.error(errorMessage)
          throw new Error(errorMessage)
        }
        console.log(`Code validation passed for: ${item.code.trim()}`)
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
      
      console.log(`Payload for ${category}:`, payload)

      // Skip table access test and go directly to insert
      console.log(`Attempting database insert for ${category}...`)
      
      // Direct insert with timeout and error handling
      let newItem, error
      try {
        // Attempt actual database insert with timeout
        console.log(`Creating insert promise for table: ${tableName}`)
        
        // Create a timeout promise
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error('Database operation timed out after 15 seconds'))
          }, 15000)
        })
        
        // Create the insert promise
        const insertPromise = supabase
          .from(tableName)
          .insert(payload)
          .select()
          .single()
        
        // Race between insert and timeout
        const result = await Promise.race([insertPromise, timeoutPromise]) as any
        
        console.log(`Insert operation completed, result:`, result)
        
        newItem = result.data
        error = result.error
        
      } catch (insertError) {
        console.error(`Supabase insert threw an error:`, insertError)
        error = insertError
        newItem = null
      }


      if (error) {
        console.error(`Error adding ${category}:`, error)
        console.error(`Error details:`, {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        
        // Handle unique constraint violations
        if (error.code === '23505') { // Unique constraint violation
          if (error.message.includes('unique_cost_center_code')) {
            throw new Error(`Cost center code "${item.code}" already exists. Please use a unique code.`)
          } else if (error.message.includes('unique_company_code')) {
            throw new Error(`Company code "${item.code}" already exists. Please use a unique code.`)
          } else if (error.message.includes('unique_project_code')) {
            throw new Error(`Project code "${item.code}" already exists. Please use a unique code.`)
          } else {
            throw new Error(`A record with this code already exists. Please use a unique code.`)
          }
        }
        
        // If it's a timeout error, create a mock item for UI update
        if (error.message.includes('timed out')) {
          console.log(`Database timeout detected, creating mock item for UI update`)
          const mockItem = {
            id: payload.id,
            name: payload.name || "",
            description: payload.description || "",
            status: (payload.status || "active") as "active" | "inactive",
            createdAt: payload.created_at ? new Date(payload.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
          }
          
          console.log(`Created mock item for timeout:`, mockItem)
          
          // Update the data state with mock item
          setData(prevData => [...prevData, mockItem])
          console.log(`Data updated with mock item due to timeout`)
          
          // Try to reload data from database to get the actual saved item
          console.log(`Attempting to reload data from database after timeout...`)
          try {
            await loadCategoryData()
          } catch (reloadError) {
            console.warn(`Failed to reload data after timeout:`, reloadError)
          }
          
          // Show a user-friendly message about the database issue
          console.warn(`⚠️ Database timeout detected. Item added to UI but may not be saved to database.`)
          console.warn(`Please check your Supabase configuration and network connection.`)
          console.warn(`To configure Supabase, create a .env.local file with your credentials.`)
          return
        }
        
        throw error
      }

      if (!newItem) {
        console.log(`No data returned from insert, creating mock item for UI update`)
        const mockItem = {
          id: payload.id,
          name: payload.name || "",
          description: payload.description || "",
          status: (payload.status || "active") as "active" | "inactive",
          createdAt: payload.created_at ? new Date(payload.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
        }
        
        console.log(`Created mock item:`, mockItem)
        
        // Update the data state with mock item
        setData(prevData => [...prevData, mockItem])
        console.log(`Data updated with mock item`)
        
        // Try to reload data from database to get the actual saved item
        console.log(`Attempting to reload data from database after no data returned...`)
        try {
          await loadCategoryData()
        } catch (reloadError) {
          console.warn(`Failed to reload data after no data returned:`, reloadError)
        }
        return
      }

      console.log(`Successfully inserted item:`, newItem)
      console.log(`Inserted item code field:`, newItem?.code)

      const formattedItem = {
        id: newItem.id || payload.id,
        name: newItem.name || payload.name || "",
        description: newItem.description || payload.description || "",
        status: (newItem.status || payload.status || "active") as "active" | "inactive",
        createdAt: newItem.created_at ? new Date(newItem.created_at).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
        ...(category === "sub-departments" && {
          departmentId: newItem.department_id,
          departmentName: departments.find(d => d.id === newItem.department_id)?.name || "",
        }),
        ...(category === "items" && {
          itemCategoryId: newItem.item_category_id,
          itemCategoryName: itemCategories.find(c => c.id === newItem.item_category_id)?.name || "",
        }),
        ...(category === "cost-centers" && {
          code: newItem.code,
        }),
        ...(category === "companies" && {
          code: newItem.code,
        }),
        ...(category === "projects" && {
          code: newItem.code,
          costCenterId: newItem.cost_center_id,
          costCenterName: costCenters.find(cc => cc.id === newItem.cost_center_id)?.name || "",
          companyId: newItem.company_id,
          companyName: companies.find(c => c.id === newItem.company_id)?.name || "",
          nationalityId: newItem.nationality_id,
          nationalityName: nationalities.find(n => n.id === newItem.nationality_id)?.name || "",
        })
      }

      console.log(`Formatted item:`, formattedItem)
      setData(prev => [formattedItem, ...prev])
      console.log(`Data updated successfully`)
      
      // Reload data from database to ensure consistency
      console.log(`Reloading data from database after successful add...`)
      await loadCategoryData()
      
      console.log(`handleAdd function completed successfully at:`, new Date().toISOString())
    } catch (error) {
      console.error(`Error adding ${category}:`, error)
      console.log(`handleAdd function failed at:`, new Date().toISOString())
      throw error
    }
  }

  const handleEdit = async (id: string, item: any): Promise<void> => {
    try {
      const tableName = tableMapping[category as keyof typeof tableMapping]
      
      // For cost centers, check if the code is unique before updating
      if (category === "cost-centers" && item.code && item.code.trim()) {
        const { data: existingWithCode } = await supabase
          .from(tableName)
          .select("id, code")
          .eq("code", item.code.trim())
          .neq("id", id) // Exclude the current record being updated
        
        if (existingWithCode && existingWithCode.length > 0) {
          throw new Error(`Cost center code "${item.code}" already exists. Please use a unique code.`)
        }
      }
      
      // For companies, check if the code is unique before updating
      if (category === "companies" && item.code && item.code.trim()) {
        const { data: existingWithCode } = await supabase
          .from(tableName)
          .select("id, code")
          .eq("code", item.code.trim())
          .neq("id", id) // Exclude the current record being updated
        
        if (existingWithCode && existingWithCode.length > 0) {
          throw new Error(`Company code "${item.code}" already exists. Please use a unique code.`)
        }
      }
      
      // For projects, check if the code is unique before updating
      if (category === "projects" && item.code && item.code.trim()) {
        const { data: existingWithCode } = await supabase
          .from(tableName)
          .select("id, code")
          .eq("code", item.code.trim())
          .neq("id", id) // Exclude the current record being updated
        
        if (existingWithCode && existingWithCode.length > 0) {
          throw new Error(`Project code "${item.code}" already exists. Please use a unique code.`)
        }
      }
      
      const payload = {
        name: item.name,
        description: item.description || "",
        status: item.status,
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

      const { error } = await supabase
        .from(tableName)
        .update(payload)
        .eq("id", id)

      if (error) {
        console.error(`Error updating ${category}:`, error)
        // Provide more specific error messages for common constraint violations
        if (error.code === '23505') { // Unique constraint violation
          if (error.message.includes('unique_cost_center_code')) {
            throw new Error(`Cost center code "${item.code}" already exists. Please use a unique code.`)
          } else if (error.message.includes('unique_company_code')) {
            throw new Error(`Company code "${item.code}" already exists. Please use a unique code.`)
          } else if (error.message.includes('unique_project_code')) {
            throw new Error(`Project code "${item.code}" already exists. Please use a unique code.`)
          } else {
            throw new Error(`A record with this code already exists. Please use a unique code.`)
          }
        }
        throw error
      }

      setData(prev => prev.map((existing) =>
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
      ))
      
      // Reload data from database to ensure consistency
      console.log(`Reloading data from database after successful edit...`)
      await loadCategoryData()
    } catch (error) {
      console.error(`Error updating ${category}:`, error)
      throw error
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const tableName = tableMapping[category as keyof typeof tableMapping]
      
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq("id", id)

      if (error) {
        console.error(`Error deleting ${category}:`, error)
        return
      }

      setData(prev => prev.filter((item) => item.id !== id))
      
      // Reload data from database to ensure consistency
      console.log(`Reloading data from database after successful delete...`)
      await loadCategoryData()
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
      const { error } = await supabase
        .from("sim_card_plans")
        .delete()
        .eq("id", id)

      if (error) {
        console.error("Error deleting SIM card plan:", error)
        alert("Failed to delete SIM card plan. Please try again.")
        return
      }

      setSimCardPlans((prev) => prev.filter((plan) => plan.id !== id))
      setData(prev => prev.filter((item) => item.id !== id))
    } catch (error) {
      console.error("Error deleting SIM card plan:", error)
      alert("Failed to delete SIM card plan. Please try again.")
    }
  }

  const handleSimCardPlanSubmit = async (planData: any) => {
    try {
      if (editingSimCardPlan) {
        // Update existing plan
        const { error } = await supabase
          .from("sim_card_plans")
          .update({
            name: planData.name,
            description: planData.description,
            data_limit: planData.data_limit,
            monthly_fee: planData.monthly_fee,
            provider_id: planData.provider_id,
            is_active: planData.is_active,
          })
          .eq("id", editingSimCardPlan.id)

        if (error) {
          console.error("Error updating SIM card plan:", error)
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
        setData(prev => prev.map((item) =>
          item.id === editingSimCardPlan.id
            ? { ...item, ...planData, status: (planData.is_active ? "active" : "inactive") as "active" | "inactive" }
            : item
        ))
      } else {
        // Add new plan
        const { data, error } = await supabase
          .from("sim_card_plans")
          .insert({
            id: `SCP${Date.now()}`,
            name: planData.name,
            description: planData.description,
            data_limit: planData.data_limit,
            monthly_fee: planData.monthly_fee,
            provider_id: planData.provider_id,
            is_active: planData.is_active,
            created_at: new Date().toISOString(),
          })
          .select()
          .single()

        if (error) {
          console.error("Error adding SIM card plan:", error)
          alert("Failed to add SIM card plan. Please try again.")
          return
        }

        // Add to local state with provider name
        const { data: providerData } = await supabase
          .from("sim_providers")
          .select("name")
          .eq("id", planData.provider_id)
          .single()

        const newPlan = {
          ...data,
          provider_name: providerData?.name || "Unknown Provider",
          status: (data.is_active ? "active" : "inactive") as "active" | "inactive",
          createdAt: new Date(data.created_at).toISOString().split("T")[0],
        }

        setSimCardPlans((prev) => [newPlan, ...prev])
        setData(prev => [newPlan, ...prev])
      }

      setShowSimCardPlanForm(false)
      setEditingSimCardPlan(undefined)
    } catch (error) {
      console.error("Error submitting SIM card plan:", error)
      alert("Failed to save SIM card plan. Please try again.")
    }
  }

  // Check if Supabase is configured
  const isSupabaseConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading {categoryTitles[category as keyof typeof categoryTitles]}...</div>
      </div>
    )
  }

  // Show database configuration warning
  if (!isSupabaseConfigured) {
    return (
      <div className="space-y-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Database Not Configured
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>Supabase is not configured. Data will be stored locally only and will not persist between sessions.</p>
                <p className="mt-1">To enable database persistence, please configure your Supabase credentials. See <code className="bg-yellow-100 px-1 rounded">DATABASE_SETUP.md</code> for instructions.</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Render the normal content */}
        {category === "sub-departments" ? (
          <SubDepartmentTable
            data={data as SubDepartmentItem[]}
            departments={departments}
            onAdd={(item) => handleAdd(item)}
            onEdit={(id, item) => handleEdit(id, item)}
            onDelete={(id) => handleDelete(id)}
            onLoadDependencies={loadDependenciesForForm}
          />
        ) : category === "items" ? (
          <ItemsTable
            data={data as Item[]}
            itemCategories={itemCategories}
            onAdd={(item) => handleAdd(item)}
            onEdit={(id, item) => handleEdit(id, item)}
            onDelete={(id) => handleDelete(id)}
          />
        ) : category === "cost-centers" ? (
          <CostCenterTable
            data={data as CostCenterItem[]}
            onAdd={(item) => handleAdd(item)}
            onEdit={(id, item) => handleEdit(id, item)}
            onDelete={(id) => handleDelete(id)}
          />
        ) : category === "companies" ? (
          <CompanyTable
            data={data as CompanyItem[]}
            onAdd={(item) => handleAdd(item)}
            onEdit={(id, item) => handleEdit(id, item)}
            onDelete={(id) => handleDelete(id)}
          />
        ) : category === "projects" ? (
          <ProjectTable
            data={data as ProjectItem[]}
            costCenters={costCenters}
            companies={companies}
            nationalities={nationalities}
            onAdd={(item) => handleAdd(item)}
            onEdit={(id, item) => handleEdit(id, item)}
            onDelete={(id) => handleDelete(id)}
          />
        ) : category === "sim-card-plans" ? (
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
          <>
            {/* Add debugging for accessories */}
            {category === "accessories" && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-sm text-blue-800">
                  <strong>Debug Info:</strong> Data length: {data?.length || 0}, Loading: {loading ? 'Yes' : 'No'}
                  <button 
                    onClick={() => {
                      console.log('🔄 Manual refresh triggered for accessories')
                      loadCategoryData()
                    }}
                    className="ml-4 px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                  >
                    Refresh
                  </button>
                </div>
              </div>
            )}
            <MasterDataTable
              title={categoryTitles[category as keyof typeof categoryTitles]}
              data={data as MasterDataItem[]}
              onAdd={(item) => handleAdd(item)}
              onEdit={(id, item) => handleEdit(id, item)}
              onDelete={(id) => handleDelete(id)}
            />
          </>
        )}
      </div>
    )
  }

  return (
    <>
      {category === "sub-departments" ? (
        <SubDepartmentTable
          data={data as SubDepartmentItem[]}
          departments={departments}
          onAdd={(item) => handleAdd(item)}
          onEdit={(id, item) => handleEdit(id, item)}
          onDelete={(id) => handleDelete(id)}
          onLoadDependencies={loadDependenciesForForm}
        />
      ) : category === "items" ? (
        <ItemsTable
          data={data as Item[]}
          itemCategories={itemCategories}
          onAdd={(item) => handleAdd(item)}
          onEdit={(id, item) => handleEdit(id, item)}
          onDelete={(id) => handleDelete(id)}
        />
      ) : category === "cost-centers" ? (
        <CostCenterTable
          data={data as CostCenterItem[]}
          onAdd={(item) => handleAdd(item)}
          onEdit={(id, item) => handleEdit(id, item)}
          onDelete={(id) => handleDelete(id)}
        />
      ) : category === "companies" ? (
        <CompanyTable
          data={data as CompanyItem[]}
          onAdd={(item) => handleAdd(item)}
          onEdit={(id, item) => handleEdit(id, item)}
          onDelete={(id) => handleDelete(id)}
        />
      ) : category === "projects" ? (
        <ProjectTable
          data={data as ProjectItem[]}
          costCenters={costCenters}
          companies={companies}
          nationalities={nationalities}
          onAdd={(item) => handleAdd(item)}
          onEdit={(id, item) => handleEdit(id, item)}
          onDelete={(id) => handleDelete(id)}
        />
      ) : category === "sim-card-plans" ? (
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
          <>
            {/* Add debugging for accessories */}
            {category === "accessories" && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-sm text-blue-800">
                  <strong>Debug Info:</strong> Data length: {data?.length || 0}, Loading: {loading ? 'Yes' : 'No'}
                  <button 
                    onClick={() => {
                      console.log('🔄 Manual refresh triggered for accessories')
                      loadCategoryData()
                    }}
                    className="ml-4 px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                  >
                    Refresh
                  </button>
                </div>
              </div>
            )}
            <MasterDataTable
              title={categoryTitles[category as keyof typeof categoryTitles]}
              data={data as MasterDataItem[]}
              onAdd={(item) => handleAdd(item)}
              onEdit={(id, item) => handleEdit(id, item)}
              onDelete={(id) => handleDelete(id)}
            />
          </>
        )}
    </>
  )
}
