// TODO: Replace with new API implementation
import { apiDeduplicator } from "./apiDeduplicator"

export interface AuditLogEntry {
  id: string
  table_name: string
  record_id: string
  action: 'INSERT' | 'UPDATE' | 'DELETE'
  old_values: any
  new_values: any
  user_id: string | null
  created_at: string
}

export interface RecentActivity {
  id: string
  action: string
  item: string
  user: string
  time: string
  status: string
  created_at: string
  table_name: string
}

class AuditService {
  /**
   * Fetch recent activities from audit log
   * This replaces multiple queries to individual tables
   */
  async getRecentActivities(limit: number = 10): Promise<RecentActivity[]> {
    const key = apiDeduplicator.generateKey('getRecentActivities', { limit })
    
    return apiDeduplicator.execute(key, async () => {
      try {
        console.log('🔍 AuditService: Fetching recent activities, limit:', limit)
        // TODO: Replace with new API call
        // For now, return mock data
        const data: any[] = []

        // Transform audit log entries to activity format
        const activities: RecentActivity[] = data.map(entry => {
          const activity = this.transformAuditEntryToActivity(entry)
          return activity
        }).filter(Boolean) as RecentActivity[]

        return activities
      } catch (error) {
        console.error('Error in getRecentActivities:', error)
        return []
      }
    })
  }

  /**
   * Transform audit log entry to activity format
   */
  private transformAuditEntryToActivity(entry: AuditLogEntry): RecentActivity | null {
    const timeAgo = this.formatTimeAgo(entry.created_at)
    
    switch (entry.table_name) {
      case 'assets':
        return this.transformAssetActivity(entry, timeAgo)
      case 'purchase_orders':
        return this.transformPurchaseOrderActivity(entry, timeAgo)
      case 'sim_cards':
        return this.transformSimCardActivity(entry, timeAgo)
      case 'software_licenses':
        return this.transformSoftwareLicenseActivity(entry, timeAgo)
      case 'employees':
        return this.transformEmployeeActivity(entry, timeAgo)
      default:
        return this.transformGenericActivity(entry, timeAgo)
    }
  }

  private transformAssetActivity(entry: AuditLogEntry, timeAgo: string): RecentActivity {
    const name = entry.new_values?.name || entry.old_values?.name || 'Unknown Asset'
    const assignedTo = entry.new_values?.assigned_to || entry.old_values?.assigned_to || 'Unassigned'
    const status = entry.new_values?.status || entry.old_values?.status || 'unknown'

    let action = 'Asset updated'
    if (entry.action === 'INSERT') action = 'Asset created'
    else if (entry.action === 'DELETE') action = 'Asset deleted'

    return {
      id: `asset-${entry.record_id}`,
      action,
      item: name,
      user: assignedTo,
      time: timeAgo,
      status,
      created_at: entry.created_at,
      table_name: entry.table_name
    }
  }

  private transformPurchaseOrderActivity(entry: AuditLogEntry, timeAgo: string): RecentActivity {
    const poNumber = entry.new_values?.po_number || entry.old_values?.po_number || 'Unknown PO'
    const status = entry.new_values?.status || entry.old_values?.status || 'unknown'

    let action = 'Purchase order updated'
    if (entry.action === 'INSERT') action = 'Purchase order created'
    else if (entry.action === 'DELETE') action = 'Purchase order deleted'

    return {
      id: `order-${entry.record_id}`,
      action,
      item: poNumber,
      user: 'System',
      time: timeAgo,
      status,
      created_at: entry.created_at,
      table_name: entry.table_name
    }
  }

  private transformSimCardActivity(entry: AuditLogEntry, timeAgo: string): RecentActivity {
    const serviceNo = entry.new_values?.sim_service_no || entry.old_values?.sim_service_no || 'Unknown SIM'
    const status = entry.new_values?.sim_status || entry.old_values?.sim_status || 'unknown'

    let action = 'SIM card updated'
    if (entry.action === 'INSERT') action = 'SIM card registered'
    else if (entry.action === 'DELETE') action = 'SIM card deleted'

    return {
      id: `sim-${entry.record_id}`,
      action,
      item: serviceNo,
      user: 'System',
      time: timeAgo,
      status,
      created_at: entry.created_at,
      table_name: entry.table_name
    }
  }

  private transformSoftwareLicenseActivity(entry: AuditLogEntry, timeAgo: string): RecentActivity {
    const softwareName = entry.new_values?.software_name || entry.old_values?.software_name || 'Unknown Software'
    const status = entry.new_values?.status || entry.old_values?.status || 'unknown'

    let action = 'Software license updated'
    if (entry.action === 'INSERT') action = 'Software license added'
    else if (entry.action === 'DELETE') action = 'Software license deleted'

    return {
      id: `license-${entry.record_id}`,
      action,
      item: softwareName,
      user: 'System',
      time: timeAgo,
      status,
      created_at: entry.created_at,
      table_name: entry.table_name
    }
  }

  private transformEmployeeActivity(entry: AuditLogEntry, timeAgo: string): RecentActivity {
    const name = entry.new_values?.name || entry.old_values?.name || 'Unknown Employee'
    const status = entry.new_values?.status || entry.old_values?.status || 'unknown'

    let action = 'Employee updated'
    if (entry.action === 'INSERT') action = 'Employee added'
    else if (entry.action === 'DELETE') action = 'Employee removed'

    return {
      id: `employee-${entry.record_id}`,
      action,
      item: name,
      user: 'System',
      time: timeAgo,
      status,
      created_at: entry.created_at,
      table_name: entry.table_name
    }
  }

  private transformGenericActivity(entry: AuditLogEntry, timeAgo: string): RecentActivity {
    const tableName = entry.table_name.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
    let action = `${tableName} updated`
    if (entry.action === 'INSERT') action = `${tableName} created`
    else if (entry.action === 'DELETE') action = `${tableName} deleted`

    return {
      id: `${entry.table_name}-${entry.record_id}`,
      action,
      item: entry.record_id,
      user: 'System',
      time: timeAgo,
      status: 'unknown',
      created_at: entry.created_at,
      table_name: entry.table_name
    }
  }

  private formatTimeAgo(dateString: string): string {
    const now = new Date()
    const date = new Date(dateString)
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return "Just now"
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`
    return date.toLocaleDateString()
  }
}

export const auditService = new AuditService()
