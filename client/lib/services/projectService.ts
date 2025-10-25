import { apiClient, type PaginatedResponse } from '../apiClient';
import { apiDeduplicator } from '../apiDeduplicator';

// Backend ProjectListDto interface (matches the API response)
export interface ProjectListItem {
  id: string;
  code: string;
  name: string;
  description?: string;
  status: number; // 0 = inactive, 1 = active
  companyName?: string;
  costCenterName?: string;
  nationalityName?: string;
  employeeCount: number;
}

// Legacy Project interface for backward compatibility
export interface Project {
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
}

export interface BulkCreateResult {
  success: number
  errors: number
  created: Project[]
  errorMessages: string[]
}

export class ProjectService {
  /**
   * Get all projects with related data
   */
  static async getAll(): Promise<Project[]> {
    try {
      // Use deduplicator to prevent duplicate calls
      const key = apiDeduplicator.generateKey('getAllProjects');
      const response = await apiDeduplicator.execute(key, async () => {
        return await apiClient.get<PaginatedResponse<ProjectListItem>>('/api/Projects', {
          pageNumber: 1,
          pageSize: 100, // Get all projects
          sortBy: 'name',
          sortDescending: false
        });
      });

      // Convert ProjectListItem to legacy Project format for backward compatibility
      const projects: Project[] = (response.data?.items || []).map(item => ({
        id: item.id,
        code: item.code,
        name: item.name,
        description: item.description,
        status: item.status === 1 ? "active" : "inactive",
        costCenterId: undefined,
        costCenterName: item.costCenterName || "",
        companyId: undefined,
        companyName: item.companyName || "",
        nationalityId: undefined,
        nationalityName: item.nationalityName || "",
        createdAt: new Date().toISOString().split("T")[0]
      }));

      return projects;
    } catch (error) {
      console.error('Error in ProjectService.getAll:', error)
      // Fallback to empty array if API fails
      return []
    }
  }

  /**
   * Get a project by ID
   */
  static async getById(id: string): Promise<Project> {
    try {
      // Note: This returns mock data - implement proper API call when needed
      console.log('ProjectService.getById called (mock implementation)')
      
      // Mock data for development
      const mockProject: Project = {
        id: id,
        code: 'PROJ-001',
        name: 'Sample Project',
        description: 'A sample project for testing',
        status: 'active',
        costCenterId: 'CC_001',
        costCenterName: 'Sample Cost Center',
        companyId: 'COMP_001',
        companyName: 'Sample Company',
        nationalityId: 'NAT_001',
        nationalityName: 'Sample Nationality',
        createdAt: new Date().toISOString().split("T")[0]
      }
      
      return mockProject
    } catch (error) {
      console.error('Error in ProjectService.getById:', error)
      throw error
    }
  }

  /**
   * Create a new project
   */
  static async create(project: Omit<Project, 'id' | 'createdAt' | 'costCenterName' | 'companyName' | 'nationalityName'>): Promise<Project> {
    try {
      console.log("🔧 ProjectService.create called with:", project)
      
      // Convert frontend Project format to backend ProjectCreateDto format
      const createDto = {
        code: project.code,
        name: project.name,
        description: project.description,
        status: project.status === "active" ? 1 : 0, // Convert string to number
        companyId: project.companyId || "",
        costCenterId: project.costCenterId || null, // Send null for empty values
        nationalityId: project.nationalityId || null // Send null for empty values
      }
      
      console.log("📤 Sending create request to API:", createDto)
      
      const response = await apiClient.post('/api/Projects', createDto)
      console.log("📥 API response:", response.data)
      
      // Convert backend ProjectDto to frontend Project format
      const newProject: Project = {
        id: response.data.id,
        code: response.data.code,
        name: response.data.name,
        description: response.data.description,
        status: response.data.status === 1 ? "active" : "inactive", // Convert number to string
        costCenterId: project.costCenterId,
        costCenterName: "", // Will be populated by the calling code
        companyId: response.data.companyId,
        companyName: response.data.companyName || "",
        nationalityId: project.nationalityId,
        nationalityName: "", // Will be populated by the calling code
        createdAt: new Date().toISOString().split("T")[0]
      }
      
      console.log('✅ ProjectService.create completed successfully')
      return newProject
    } catch (error) {
      console.error('❌ Error in ProjectService.create:', error)
      throw error
    }
  }

  /**
   * Update a project
   */
  static async update(id: string, project: Partial<Omit<Project, 'id' | 'createdAt' | 'costCenterName' | 'companyName' | 'nationalityName'>>): Promise<void> {
    try {
      console.log('🔧 ProjectService.update called with:', id, project)
      
      // Convert frontend Project format to backend ProjectUpdateDto format
      const updateDto = {
        id: id,
        code: project.code || "",
        name: project.name || "",
        description: project.description,
        status: project.status === "active" ? 1 : 0, // Convert string to number
        companyId: project.companyId || "",
        costCenterId: project.costCenterId || null, // Send null for empty values
        nationalityId: project.nationalityId || null // Send null for empty values
      }
      
      console.log("📤 Sending update request to API:", updateDto)
      
      const response = await apiClient.put(`/api/Projects/${id}`, updateDto)
      console.log("📥 API response:", response.data)
      
      console.log('✅ ProjectService.update completed successfully')
    } catch (error) {
      console.error('❌ Error in ProjectService.update:', error)
      throw error
    }
  }

  /**
   * Delete a project
   */
  static async delete(id: string): Promise<void> {
    try {
      await apiClient.delete(`/api/Projects/${id}`);
    } catch (error) {
      console.error('Error in ProjectService.delete:', error)
      throw error
    }
  }

  /**
   * Bulk create projects
   */
  static async bulkCreate(projects: string[]): Promise<BulkCreateResult> {
    const result: BulkCreateResult = {
      success: 0,
      errors: 0,
      created: [],
      errorMessages: []
    }

    if (projects.length === 0) return result

    try {
      // Note: Bulk create operation is not yet available in the API
      console.log('ProjectService.bulkCreate called (mock implementation)')
      
      // Mock implementation - create mock projects
      const newProjects = projects
        .filter(name => name && name.trim())
        .map(name => ({
          id: `PROJ_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          code: "",
          name: name.trim(),
          description: "Auto-created from import",
          status: "active" as const,
          costCenterId: undefined,
          costCenterName: "",
          companyId: undefined,
          companyName: "",
          nationalityId: undefined,
          nationalityName: "",
          createdAt: new Date().toISOString().split("T")[0]
        }))

      result.success = newProjects.length
      result.created = newProjects
      
      console.log(`Mock: Created ${newProjects.length} projects`)
      return result
    } catch (error) {
      result.errors = projects.length
      result.errorMessages.push(`Error creating projects: ${error}`)
      return result
    }
  }
}
