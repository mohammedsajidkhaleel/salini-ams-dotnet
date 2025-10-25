"use client"

import { apiClient, type PaginatedResponse } from './apiClient'

export interface SoftwareLicense {
  id: string
  softwareName: string
  vendor: string
  licenseKey: string
  licenseType?: string
  purchaseDate: string
  expiryDate?: string
  seats: number
  usedSeats?: number
  status: number // 1=Active, 2=Inactive, 3=Expired
  projectId?: string
  projectName?: string
  cost?: number
  poNumber?: string
  notes?: string
  createdAt: string
  updatedAt?: string
  createdBy?: string
  updatedBy?: string
  assignedEmployeeId?: string
  assignedEmployeeName?: string
  assignmentDate?: string
}

export interface CreateSoftwareLicenseData {
  software_name: string
  vendor: string
  license_key: string
  purchase_date: string
  expiry_date?: string
  seats: number
  used_seats?: number
  status?: 'active' | 'inactive' | 'expired'
  project_id?: string
  cost?: number
  po_number?: string
}

export interface UpdateSoftwareLicenseData {
  software_name?: string
  vendor?: string
  license_key?: string
  purchase_date?: string
  expiry_date?: string
  seats?: number
  used_seats?: number
  status?: 'active' | 'inactive' | 'expired'
  project_id?: string
  cost?: number
  po_number?: string
}

export class SoftwareLicenseService {

  // Get all software licenses (admin only)
  static async getAllSoftwareLicenses(): Promise<SoftwareLicense[]> {
    try {
      console.log('Fetching all software licenses from API...')
      const response = await apiClient.get<PaginatedResponse<SoftwareLicense>>('/api/SoftwareLicenses?pageSize=1000&sortBy=expiryDate&sortDescending=false');
      console.log('API response:', response)
      console.log('Response data:', response.data)
      console.log('Response items:', response.data?.items)
      return response.data?.items || [];
    } catch (error) {
      console.error('Error fetching all software licenses:', error)
      return []
    }
  }

  // Get software licenses for a specific project
  static async getSoftwareLicensesByProject(projectId: string): Promise<SoftwareLicense[]> {
    try {
      const response = await apiClient.get<PaginatedResponse<SoftwareLicense>>(`/api/SoftwareLicenses?projectId=${projectId}&pageSize=1000&sortBy=expiryDate&sortDescending=false`);
      return response.data?.items || [];
    } catch (error) {
      console.error('Error fetching software licenses by project:', error)
      return []
    }
  }

  // Get software license by ID
  static async getSoftwareLicenseById(id: string): Promise<SoftwareLicense | null> {
    try {
      const response = await apiClient.get<SoftwareLicense>(`/api/SoftwareLicenses/${id}`);
      return response.data || null;
    } catch (error) {
      console.error('Error fetching software license by ID:', error)
      return null
    }
  }

  // Create new software license
  static async createSoftwareLicense(licenseData: CreateSoftwareLicenseData): Promise<SoftwareLicense> {
    try {
      // Transform snake_case to PascalCase for backend compatibility
      const backendData = {
        SoftwareName: licenseData.software_name,
        LicenseKey: licenseData.license_key,
        LicenseType: null, // Not provided in frontend interface
        Seats: licenseData.seats,
        Vendor: licenseData.vendor,
        PurchaseDate: licenseData.purchase_date ? new Date(licenseData.purchase_date).toISOString() : null,
        ExpiryDate: licenseData.expiry_date ? new Date(licenseData.expiry_date).toISOString() : null,
        Cost: licenseData.cost || null,
        Status: licenseData.status === 'active' ? 1 : licenseData.status === 'inactive' ? 2 : 3, // Convert string to enum
        Notes: null, // Not provided in frontend interface
        PoNumber: licenseData.po_number || null,
        ProjectId: licenseData.project_id || '' // Required field
      };

      const response = await apiClient.post<SoftwareLicense>('/api/SoftwareLicenses', backendData);
      return response.data!;
    } catch (error) {
      console.error('Error creating software license:', error)
        throw error
    }
  }

