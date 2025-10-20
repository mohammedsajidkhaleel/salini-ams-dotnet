import { apiClient } from "./apiClient"

export interface MasterDataItem {
  id: string
  name: string
  description?: string
  status?: string
}

export interface BulkMasterDataResult {
  success: number
  errors: number
  created: MasterDataItem[]
  errorMessages: string[]
}

export interface BulkCreateMasterDataRequest {
  Companies?: Array<{ Name: string; Description?: string }>
  Departments?: Array<{ Name: string; Description?: string }>
  Projects?: Array<{ Name: string; Code?: string; Description?: string }>
  CostCenters?: Array<{ Name: string; Code?: string; Description?: string }>
  Nationalities?: Array<{ Name: string; Description?: string }>
  EmployeeCategories?: Array<{ Name: string; Description?: string }>
  EmployeePositions?: Array<{ Name: string; Description?: string }>
  ItemCategories?: Array<{ Name: string; Description?: string }>
  Items?: Array<{ Name: string; Description?: string; CategoryId?: string }>
  Suppliers?: Array<{ Name: string; Description?: string }>
  SimProviders?: Array<{ Name: string; Description?: string }>
  SimTypes?: Array<{ Name: string; Description?: string }>
  SimCardPlans?: Array<{ Name: string; Description?: string; ProviderId?: string }>
}

