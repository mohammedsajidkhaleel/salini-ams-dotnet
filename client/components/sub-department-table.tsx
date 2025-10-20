"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Pagination } from "@/components/ui/pagination"
import { DateDisplay } from "@/components/ui/date-display"
import { Search, Plus, Edit, Trash2, X } from "lucide-react"

interface SubDepartment {
  id: string
  name: string
  description?: string
  departmentId: string
  departmentName: string
  status: "active" | "inactive"
  createdAt: string
}

interface Department {
  id: string
  name: string
}

interface SubDepartmentTableProps {
  data: SubDepartment[]
  departments: Department[]
  onAdd: (item: Omit<SubDepartment, "id" | "createdAt">) => Promise<void>
  onEdit: (id: string, item: Omit<SubDepartment, "id" | "createdAt">) => Promise<void>
  onDelete: (id: string) => void
  onLoadDependencies?: () => Promise<void>
}

export function SubDepartmentTable({ data, departments, onAdd, onEdit, onDelete, onLoadDependencies }: SubDepartmentTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("")
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<SubDepartment | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    departmentId: "",
    departmentName: "",
    status: "active" as const,
  })
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Debug logging
  console.log('SubDepartmentTable - departments:', departments)
  console.log('SubDepartmentTable - data:', data)

  // Load departments if not available
  useEffect(() => {
    if (departments.length === 0 && onLoadDependencies) {
      console.log('Loading departments for filter dropdown...')
      onLoadDependencies()
    }
  }, [departments.length, onLoadDependencies])

  // Pagination settings
  const itemsPerPage = 10

  const filteredData = data.filter(
    (item) => {
      const matchesSearch = 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.departmentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.description || "").toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesDepartment = !selectedDepartmentId || item.departmentId === selectedDepartmentId
      
      return matchesSearch && matchesDepartment
    }
  )

  const totalItems = filteredData.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  
  // Calculate paginated data
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedData = filteredData.slice(startIndex, endIndex)

  const handleAdd = async () => {
    setEditingItem(null)
    setFormData({
      name: "",
      description: "",
      departmentId: "",
      departmentName: "",
      status: "active",
    })
    
    // Load dependencies if not already loaded
    if (departments.length === 0 && onLoadDependencies) {
      await onLoadDependencies()
    }
    
    setIsFormOpen(true)
  }

  const handleEdit = async (item: SubDepartment) => {
    setEditingItem(item)
    setFormData({
      name: item.name,
      description: item.description,
      departmentId: item.departmentId,
      departmentName: item.departmentName,
      status: item.status,
    })
    
    // Load dependencies if not already loaded
    if (departments.length === 0 && onLoadDependencies) {
      await onLoadDependencies()
    }
    
    setIsFormOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('SubDepartment form submitted with data:', formData)
    
    setIsSubmitting(true)
    
    const selectedDepartment = departments.find((dept) => dept.id === formData.departmentId)
    const submitData = {
      ...formData,
      departmentName: selectedDepartment?.name || "",
    }

    console.log('SubDepartment submit data:', submitData)

    try {
      if (editingItem) {
        console.log('Editing sub-department:', editingItem.id)
        await onEdit(editingItem.id, submitData)
      } else {
        console.log('Adding new sub-department')
        await onAdd(submitData)
      }
      setIsFormOpen(false)
      console.log('SubDepartment form submission completed successfully')
    } catch (error) {
      console.error('SubDepartment form submission error:', error)
      // Don't close the form if there's an error
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDepartmentChange = (departmentId: string) => {
    const selectedDepartment = departments.find((dept) => dept.id === departmentId)
    setFormData((prev) => ({
      ...prev,
      departmentId,
      departmentName: selectedDepartment?.name || "",
    }))
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Sub Departments</CardTitle>
          <Button onClick={handleAdd} className="bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" />
            Add Sub Department
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex items-center gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search sub departments..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
            />
          </div>
          <div className="min-w-[200px]">
            <select
              value={selectedDepartmentId}
              onChange={(e) => {
                setSelectedDepartmentId(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full p-2 border border-input rounded-md bg-background cursor-pointer"
              disabled={departments.length === 0}
            >
              <option value="">
                {departments.length === 0 ? "Loading departments..." : "All Departments"}
              </option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
            {departments.length === 0 && (
              <div className="text-xs text-muted-foreground mt-1">
                Loading department data...
              </div>
            )}
          </div>
        </div>
        
        {/* Filter Summary */}
        {(selectedDepartmentId || searchTerm) && (
          <div className="mb-4 p-3 bg-muted rounded-lg">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {filteredData.length} of {data.length} sub departments
                {selectedDepartmentId && (
                  <span className="ml-2">
                    • Filtered by: <strong>{departments.find(d => d.id === selectedDepartmentId)?.name}</strong>
                  </span>
                )}
                {searchTerm && (
                  <span className="ml-2">
                    • Search: <strong>"{searchTerm}"</strong>
                  </span>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedDepartmentId("")
                  setSearchTerm("")
                  setCurrentPage(1)
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4 mr-1" />
                Clear Filters
              </Button>
            </div>
          </div>
        )}
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
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
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.departmentName}</TableCell>
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
              onPageChange={setCurrentPage}
              itemsPerPage={itemsPerPage}
              totalItems={totalItems}
            />
          </div>
        )}
      </CardContent>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Sub Department" : "Add New Sub Department"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="department">Department</Label>
              <select
                id="department"
                value={formData.departmentId}
                onChange={(e) => handleDepartmentChange(e.target.value)}
                className="w-full p-2 border border-input rounded-md bg-background"
                required
              >
                <option value="">Select Department</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value as "active" | "inactive" }))}
                className="w-full p-2 border border-input rounded-md bg-background"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? (editingItem ? "Updating..." : "Adding...") : (editingItem ? "Update" : "Add")} Sub Department
              </Button>
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} className="flex-1" disabled={isSubmitting}>
                Cancel
              </Button>
            </div>
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
            <p>Are you sure you want to delete this sub department? This action cannot be undone.</p>
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
