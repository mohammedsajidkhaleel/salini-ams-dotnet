"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SimCardPlan {
  id: string;
  name: string;
  description?: string;
  data_limit?: string;
  monthly_fee?: number;
  provider_id: string;
  is_active: boolean;
  provider_name?: string;
}

interface SimCardPlanDetailsProps {
  simCardPlan: SimCardPlan | null;
  isOpen: boolean;
  onClose: () => void;
}

export function SimCardPlanDetails({
  simCardPlan,
  isOpen,
  onClose,
}: SimCardPlanDetailsProps) {
  if (!simCardPlan) return null;

  const formatCurrency = (amount?: number) => {
    if (amount === null || amount === undefined) return "Not specified";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {simCardPlan.name}
            <Badge variant={simCardPlan.is_active ? "default" : "secondary"}>
              {simCardPlan.is_active ? "Active" : "Inactive"}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Plan Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Plan Name
                  </label>
                  <p className="text-sm font-medium">{simCardPlan.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Provider
                  </label>
                  <p className="text-sm font-medium">
                    {simCardPlan.provider_name || "N/A"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Data Limit
                  </label>
                  <p className="text-sm font-medium">
                    {simCardPlan.data_limit || "Not specified"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Monthly Fee
                  </label>
                  <p className="text-sm font-medium">
                    {formatCurrency(simCardPlan.monthly_fee)}
                  </p>
                </div>
              </div>

              {simCardPlan.description && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Description
                  </label>
                  <p className="text-sm mt-1">{simCardPlan.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Technical Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Plan ID
                  </label>
                  <p className="text-sm font-mono">{simCardPlan.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Provider ID
                  </label>
                  <p className="text-sm font-mono">{simCardPlan.provider_id}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
