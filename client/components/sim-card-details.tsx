"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DateDisplay } from "@/components/ui/date-display"
import { SimCard } from "@/lib/types"
import { simProviderService } from "@/lib/services/simProviderService"
import { simTypeService } from "@/lib/services/simTypeService"
import { simCardPlanService } from "@/lib/services/simCardPlanService"

interface SimProvider {
  id: string
  name: string
  description?: string
}

interface SimType {
  id: string
  name: string
  description?: string
}

interface SimCardPlan {
  id: string
  name: string
  description?: string
  data_limit?: string
  monthly_fee?: number
}

interface SimCardDetailsProps {
  simCard: SimCard | null
  isOpen: boolean
  onClose: () => void
}

export function SimCardDetails({ simCard, isOpen, onClose }: SimCardDetailsProps) {
  const [provider, setProvider] = useState<SimProvider | null>(null)
  const [type, setType] = useState<SimType | null>(null)
  const [cardPlan, setCardPlan] = useState<SimCardPlan | null>(null)

  // Load master data when simCard changes
  useEffect(() => {
    let isCancelled = false;
    
    const loadMasterData = async () => {
      if (!simCard || !isOpen) return

      try {
        console.log("🔄 Loading master data for SimCardDetails...");
        
        const promises = []

        if (simCard.sim_provider_id) {
          promises.push(
            simProviderService.getSimProvider(simCard.sim_provider_id)
              .then((data) => {
                if (!isCancelled && data) setProvider(data);
              })
              .catch((error) => {
                console.error("Error loading provider:", error);
              })
          )
        }

        if (simCard.sim_type_id) {
          promises.push(
            simTypeService.getSimType(simCard.sim_type_id)
              .then((data) => {
                if (!isCancelled && data) setType(data);
              })
              .catch((error) => {
                console.error("Error loading type:", error);
              })
          )
        }

        if (simCard.sim_card_plan_id) {
          promises.push(
            simCardPlanService.getSimCardPlan(simCard.sim_card_plan_id)
              .then((data) => {
                if (!isCancelled && data) setCardPlan(data);
              })
              .catch((error) => {
                console.error("Error loading card plan:", error);
              })
          )
        }

        await Promise.all(promises);
        
        if (!isCancelled) {
          console.log("✅ Master data loaded for SimCardDetails");
        }
      } catch (error) {
        if (!isCancelled) {
          console.error("❌ Error loading master data:", error);
        }
      }
    }

    if (isOpen && simCard) {
      loadMasterData();
    }
    
    // Cleanup function
    return () => {
      isCancelled = true;
    };
  }, [simCard, isOpen])

  if (!simCard) return null

  const getStatusColor = (status: string) => {
    switch (status) {
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>SIM Card Details - {simCard.sim_account_no}</DialogTitle>
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
                <p className="font-mono text-sm">{simCard.sim_account_no}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Service Number</label>
                <p className="font-mono text-sm">{simCard.sim_service_no}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Serial Number</label>
                <p className="font-mono text-sm">{simCard.sim_serial_no || "N/A"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Start Date</label>
                <p><DateDisplay date={simCard.sim_start_date} /></p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Type</label>
                <p>
                  <Badge variant="outline">
                    {simCard.sim_type_name || "N/A"}
                  </Badge>
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Provider</label>
                <p>{simCard.sim_provider_name || "N/A"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Card Plan</label>
                <p>{simCard.sim_card_plan_name || "N/A"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Project</label>
                <p>{simCard.project_name || "N/A"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <div className="mt-1">
                  <Badge variant={getStatusColor(simCard.sim_status)}>{simCard.sim_status}</Badge>
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
                <p>{simCard.assigned_to_name || "Not assigned"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Created At</label>
                <p>{new Date(simCard.created_at).toLocaleDateString()}</p>
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
                  <label className="text-sm font-medium text-muted-foreground">Plan Description</label>
                  <p>{cardPlan.description || "N/A"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Data Limit</label>
                  <p>{cardPlan.data_limit || "N/A"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Monthly Fee</label>
                  <p className="font-medium">﷼{cardPlan.monthly_fee?.toFixed(2) || "N/A"}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
