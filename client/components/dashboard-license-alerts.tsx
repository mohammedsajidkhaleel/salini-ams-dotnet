"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle } from "lucide-react"
import { SoftwareLicense } from "@/lib/softwareLicenseService"

interface DashboardLicenseAlertsProps {
  licenses: SoftwareLicense[]
}

export function DashboardLicenseAlerts({ licenses }: DashboardLicenseAlertsProps) {
  // Calculate expired licenses
  const expiredLicenses = licenses.filter((license) => {
    if (!license.expiryDate) return false
    const expiryDate = new Date(license.expiryDate)
    const today = new Date()
    return expiryDate < today
  })

  // Calculate expiring soon licenses (within 90 days)
  const expiringLicenses = licenses.filter((license) => {
    if (!license.expiryDate) return false
    const expiryDate = new Date(license.expiryDate)
    const today = new Date()
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return daysUntilExpiry <= 90 && daysUntilExpiry > 0
  })

  // Don't render if there are no alerts
  if (expiredLicenses.length === 0 && expiringLicenses.length === 0) {
    return null
  }

  return (
    <Card className="border-amber-200 bg-amber-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-amber-800">
          <AlertTriangle className="h-5 w-5" />
          License Alerts
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {expiredLicenses.length > 0 && (
            <div className="flex items-center gap-2">
              <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
                {expiredLicenses.length} Expired
              </Badge>
              <span className="text-sm text-gray-600">
                Licenses have expired and need renewal
              </span>
            </div>
          )}
          {expiringLicenses.length > 0 && (
            <div className="flex items-center gap-2">
              <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200">
                {expiringLicenses.length} Expiring Soon
              </Badge>
              <span className="text-sm text-gray-600">
                Licenses expiring within 90 days
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

