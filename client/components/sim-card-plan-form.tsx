"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SimCardPlanService, SimProvider } from "@/lib/services/simCardPlanService";

interface SimCardPlan {
  id: string;
  name: string;
  description?: string;
  data_limit?: string;
  monthly_fee?: number;
  provider_id: string;
  is_active: boolean;
}

interface SimProvider {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
}

interface SimCardPlanFormProps {
  simCardPlan?: SimCardPlan;
  onSubmit: (simCardPlan: Omit<SimCardPlan, "id">) => void;
  onCancel: () => void;
}

export function SimCardPlanForm({
  simCardPlan,
  onSubmit,
  onCancel,
}: SimCardPlanFormProps) {
  const [formData, setFormData] = useState({
    name: simCardPlan?.name || "",
    description: simCardPlan?.description || "",
    data_limit: simCardPlan?.data_limit || "",
    monthly_fee: simCardPlan?.monthly_fee?.toString() || "",
    provider_id: simCardPlan?.provider_id || "",
    is_active: simCardPlan?.is_active ?? true,
  });

  const [providers, setProviders] = useState<SimProvider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load providers data
  useEffect(() => {
    const loadProviders = async () => {
      try {
        const providersData = await SimCardPlanService.getProviders();
        setProviders(providersData);
      } catch (error) {
        console.error('Error loading providers:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProviders();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = "Plan name is required";
    }
    
    if (!formData.provider_id) {
      newErrors.provider_id = "Provider is required";
    }
    
    if (formData.monthly_fee && isNaN(parseFloat(formData.monthly_fee))) {
      newErrors.monthly_fee = "Monthly fee must be a valid number";
    }

    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      return;
    }

    // Prepare data for submission
    const submitData = {
      name: formData.name.trim(),
      description: formData.description.trim() || null,
      data_limit: formData.data_limit.trim() || null,
      monthly_fee: formData.monthly_fee ? parseFloat(formData.monthly_fee) : null,
      provider_id: formData.provider_id,
      is_active: formData.is_active,
    };

    onSubmit(submitData);
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            {simCardPlan ? "Edit SIM Card Plan" : "Add New SIM Card Plan"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Loading form data...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {simCardPlan ? "Edit SIM Card Plan" : "Add New SIM Card Plan"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="name">Plan Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="e.g., Business Basic, Enterprise"
                className="mt-1"
                required
              />
              {errors.name && (
                <p className="text-sm text-red-500 mt-1">{errors.name}</p>
              )}
            </div>
            <div>
              <Label htmlFor="provider_id">Provider *</Label>
              <select
                id="provider_id"
                value={formData.provider_id}
                onChange={(e) => handleChange("provider_id", e.target.value)}
                className="w-full p-2 border border-input rounded-md bg-background mt-1"
                required
              >
                <option value="">Select Provider</option>
                {providers.map((provider) => (
                  <option key={provider.id} value={provider.id}>
                    {provider.name}
                  </option>
                ))}
                {providers.length === 0 && (
                  <option value="" disabled>No providers available</option>
                )}
              </select>
              {errors.provider_id && (
                <p className="text-sm text-red-500 mt-1">{errors.provider_id}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              rows={3}
              placeholder="Plan description and features"
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="data_limit">Data Limit</Label>
              <Input
                id="data_limit"
                value={formData.data_limit}
                onChange={(e) => handleChange("data_limit", e.target.value)}
                placeholder="e.g., 5GB, 20GB, Unlimited"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="monthly_fee">Monthly Fee (﷼)</Label>
              <Input
                id="monthly_fee"
                type="number"
                step="0.01"
                min="0"
                value={formData.monthly_fee}
                onChange={(e) => handleChange("monthly_fee", e.target.value)}
                placeholder="0.00"
                className="mt-1"
              />
              {errors.monthly_fee && (
                <p className="text-sm text-red-500 mt-1">{errors.monthly_fee}</p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => handleChange("is_active", e.target.checked)}
              className="rounded border-gray-300"
            />
            <Label htmlFor="is_active">Active Plan</Label>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1">
              {simCardPlan ? "Update Plan" : "Add Plan"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1 bg-transparent"
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
