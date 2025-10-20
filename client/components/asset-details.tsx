"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface Asset {
  id: string
  assetTag: string
  name: string
  category: string
  brand: string
  serialNumber: string
  purchaseDate: string
  purchasePrice: number
  vendor: string
  warranty: string
  location: string
  assignedTo: string
  status: "available" | "assigned" | "maintenance" | "retired"
  condition: "excellent" | "good" | "fair" | "poor"
  description: string
}

interface AssetDetailsProps {
  asset: Asset | null
  isOpen: boolean
  onClose: () => void
}

export function AssetDetails({ asset, isOpen, onClose }: AssetDetailsProps) {
  if (!asset) return null

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "default"
      case "assigned":
        return "secondary"
      case "maintenance":
        return "destructive"
      case "retired":
        return "outline"
      default:
        return "default"
    }
  }

  const getConditionColor = (condition: string) => {
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
                <label className="text-sm font-medium text-muted-foreground">Category</label>
                <p>{asset.category}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Brand</label>
                <p>{asset.brand}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Serial Number</label>
                <p className="font-mono text-sm">{asset.serialNumber}</p>
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
                  <Badge variant={getStatusColor(asset.status)}>{asset.status}</Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Condition</label>
                <p className={`font-medium ${getConditionColor(asset.condition)}`}>{asset.condition}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Location</label>
                <p>{asset.location}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Assigned To</label>
                <p>{asset.assignedTo || "Not assigned"}</p>
              </div>
            </CardContent>
          </Card>

          {/* Purchase Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Purchase Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Purchase Date</label>
                <p>{asset.purchaseDate}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Purchase Price</label>
                <p className="font-medium">${asset.purchasePrice.toLocaleString()}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Vendor</label>
                <p>{asset.vendor}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Warranty</label>
                <p>{asset.warranty ? `${asset.warranty} months` : "No warranty"}</p>
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