export class MasterDataService {
  /**
   * Bulk create departments
   */
  static async bulkCreateDepartments(departments: string[]): Promise<BulkMasterDataResult> {
    const result: BulkMasterDataResult = {
      success: 0,
      errors: 0,
      created: [],
      errorMessages: []
    }

    if (departments.length === 0) return result

    try {
      const request: BulkCreateMasterDataRequest = {
        Departments: departments
          .filter(name => name && name.trim())
          .map(name => ({
            Name: name.trim(),
            Description: 'Auto-created from import'
          }))
      }

      const response = await apiClient.post('/api/MasterData/bulk-create', request)
      
      if (response.data) {
        result.success = departments.length
        result.created = departments.map(name => ({
          id: `DEPT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: name.trim(),
          description: 'Auto-created from import',
          status: 'active'
        }))
      }

      return result
    } catch (error) {
      result.errors = departments.length
      result.errorMessages.push(`Error creating departments: ${error}`)
      return result
    }
  }

  /**
   * Bulk create sub-departments
   */
  static async bulkCreateSubDepartments(subDepartments: Array<{ name: string; department_id: string }>): Promise<BulkMasterDataResult> {
    const result: BulkMasterDataResult = {
      success: 0,
      errors: 0,
      created: [],
      errorMessages: []
    }

    if (subDepartments.length === 0) return result

    try {
      // For now, we'll create them individually since there's no bulk sub-department endpoint
      const promises = subDepartments.map(async (subDept) => {
        try {
          await apiClient.post('/api/SubDepartments', {
            Name: subDept.name,
            DepartmentId: subDept.department_id,
            Description: 'Auto-created from import'
          })
          return { success: true, name: subDept.name }
        } catch (error) {
          return { success: false, name: subDept.name, error }
        }
      })

      const results = await Promise.all(promises)
      const successful = results.filter(r => r.success)
      const failed = results.filter(r => !r.success)

      result.success = successful.length
      result.errors = failed.length
      result.created = successful.map(r => ({
        id: `SUBDEPT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: r.name,
        description: 'Auto-created from import',
        status: 'active'
      }))
      result.errorMessages = failed.map(r => `Failed to create ${r.name}: ${r.error}`)

      return result
    } catch (error) {
      result.errors = subDepartments.length
      result.errorMessages.push(`Error creating sub-departments: ${error}`)
      return result
    }
  }

  /**
   * Bulk create employee positions
   */
  static async bulkCreatePositions(positions: string[]): Promise<BulkMasterDataResult> {
    const result: BulkMasterDataResult = {
      success: 0,
      errors: 0,
      created: [],
      errorMessages: []
    }

    if (positions.length === 0) return result

    try {
      const request: BulkCreateMasterDataRequest = {
        EmployeePositions: positions
          .filter(name => name && name.trim())
          .map(name => ({
            Name: name.trim(),
            Description: 'Auto-created from import'
          }))
      }

      const response = await apiClient.post('/api/MasterData/bulk-create', request)
      
      if (response.data) {
        result.success = positions.length
        result.created = positions.map(name => ({
          id: `POS_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: name.trim(),
          description: 'Auto-created from import',
          status: 'active'
        }))
      }

      return result
    } catch (error) {
      result.errors = positions.length
      result.errorMessages.push(`Error creating positions: ${error}`)
      return result
    }
  }

  /**
   * Bulk create employee categories
   */
  static async bulkCreateCategories(categories: string[]): Promise<BulkMasterDataResult> {
    const result: BulkMasterDataResult = {
      success: 0,
      errors: 0,
      created: [],
      errorMessages: []
    }

    if (categories.length === 0) return result

    try {
      const request: BulkCreateMasterDataRequest = {
        EmployeeCategories: categories
          .filter(name => name && name.trim())
          .map(name => ({
            Name: name.trim(),
            Description: 'Auto-created from import'
          }))
      }

      const response = await apiClient.post('/api/MasterData/bulk-create', request)
      
      if (response.data) {
        result.success = categories.length
        result.created = categories.map(name => ({
          id: `CAT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: name.trim(),
          description: 'Auto-created from import',
          status: 'active'
        }))
      }

      return result
    } catch (error) {
      result.errors = categories.length
      result.errorMessages.push(`Error creating categories: ${error}`)
      return result
    }
  }

  /**
   * Bulk create nationalities
   */
  static async bulkCreateNationalities(nationalities: string[]): Promise<BulkMasterDataResult> {
    const result: BulkMasterDataResult = {
      success: 0,
      errors: 0,
      created: [],
      errorMessages: []
    }

    if (nationalities.length === 0) return result

    try {
      const request: BulkCreateMasterDataRequest = {
        Nationalities: nationalities
          .filter(name => name && name.trim())
          .map(name => ({
            Name: name.trim(),
            Description: 'Auto-created from import'
          }))
      }

      const response = await apiClient.post('/api/MasterData/bulk-create', request)
      
      if (response.data) {
        result.success = nationalities.length
        result.created = nationalities.map(name => ({
          id: `NAT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: name.trim(),
          description: 'Auto-created from import',
          status: 'active'
        }))
      }

      return result
    } catch (error) {
      result.errors = nationalities.length
      result.errorMessages.push(`Error creating nationalities: ${error}`)
      return result
    }
  }

  /**
   * Bulk create companies
   */
  static async bulkCreateCompanies(companies: string[]): Promise<BulkMasterDataResult> {
    const result: BulkMasterDataResult = {
      success: 0,
      errors: 0,
      created: [],
      errorMessages: []
    }

    if (companies.length === 0) return result

    try {
      const request: BulkCreateMasterDataRequest = {
        Companies: companies
          .filter(name => name && name.trim())
          .map(name => ({
            Name: name.trim(),
            Description: 'Auto-created from import'
          }))
      }

      const response = await apiClient.post('/api/MasterData/bulk-create', request)
      
      if (response.data) {
        result.success = companies.length
        result.created = companies.map(name => ({
          id: `COMP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: name.trim(),
          description: 'Auto-created from import',
          status: 'active'
        }))
      }

      return result
    } catch (error) {
      result.errors = companies.length
      result.errorMessages.push(`Error creating companies: ${error}`)
      return result
    }
  }

  /**
   * Bulk create projects
   */
  static async bulkCreateProjects(projects: string[]): Promise<BulkMasterDataResult> {
    const result: BulkMasterDataResult = {
      success: 0,
      errors: 0,
      created: [],
      errorMessages: []
    }

    if (projects.length === 0) return result

    try {
      const request: BulkCreateMasterDataRequest = {
        Projects: projects
          .filter(name => name && name.trim())
          .map(name => ({
            Name: name.trim(),
            Code: name.trim().toUpperCase().replace(/\s+/g, '_'),
            Description: 'Auto-created from import'
          }))
      }

      const response = await apiClient.post('/api/MasterData/bulk-create', request)
      
      if (response.data) {
        result.success = projects.length
        result.created = projects.map(name => ({
          id: `PROJ_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: name.trim(),
          description: 'Auto-created from import',
          status: 'active'
        }))
      }

      return result
    } catch (error) {
      result.errors = projects.length
      result.errorMessages.push(`Error creating projects: ${error}`)
      return result
    }
  }

  /**
   * Bulk create cost centers
   */
  static async bulkCreateCostCenters(costCenters: string[]): Promise<BulkMasterDataResult> {
    const result: BulkMasterDataResult = {
      success: 0,
      errors: 0,
      created: [],
      errorMessages: []
    }

    if (costCenters.length === 0) return result

    try {
      const request: BulkCreateMasterDataRequest = {
        CostCenters: costCenters
          .filter(name => name && name.trim())
          .map(name => ({
            Name: name.trim(),
            Code: name.trim().toUpperCase().replace(/\s+/g, '_'),
            Description: 'Auto-created from import'
          }))
      }

      const response = await apiClient.post('/api/MasterData/bulk-create', request)
      
      if (response.data) {
        result.success = costCenters.length
        result.created = costCenters.map(name => ({
          id: `CC_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: name.trim(),
          description: 'Auto-created from import',
          status: 'active'
        }))
      }

      return result
    } catch (error) {
      result.errors = costCenters.length
      result.errorMessages.push(`Error creating cost centers: ${error}`)
      return result
    }
  }
}

// Create singleton instance
export const masterDataService = new MasterDataService();