  // Update software license
  static async updateSoftwareLicense(id: string, licenseData: UpdateSoftwareLicenseData): Promise<SoftwareLicense> {
    try {
      // Transform snake_case to PascalCase for backend compatibility
      const backendData = {
        Id: id,
        SoftwareName: licenseData.software_name || '',
        LicenseKey: licenseData.license_key || null,
        LicenseType: licenseData.license_type || null,
        Seats: licenseData.seats || null,
        Vendor: licenseData.vendor || null,
        PurchaseDate: licenseData.purchase_date ? new Date(licenseData.purchase_date).toISOString() : null,
        ExpiryDate: licenseData.expiry_date ? new Date(licenseData.expiry_date).toISOString() : null,
        Cost: licenseData.cost || null,
        Status: licenseData.status === 'active' ? 1 : licenseData.status === 'inactive' ? 2 : 3, // Convert string to enum
        Notes: licenseData.notes || null,
        PoNumber: licenseData.po_number || null,
        ProjectId: licenseData.project_id || '' // Required field
      };

      const response = await apiClient.put<SoftwareLicense>(`/api/SoftwareLicenses/${id}`, backendData);
      return response.data!;
    } catch (error) {
      console.error('Error updating software license:', error)
      throw error
    }
  }

  // Delete software license
  static async deleteSoftwareLicense(id: string): Promise<void> {
    try {
      // Note: DELETE endpoint is not yet implemented in the backend API
      console.warn('Software license deletion is not yet available in the API')
      throw new Error('Software license deletion is not yet implemented in the API')
    } catch (error) {
      console.error('Error deleting software license:', error)
      throw error
    }
  }

  // Get software licenses with project filtering for user access
  static async getSoftwareLicensesForUser(userId: string, projectId?: string): Promise<SoftwareLicense[]> {
    try {
      // API automatically filters software licenses by user's assigned projects (server-side filtering)
      console.log('Fetching software licenses for user:', userId)
      const response = await apiClient.get<PaginatedResponse<SoftwareLicense>>('/api/SoftwareLicenses?pageSize=1000&sortBy=expiryDate&sortDescending=false');
      console.log('User API response:', response)
      console.log('User response data:', response.data)
      console.log('User response items:', response.data?.items)
      return response.data?.items || [];
    } catch (error) {
      console.error('Error fetching software licenses for user:', error)
      return []
    }
  }

  // Get software license statistics
  static async getSoftwareLicenseStats(): Promise<{
    total: number
    active: number
    inactive: number
    expired: number
    totalSeats: number
  }> {
    try {
      // Note: Dedicated stats endpoint not yet implemented - calculate from license data instead
      const licenses = await this.getAllSoftwareLicenses();
      return {
        total: licenses.length,
        active: licenses.filter(l => l.status === 1).length,
        inactive: licenses.filter(l => l.status === 2).length,
        expired: licenses.filter(l => l.status === 3).length,
        totalSeats: licenses.reduce((sum, l) => sum + (l.seats || 0), 0)
      }
    } catch (error) {
      console.error('Error fetching software license statistics:', error)
      return {
        total: 0,
        active: 0,
        inactive: 0,
        expired: 0,
        totalSeats: 0
      }
    }
  }

  // Assign software license to user
  static async assignSoftwareLicense(licenseId: string, employeeId: string, notes?: string): Promise<void> {
    try {
      await apiClient.post(`/api/SoftwareLicenses/${licenseId}/assign`, {
        employeeId,
        notes
      });
    } catch (error) {
      console.error('Error assigning software license:', error)
      throw error
    }
  }

  // Unassign software license from user
  static async unassignSoftwareLicense(assignmentId: string, notes?: string): Promise<void> {
    try {
      const queryParams = notes ? `?notes=${encodeURIComponent(notes)}` : '';
      await apiClient.post(`/api/SoftwareLicenses/assignments/${assignmentId}/unassign${queryParams}`);
    } catch (error) {
      console.error('Error unassigning software license:', error)
      throw error
    }
  }
}