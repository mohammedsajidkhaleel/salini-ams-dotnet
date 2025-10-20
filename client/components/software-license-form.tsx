"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SoftwareLicense } from "@/lib/softwareLicenseService"
import { Project } from "@/lib/types"

interface SoftwareLicenseFormProps {
  license?: SoftwareLicense
  projects: Project[]
  onSubmit: (license: Omit<SoftwareLicense, "id" | "createdAt">) => void
  onCancel: () => void
}

export function SoftwareLicenseForm({ license, projects, onSubmit, onCancel }: SoftwareLicenseFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    software_name: license?.softwareName || "",
    vendor: license?.vendor || "",
    license_type: license?.licenseType || "",
    status: license?.status === 1 ? "active" : license?.status === 2 ? "inactive" : license?.status === 3 ? "expired" : "active",
    seats: license?.seats || 1,
    purchase_date: license?.purchaseDate || "",
    expiry_date: license?.expiryDate || "",
    license_key: license?.licenseKey || "",
    notes: license?.notes || "",
    project_id: license?.projectId || "",
    cost: license?.cost || 0,
    po_number: license?.poNumber || "",
  })

  // Reset isSubmitting state when component mounts or when switching between add/edit modes
  useEffect(() => {
    setIsSubmitting(false)
  }, [license?.id]) // Reset when license ID changes (including when it becomes undefined for new license)

  // Update form data when license prop changes (for editing)
  useEffect(() => {
    if (license) {
      setFormData({
        software_name: license.softwareName || "",
        vendor: license.vendor || "",
        license_type: license.licenseType || "",
        status: license.status === 1 ? "active" : license.status === 2 ? "inactive" : license.status === 3 ? "expired" : "active",
        seats: license.seats || 1,
        purchase_date: license.purchaseDate ? new Date(license.purchaseDate).toISOString().split('T')[0] : "",
        expiry_date: license.expiryDate ? new Date(license.expiryDate).toISOString().split('T')[0] : "",
        license_key: license.licenseKey || "",
        notes: license.notes || "",
        project_id: license.projectId || "",
        cost: license.cost || 0,
        po_number: license.poNumber || "",
      });
    } else {
      // Reset form for new license
      setFormData({
        software_name: "",
        vendor: "",
        license_type: "",
        status: "active",
        seats: 1,
        purchase_date: "",
        expiry_date: "",
        license_key: "",
        notes: "",
        project_id: "",
        cost: 0,
        po_number: "",
      });
    }
  }, [license])

  // Cleanup effect to ensure state is reset when component unmounts
  useEffect(() => {
    return () => {
      setIsSubmitting(false)
    }
  }, [])



  // Form data is ready for submission

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) {
      return // Prevent double submission
    }
    
    setIsSubmitting(true)
    
    // Safety timeout to prevent form from getting stuck
    const timeoutId = setTimeout(() => {
      console.warn('Form submission timeout, forcing isSubmitting to false') // Debug log
      setIsSubmitting(false)
    }, 15000) // Increased to 15 second timeout
    
    try {
      await onSubmit(formData)
      // Reset form after successful submission (only for new licenses)
      if (!license) {
        resetForm()
      }
    } catch (error) {
      console.error('Form submission error:', error) // Debug log
      // Don't re-throw the error as the parent handles it
    } finally {
      clearTimeout(timeoutId) // Clear the timeout
      // Use a small delay to ensure the state update happens even if component is unmounting
      setTimeout(() => {
        setIsSubmitting(false)
      }, 100)
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>{license ? "Edit Software License" : "Add New Software License"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="software_name">Software Name *</Label>
              <Input
                id="software_name"
                value={formData.software_name}
                onChange={(e) => setFormData((prev) => ({ ...prev, software_name: e.target.value }))}
                placeholder="e.g., Microsoft Office 365"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vendor">Vendor *</Label>
              <Input
                id="vendor"
                value={formData.vendor}
                onChange={(e) => setFormData((prev) => ({ ...prev, vendor: e.target.value }))}
                placeholder="e.g., Microsoft"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="project_id">Project *</Label>
              <Select
                value={formData.project_id}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, project_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="license_key">License Key</Label>
              <Input
                id="license_key"
                value={formData.license_key}
                onChange={(e) => setFormData((prev) => ({ ...prev, license_key: e.target.value }))}
                placeholder="Enter license key"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="po_number">PO Number</Label>
              <Input
                id="po_number"
                value={formData.po_number}
                onChange={(e) => setFormData((prev) => ({ ...prev, po_number: e.target.value }))}
                placeholder="Enter purchase order number"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="license_type">License Type *</Label>
              <Select
                value={formData.license_type}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, license_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select license type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="perpetual">Perpetual</SelectItem>
                  <SelectItem value="subscription">Subscription</SelectItem>
                  <SelectItem value="concurrent">Concurrent</SelectItem>
                  <SelectItem value="named-user">Named User</SelectItem>
                  <SelectItem value="site">Site License</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="seats">Number of Seats *</Label>
              <Input
                id="seats"
                type="number"
                min="1"
                value={formData.seats}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, seats: Number.parseInt(e.target.value) || 1 }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cost">Cost</Label>
              <Input
                id="cost"
                type="number"
                step="0.01"
                min="0"
                value={formData.cost}
                onChange={(e) => setFormData((prev) => ({ ...prev, cost: Number.parseFloat(e.target.value) || 0 }))}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="purchase_date">Purchase Date</Label>
              <Input
                id="purchase_date"
                type="date"
                value={formData.purchase_date}
                onChange={(e) => setFormData((prev) => ({ ...prev, purchase_date: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiry_date">Expiry Date</Label>
              <Input
                id="expiry_date"
                type="date"
                value={formData.expiry_date}
                onChange={(e) => setFormData((prev) => ({ ...prev, expiry_date: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional notes about this software license..."
              rows={3}
            />
          </div>


          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-cyan-600 hover:bg-cyan-700" 
              disabled={isSubmitting}
              onClick={(e) => {
                if (isSubmitting) {
                  e.preventDefault()
                }
              }}
            >
              {isSubmitting ? "Saving..." : (license ? "Update License" : "Add License")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
