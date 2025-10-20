"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Pagination } from "@/components/ui/pagination"
import { DateDisplay } from "@/components/ui/date-display"
import { Plus, Edit, Trash2 } from "lucide-react"

interface ProjectItem {
  id: string
  code: string
  name: string
  description?: string
  status: "active" | "inactive"
  companyId?: string
  companyName?: string
  costCenterId?: string
  costCenterName?: string
  nationalityId?: string
  nationalityName?: string
  createdAt: string
}

interface ProjectTableProps {
  data: ProjectItem[]
  companies: Array<{ id: string; name: string }>
  costCenters: Array<{ id: string; name: string }>
  nationalities: Array<{ id: string; name: string }>
  onAdd?: (item: Omit<ProjectItem, "id" | "createdAt">) => Promise<void> | void
  onEdit?: (id: string, item: Omit<ProjectItem, "id" | "createdAt">) => Promise<void> | void
  onDelete?: (id: string) => Promise<void> | void
}

export function ProjectTable({ data, companies, costCenters, nationalities, onAdd, onEdit, onDelete }: ProjectTableProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<ProjectItem | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortKey, setSortKey] = useState<keyof ProjectItem>("name")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
    status: "active" as "active" | "inactive",
    companyId: "",
    costCenterId: "",
    nationalityId: "",
  })
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Pagination settings
  const itemsPerPage = 10
  const safeData: ProjectItem[] = Array.isArray(data) ? data : []

  // Filter by search
  const filteredData = safeData.filter((item) => {
    const q = searchTerm.toLowerCase()
    return (
      (item.code || "").toLowerCase().includes(q) ||
      (item.name || "").toLowerCase().includes(q) ||
      (item.description || "").toLowerCase().includes(q) ||
      (item.status || "").toLowerCase().includes(q) ||
      (item.companyName || "").toLowerCase().includes(q) ||
      (item.costCenterName || "").toLowerCase().includes(q) ||
      (item.nationalityName || "").toLowerCase().includes(q) ||
      (item.createdAt || "").toLowerCase().includes(q)
    )
  })

  // Sort
  const sortedData = [...filteredData].sort((a, b) => {
    const aVal = (a[sortKey] ?? "") as string
    const bVal = (b[sortKey] ?? "") as string
    if (aVal < bVal) return sortDir === "asc" ? -1 : 1
    if (aVal > bVal) return sortDir === "asc" ? 1 : -1
    return 0
  })

  const totalItems = sortedData.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  
  // Calculate paginated data
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedData = sortedData.slice(startIndex, endIndex)

  // Keep currentPage in bounds when data changes
  useEffect(() => {
    if (totalPages === 0 && currentPage !== 1) {
      setCurrentPage(1)
      return
    }
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [totalPages, currentPage])

  // Fallback API calls when parent doesn't provide handlers.
  const fallbackAdd = async (payload: Omit<ProjectItem, "id" | "createdAt">) => {
    console.debug("fallbackAdd payload:", payload)
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(text || "Failed to add project")
    }
    return res.json()
  }

  const fallbackEdit = async (id: string, payload: Omit<ProjectItem, "id" | "createdAt">) => {
    console.debug("fallbackEdit id:", id, "payload:", payload)
    const res = await fetch(`/api/projects/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(text || "Failed to update project")
    }
    return res.json()
  }

  const fallbackDelete = async (id: string) => {
    console.debug("fallbackDelete id:", id)
    const res = await fetch(`/api/projects/${id}`, {
      method: "DELETE",
    })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(text || "Failed to delete project")
    }
    return res.json()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("🚀 Form submitted!", { editingItem, formData, isSubmitting })
    if (isSubmitting) {
      console.log("❌ Already submitting, returning early")
      return
    }
    setError(null)
    setIsSubmitting(true)
    console.debug("handleSubmit start", { editingItem, formData })

    try {
      if (editingItem) {
        const payload = formData
        if (onEdit) {
          await onEdit(editingItem.id, payload)
        } else {
          await fallbackEdit(editingItem.id, payload)
        }
        // Close edit dialog only after success
        setEditingItem(null)
        setFormData({ code: "", name: "", description: "", status: "active", companyId: "", costCenterId: "", nationalityId: "" })
      } else {
        const payload = formData
        if (onAdd) {
          await onAdd(payload)
        } else {
          await fallbackAdd(payload)
        }
        // Close add dialog only after success
        setIsAddDialogOpen(false)
        setFormData({ code: "", name: "", description: "", status: "active", companyId: "", costCenterId: "", nationalityId: "" })
      }
    } catch (err) {
      console.error("Error in project operation:", err)
      setError(err instanceof Error ? err.message : "An error occurred while saving the project")
      // Keep form data so user can correct input
    } finally {
      setIsSubmitting(false)
      console.debug("handleSubmit end")
    }
  }

  const handleEdit = (item: ProjectItem) => {
    setEditingItem(item)
    setError(null)
    setFormData({
      code: item.code || "",
      name: item.name || "",
      description: item.description || "",
      status: item.status || "active",
      companyId: item.companyId || "",
      costCenterId: item.costCenterId || "",
      nationalityId: item.nationalityId || "",
    })
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  // delete handler used by confirmation button
  const confirmDelete = async (id: string) => {
    setError(null)
    if (isSubmitting) return
    setIsSubmitting(true)
    try {
      if (onDelete) {
        await onDelete(id)
      } else {
        await fallbackDelete(id)
      }
      setConfirmDeleteId(null)
    } catch (err) {
      console.error("Error deleting project:", err)
      setError(err instanceof Error ? err.message : "Failed to delete project")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Projects</CardTitle>
        <Dialog open={isAddDialogOpen} onOpenChange={(open) => setIsAddDialogOpen(open)}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add New
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Project</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="code">Code</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    required
                    placeholder="e.g., PROJ001"
                  />
                </div>
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="companyId">Company *</Label>
                  <select
                    id="companyId"
                    value={formData.companyId}
                    onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                    className="w-full p-2 border border-input rounded-md bg-background"
                    required
                  >
                    <option value="">Select Company</option>
                    {companies.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="costCenterId">Cost Center</Label>
                  <select
                    id="costCenterId"
                    value={formData.costCenterId}
                    onChange={(e) => setFormData({ ...formData, costCenterId: e.target.value })}
                    className="w-full p-2 border border-input rounded-md bg-background"
                  >
                    <option value="">Select Cost Center</option>
                    {costCenters.map((costCenter) => (
                      <option key={costCenter.id} value={costCenter.id}>
                        {costCenter.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <Label htmlFor="nationalityId">Country/Nationality</Label>
                <select
                  id="nationalityId"
                  value={formData.nationalityId}
                  onChange={(e) => setFormData({ ...formData, nationalityId: e.target.value })}
                  className="w-full p-2 border border-input rounded-md bg-background"
                >
                  <option value="">Select Country/Nationality</option>
                  {nationalities.map((nationality) => (
                    <option key={nationality.id} value={nationality.id}>
                      {nationality.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as "active" | "inactive" })}
                    className="w-full p-2 border border-input rounded-md bg-background"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isSubmitting}
                onClick={() => console.log("🔘 Add Project button clicked", { isSubmitting, formData })}
              >
                {isSubmitting ? "Adding..." : "Add Project"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex items-center">
          <Input
            placeholder="Search Projects"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setCurrentPage(1)
            }}
          />
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <button
                    className="font-medium hover:underline"
                    onClick={() => {
                      setSortKey("code")
                      setSortDir(sortKey === "code" && sortDir === "asc" ? "desc" : "asc")
                      setCurrentPage(1)
                    }}
                  >
                    Code {sortKey === "code" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    className="font-medium hover:underline"
                    onClick={() => {
                      setSortKey("name")
                      setSortDir(sortKey === "name" && sortDir === "asc" ? "desc" : "asc")
                      setCurrentPage(1)
                    }}
                  >
                    Name {sortKey === "name" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                  </button>
                </TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Cost Center</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>
                  <button
                    className="font-medium hover:underline"
                    onClick={() => {
                      setSortKey("status")
                      setSortDir(sortKey === "status" && sortDir === "asc" ? "desc" : "asc")
                      setCurrentPage(1)
                    }}
                  >
                    Status {sortKey === "status" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                  </button>
                </TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    No records found
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.code || "-"}</TableCell>
                    <TableCell className="font-medium">{item.name || "-"}</TableCell>
                    <TableCell>{item.description || "-"}</TableCell>
                    <TableCell>{item.companyName || "-"}</TableCell>
                    <TableCell>{item.costCenterName || "-"}</TableCell>
                    <TableCell>{item.nationalityName || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={item.status === "active" ? "default" : "secondary"}>{item.status || "-"}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setConfirmDeleteId(item.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              itemsPerPage={itemsPerPage}
              totalItems={totalItems}
            />
          </div>
        )}
      </CardContent>

      {/* Edit Dialog */}
      <Dialog open={!!editingItem} onOpenChange={(open) => { if (!open) setEditingItem(null) }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-code">Code</Label>
                <Input
                  id="edit-code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  required
                  placeholder="e.g., PROJ001"
                />
              </div>
              <div>
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Input
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-companyId">Company *</Label>
                <select
                  id="edit-companyId"
                  value={formData.companyId}
                  onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                  className="w-full p-2 border border-input rounded-md bg-background"
                  required
                >
                  <option value="">Select Company</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="edit-costCenterId">Cost Center</Label>
                <select
                  id="edit-costCenterId"
                  value={formData.costCenterId}
                  onChange={(e) => setFormData({ ...formData, costCenterId: e.target.value })}
                  className="w-full p-2 border border-input rounded-md bg-background"
                >
                  <option value="">Select Cost Center</option>
                  {costCenters.map((costCenter) => (
                    <option key={costCenter.id} value={costCenter.id}>
                      {costCenter.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <Label htmlFor="edit-nationalityId">Country/Nationality</Label>
              <select
                id="edit-nationalityId"
                value={formData.nationalityId}
                onChange={(e) => setFormData({ ...formData, nationalityId: e.target.value })}
                className="w-full p-2 border border-input rounded-md bg-background"
              >
                <option value="">Select Country/Nationality</option>
                {nationalities.map((nationality) => (
                  <option key={nationality.id} value={nationality.id}>
                    {nationality.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="edit-status">Status</Label>
                <select
                  id="edit-status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as "active" | "inactive" })}
                  className="w-full p-2 border border-input rounded-md bg-background"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              Update Project
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!confirmDeleteId} onOpenChange={() => setConfirmDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Are you sure you want to delete this project? This action cannot be undone.</p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setConfirmDeleteId(null)}>Cancel</Button>
              <Button
                variant="destructive"
                onClick={async () => {
                  if (confirmDeleteId) {
                    await confirmDelete(confirmDeleteId)
                  }
                }}
                disabled={isSubmitting}
              >
                Delete
              </Button>
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
