"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DateDisplay } from "@/components/ui/date-display"
import { SimCard } from "@/lib/types"

interface SimCardDetailsProps {
  simCard: SimCard | null
  isOpen: boolean
  onClose: () => void
}

export function SimCardDetails({ simCard, isOpen, onClose }: SimCardDetailsProps) {
  // Use nested objects from simCard if available
  const cardPlan = simCard?.simCardPlan;

  if (!simCard) return null

  const getStatusColor = (status: string | number) => {
    // Handle numeric status
    if (typeof status === 'number') {
      switch (status) {
        case 1: return "default" // Active
        case 2: return "secondary" // Inactive
        case 3: return "destructive" // Suspended
        case 4: return "outline" // Expired
        default: return "secondary"
      }
    }

    // Handle string status
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case "active":
        return "default"
      case "inactive":
        return "secondary"
      case "suspended":
        return "destructive"
      case "expired":
        return "outline"
      default:
        return "secondary"
    }
  }

  const getStatusLabel = (status: string | number) => {
    if (typeof status === 'string') return status;
    switch (status) {
      case 1: return 'Active';
      case 2: return 'Inactive';
      case 3: return 'Suspended';
      case 4: return 'Expired';
      default: return String(status);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>SIM Card Details - {simCard.simAccountNo}</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Account Number</label>
                <p className="font-mono text-sm">{simCard.simAccountNo}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Service Number</label>
                <p className="font-mono text-sm">{simCard.simServiceNo}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Serial Number</label>
                <p className="font-mono text-sm">{simCard.simSerialNo || "N/A"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Start Date</label>
                <p><DateDisplay date={simCard.simStartDate || ""} /></p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Type</label>
                <p>
                  <Badge variant="outline">
                    {simCard.simTypeName || "N/A"}
                  </Badge>
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Provider</label>
                <p>{simCard.simProviderName || "N/A"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Card Plan</label>
                <p>{simCard.simCardPlanName || "N/A"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Project</label>
                <p>{simCard.projectName || "N/A"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <div className="mt-1">
                  <Badge variant={getStatusColor(simCard.simStatus)}>{getStatusLabel(simCard.simStatus)}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Assignment Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Assignment Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Assigned To</label>
                <p>{simCard.assignedEmployeeName || "Not assigned"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Assigned At</label>
                <p>
                  {simCard.assignmentDate && !simCard.assignmentDate.startsWith("0001")
                    ? new Date(simCard.assignmentDate).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Plan Details */}
          {cardPlan && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Plan Details</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Data Limit</label>
                  <p>{cardPlan.dataLimit || "N/A"}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
