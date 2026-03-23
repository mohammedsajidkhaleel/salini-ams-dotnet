"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Asset } from "@/lib/services/assetService"

interface AssetDetailsProps {
  asset: Asset | null
  isOpen: boolean
  onClose: () => void
}

export function AssetDetails({ asset, isOpen, onClose }: AssetDetailsProps) {
  if (!asset) return null

  // Helper to convert status number to label
  const statusLabel = (status: number): string => {
    switch (status) {
      case 1: return "available";
      case 2: return "assigned";
      case 3: return "maintenance";
      case 4: return "retired";
      default: return "unknown";
    }
  };

  const getStatusColor = (status: number) => {
    switch (status) {
      case 1: // available
        return "default"
      case 2: // assigned
        return "secondary"
      case 3: // maintenance
        return "destructive"
      case 4: // retired
        return "outline"
      default:
        return "default"
    }
  }

  const getConditionColor = (condition?: string) => {
    switch (condition) {
      case "excellent":
        return "text-green-600"
      case "good":
        return "text-blue-600"
      case "fair":
        return "text-yellow-600"
      case "poor":
        return "text-red-600"
      default:
        return "text-gray-600"
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Asset Details - {asset.assetTag}</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Asset Tag</label>
                <p className="font-medium">{asset.assetTag}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Name</label>
                <p className="font-medium">{asset.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Item</label>
                <p>{asset.itemName || asset.item?.name || "-"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Serial Number</label>
                <p className="font-mono text-sm">{asset.serialNumber || "-"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Project</label>
                <p>{asset.projectName || asset.project?.name || "N/A"}</p>
              </div>
            </CardContent>
          </Card>

          {/* Status & Assignment */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Status & Assignment</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <div className="mt-1">
                  <Badge variant={getStatusColor(asset.status)}>{statusLabel(asset.status)}</Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Condition</label>
                <p className={`font-medium ${getConditionColor(asset.condition)}`}>{asset.condition || "excellent"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Location</label>
                <p>{asset.location || "N/A"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Assigned To</label>
                <p>{asset.assignedEmployeeName || asset.currentAssignment?.employeeName || "Not assigned"}</p>
              </div>
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Additional Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">PO Number</label>
                <p>{asset.poNumber || "N/A"}</p>
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          {asset.description && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{asset.description}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
