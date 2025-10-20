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

interface CostCenterItem {
  id: string
  code: string
  name: string
  description?: string
  status: "active" | "inactive"
  createdAt: string
}

interface CostCenterTableProps {
  data: CostCenterItem[]
  onAdd: (item: Omit<CostCenterItem, "id" | "createdAt">) => Promise<void>
  onEdit: (id: string, item: Omit<CostCenterItem, "id" | "createdAt">) => Promise<void>
  onDelete: (id: string) => void
}

export function CostCenterTable({ data, onAdd, onEdit, onDelete }: CostCenterTableProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<CostCenterItem | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortKey, setSortKey] = useState<keyof CostCenterItem>("name")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
    status: "active" as "active" | "inactive",
  })
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Pagination settings
  const itemsPerPage = 10
  const safeData: CostCenterItem[] = Array.isArray(data) ? data : []

  // Filter by search
  const filteredData = safeData.filter((item) => {
    const q = searchTerm.toLowerCase()
    return (
      (item.code || "").toLowerCase().includes(q) ||
      (item.name || "").toLowerCase().includes(q) ||
      (item.description || "").toLowerCase().includes(q) ||
      (item.status || "").toLowerCase().includes(q) ||
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Cost center form submitted with data:", formData)
    console.log("Form submission triggered at:", new Date().toISOString())
    setError(null)
    
    try {
      if (editingItem) {
        console.log("Editing cost center:", editingItem.id)
        await onEdit(editingItem.id, formData)
        setEditingItem(null)
        setFormData({ code: "", name: "", description: "", status: "active" })
      } else {
        console.log("Adding new cost center")
        await onAdd(formData)
        setIsAddDialogOpen(false)
        setFormData({ code: "", name: "", description: "", status: "active" })
      }
      console.log("Cost center operation completed successfully")
    } catch (error) {
      console.error("Error in cost center operation:", error)
      setError(error instanceof Error ? error.message : "An error occurred while saving the cost center")
      // Don't reset form data on error so user can see what they entered and fix it
    }
  }

  const handleEdit = (item: CostCenterItem) => {
    setEditingItem(item)
    setError(null)
    setFormData({
      code: item.code || "",
      name: item.name || "",
      description: item.description || "",
      status: item.status || "active",
    })
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Cost Centers</CardTitle>
        <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
          setIsAddDialogOpen(open)
          if (open) {
            setError(null)
            setFormData({ code: "", name: "", description: "", status: "active" })
          } else {
            // Reset form when dialog closes
            setFormData({ code: "", name: "", description: "", status: "active" })
            setError(null)
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add New
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Cost Center</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  <div className="flex justify-between items-center">
                    <span>{error}</span>
                    <button
                      type="button"
                      onClick={() => setError(null)}
                      className="text-red-500 hover:text-red-700 ml-2"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}
              <div>
                <Label htmlFor="code">Code</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  required
                  placeholder="e.g., CC001"
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
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
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
              <Button type="submit" className="w-full">
                Add Cost Center
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex items-center">
          <Input
            placeholder="Search Cost Centers"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setCurrentPage(1)
            }}
          />
        </div>
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
              <TableHead>
                <button
                  className="font-medium hover:underline"
                  onClick={() => {
                    setSortKey("description")
                    setSortDir(sortKey === "description" && sortDir === "asc" ? "desc" : "asc")
                    setCurrentPage(1)
                  }}
                >
                  Description {sortKey === "description" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                </button>
              </TableHead>
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
              <TableHead>
                <button
                  className="font-medium hover:underline"
                  onClick={() => {
                    setSortKey("createdAt")
                    setSortDir(sortKey === "createdAt" && sortDir === "asc" ? "desc" : "asc")
                    setCurrentPage(1)
                  }}
                >
                  Created {sortKey === "createdAt" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                </button>
              </TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No records found
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.code}</TableCell>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.description || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={item.status === "active" ? "default" : "secondary"}>{item.status}</Badge>
                  </TableCell>
                  <TableCell><DateDisplay date={item.createdAt} /></TableCell>
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
      <Dialog open={!!editingItem} onOpenChange={(open) => {
        if (!open) {
          setEditingItem(null)
          setError(null)
          setFormData({ code: "", name: "", description: "", status: "active" })
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Cost Center</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                <div className="flex justify-between items-center">
                  <span>{error}</span>
                  <button
                    type="button"
                    onClick={() => setError(null)}
                    className="text-red-500 hover:text-red-700 ml-2"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}
            <div>
              <Label htmlFor="edit-code">Code</Label>
              <Input
                id="edit-code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                required
                placeholder="e.g., CC001"
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
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Input
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
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
            <Button type="submit" className="w-full">
              Update Cost Center
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
            <p>Are you sure you want to delete this cost center? This action cannot be undone.</p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setConfirmDeleteId(null)}>Cancel</Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (confirmDeleteId) {
                    onDelete(confirmDeleteId)
                    setConfirmDeleteId(null)
                  }
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
