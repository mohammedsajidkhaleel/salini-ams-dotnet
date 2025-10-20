"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Calendar,
  Users,
  Shield,
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react"
import { SoftwareLicense } from "@/lib/softwareLicenseService"

interface SoftwareLicenseDetailsProps {
  license: SoftwareLicense
  onEdit: () => void
  onClose: () => void
}

export function SoftwareLicenseDetails({ license, onEdit, onClose }: SoftwareLicenseDetailsProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "expired":
        return <XCircle className="h-5 w-5 text-red-500" />
      case "inactive":
        return <AlertTriangle className="h-5 w-5 text-amber-500" />
      default:
        return null
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>
      case "expired":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Expired</Badge>
      case "inactive":
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Inactive</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }


  const getDaysUntilExpiry = () => {
    if (!license.expiry_date) return null
    const today = new Date()
    const expiry = new Date(license.expiry_date)
    const diffTime = expiry.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const daysUntilExpiry = getDaysUntilExpiry()

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{license.software_name}</CardTitle>
              <p className="text-gray-600 mt-1">License ID: {license.id}</p>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(license.status)}
              {getStatusBadge(license.status)}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Vendor</p>
                  <p className="font-medium">{license.vendor}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">License Type</p>
                  <Badge variant="outline">{license.license_type || "N/A"}</Badge>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Number of Seats</p>
                  <p className="font-medium">{license.seats || 0}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Purchase Date</p>
                  <p className="font-medium">{license.purchase_date ? new Date(license.purchase_date).toLocaleDateString() : "N/A"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Expiry Date</p>
                  <p className="font-medium">
                    {license.expiry_date ? new Date(license.expiry_date).toLocaleDateString() : "No expiry"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Project</p>
                  <p className="font-medium">{(license as any).projects?.name || "N/A"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">PO Number</p>
                  <p className="font-medium">{license.po_number || "N/A"}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">License Key</p>
                  <p className="font-medium">{license.license_key || "N/A"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Cost</p>
                  <p className="font-medium">{license.cost ? formatCurrency(license.cost) : "N/A"}</p>
                </div>
              </div>
              {daysUntilExpiry !== null && (
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Expiry Status</p>
                    <p
                      className={`text-sm font-medium ${daysUntilExpiry <= 30 ? "text-red-600" : daysUntilExpiry <= 90 ? "text-amber-600" : "text-gray-500"}`}
                    >
                      {daysUntilExpiry > 0
                        ? `${daysUntilExpiry} days remaining`
                        : `Expired ${Math.abs(daysUntilExpiry)} days ago`}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {license.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">{license.notes}</p>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
        <Button onClick={onEdit} className="bg-cyan-600 hover:bg-cyan-700">
          Edit License
        </Button>
      </div>
    </div>
  )
}
