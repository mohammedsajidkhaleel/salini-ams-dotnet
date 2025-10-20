import { apiClient, type PaginatedResponse } from '../apiClient';

// Backend CompanyListDto interface (matches the API response)
export interface CompanyListItem {
  id: string;
  name: string;
  description?: string;
  status: number; // 0 = inactive, 1 = active
  projectCount: number;
  employeeCount: number;
}

// Legacy Company interface for backward compatibility
export interface Company {
  id: string
  name: string
  description?: string
  status: "active" | "inactive"
  createdAt: string
}

export interface BulkCreateResult {
  success: number
  errors: number
  created: Company[]
  errorMessages: string[]
}

export class CompanyService {
  /**
   * Get all companies
   */
  static async getAll(): Promise<Company[]> {
    try {
      // Use the real API endpoint
      const response = await apiClient.get<PaginatedResponse<CompanyListItem>>('/api/Companies', {
        pageNumber: 1,
        pageSize: 1000, // Get all companies
        sortBy: 'name',
        sortDescending: false
      });

      // Convert CompanyListItem to legacy Company format for backward compatibility
      const companies: Company[] = (response.data?.items || []).map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        status: item.status === 1 ? "active" : "inactive",
        createdAt: new Date().toISOString().split("T")[0]
      }));

      return companies;
    } catch (error) {
      console.error('Error in CompanyService.getAll:', error)
      // Fallback to empty array if API fails
      return []
    }
  }

  /**
   * Create a new company
   */
  static async create(company: Omit<Company, 'id' | 'createdAt'>): Promise<Company> {
    try {
      const response = await apiClient.post<CompanyListItem>('/api/Companies', {
        name: company.name,
        description: company.description,
        status: company.status === "active" ? 1 : 0
      });
      
      // Convert the response to the legacy Company format
      const createdCompany: Company = {
        id: response.data!.id,
        name: response.data!.name,
        description: response.data!.description,
        status: response.data!.status === 1 ? "active" : "inactive",
        createdAt: new Date().toISOString().split("T")[0]
      };
      
      return createdCompany;
    } catch (error) {
      console.error('Error in CompanyService.create:', error)
      throw error
    }
  }

  /**
   * Update a company
   */
  static async update(id: string, company: Partial<Omit<Company, 'id' | 'createdAt'>>): Promise<void> {
    try {
      await apiClient.put(`/api/Companies/${id}`, {
        id: id,
        name: company.name,
        description: company.description,
        status: company.status === "active" ? 1 : 0
      });
    } catch (error) {
      console.error('Error in CompanyService.update:', error)
      throw error
    }
  }

  /**
   * Delete a company
   */
  static async delete(id: string): Promise<void> {
    try {
      await apiClient.delete(`/api/Companies/${id}`);
    } catch (error) {
      console.error('Error in CompanyService.delete:', error)
      throw error
    }
  }

  /**
   * Bulk create companies
   */
  static async bulkCreate(companies: string[]): Promise<BulkCreateResult> {
    const result: BulkCreateResult = {
      success: 0,
      errors: 0,
      created: [],
      errorMessages: []
    }

    if (companies.length === 0) return result

    try {
      // TODO: Replace with new API implementation
      console.log('CompanyService.bulkCreate called (mock implementation):', companies)
      
      const validCompanies = companies.filter(name => name && name.trim())
      result.success = validCompanies.length
      result.created = validCompanies.map(name => ({
        id: `COMP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        code: "",
        name: name.trim(),
        description: `Auto-created from import`,
        status: 'active' as const,
        createdAt: new Date().toISOString().split("T")[0]
      }))

      return result
    } catch (error) {
      result.errors = companies.length
      result.errorMessages.push(`Error creating companies: ${error}`)
      return result
    }
  }
}

// Create singleton instance
export const companyService = new CompanyService();