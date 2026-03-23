"use client"

import type React from "react"
import { useMemo, useState } from "react"
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
import { Plus, Edit, Trash2 } from "lucide-react"
import type { ItemConfiguration, LookupOption } from "@/lib/services/itemConfigurationService"

type FormDataState = {
  itemTypeId: string
  processorId: string
  specification: string
  configurationText: string
  isActive: boolean
}

interface ItemConfigurationTableProps {
  data: ItemConfiguration[]
  itemTypes: LookupOption[]
  processors: LookupOption[]
  onAdd: (payload: FormDataState) => Promise<void>
  onEdit: (id: string, payload: FormDataState) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

const initialForm: FormDataState = {
  itemTypeId: "",
  processorId: "",
  specification: "",
  configurationText: "",
  isActive: true,
}

export function ItemConfigurationTable({
  data,
  itemTypes,
  processors,
  onAdd,
  onEdit,
  onDelete,
}: ItemConfigurationTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<ItemConfiguration | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [formData, setFormData] = useState<FormDataState>(initialForm)

  const filteredData = useMemo(() => {
    const q = searchTerm.toLowerCase()
    return data.filter((item) =>
      item.itemTypeName.toLowerCase().includes(q) ||
      item.processorName.toLowerCase().includes(q) ||
      item.specification.toLowerCase().includes(q) ||
      (item.configurationText || "").toLowerCase().includes(q),
    )
  }, [data, searchTerm])

  const totalItems = filteredData.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage)

  const handleAddClick = () => {
    setEditingItem(null)
    setFormData(initialForm)
    setIsFormOpen(true)
  }

  const handleEditClick = (item: ItemConfiguration) => {
    setEditingItem(item)
    setFormData({
      itemTypeId: item.itemTypeId,
      processorId: item.processorId,
      specification: item.specification,
      configurationText: item.configurationText || "",
      isActive: item.isActive,
    })
    setIsFormOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      if (editingItem) {
        await onEdit(editingItem.id, formData)
      } else {
        await onAdd(formData)
      }
      setIsFormOpen(false)
      setEditingItem(null)
      setFormData(initialForm)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!confirmDeleteId) return
    await onDelete(confirmDeleteId)
    setConfirmDeleteId(null)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Item Configurations</CardTitle>
          <Button onClick={handleAddClick}>
            <Plus className="h-4 w-4 mr-2" />
            Add Item Configuration
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Input
            placeholder="Search item type, processor, specification..."
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
              <TableHead>Item Type</TableHead>
              <TableHead>Processor</TableHead>
              <TableHead>Specification</TableHead>
              <TableHead>Configuration Text</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No records found
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.itemTypeName}</TableCell>
                  <TableCell>{item.processorName}</TableCell>
                  <TableCell>{item.specification}</TableCell>
                  <TableCell className="max-w-[320px] truncate">{item.configurationText || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={item.isActive ? "default" : "secondary"}>
                      {item.isActive ? "active" : "inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DateDisplay date={item.createdAt} />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEditClick(item)}>
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

        {totalPages > 1 && (
          <div className="mt-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <label htmlFor="pageSize" className="text-sm text-muted-foreground whitespace-nowrap">
                  Rows per page:
                </label>
                <select
                  id="pageSize"
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value))
                    setCurrentPage(1)
                  }}
                  className="px-3 py-1.5 border border-input rounded-md bg-background text-sm cursor-pointer"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
              <div className="flex-1">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  itemsPerPage={itemsPerPage}
                  totalItems={totalItems}
                />
              </div>
            </div>
          </div>
        )}
      </CardContent>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Item Configuration" : "Add Item Configuration"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="itemTypeId">Item Type</Label>
              <select
                id="itemTypeId"
                value={formData.itemTypeId}
                onChange={(e) => setFormData((prev) => ({ ...prev, itemTypeId: e.target.value }))}
                className="w-full p-2 border border-input rounded-md bg-background"
                required
              >
                <option value="">Select Item Type</option>
                {itemTypes.map((it) => (
                  <option key={it.id} value={it.id}>
                    {it.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="processorId">Processor</Label>
              <select
                id="processorId"
                value={formData.processorId}
                onChange={(e) => setFormData((prev) => ({ ...prev, processorId: e.target.value }))}
                className="w-full p-2 border border-input rounded-md bg-background"
                required
              >
                <option value="">Select Processor</option>
                {processors.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="specification">Specification</Label>
              <Input
                id="specification"
                value={formData.specification}
                onChange={(e) => setFormData((prev) => ({ ...prev, specification: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="configurationText">Configuration Text</Label>
              <Textarea
                id="configurationText"
                value={formData.configurationText}
                onChange={(e) => setFormData((prev) => ({ ...prev, configurationText: e.target.value }))}
                rows={4}
                required
              />
            </div>

            <div>
              <Label htmlFor="isActive">Status</Label>
              <select
                id="isActive"
                value={formData.isActive ? "active" : "inactive"}
                onChange={(e) => setFormData((prev) => ({ ...prev, isActive: e.target.value === "active" }))}
                className="w-full p-2 border border-input rounded-md bg-background"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : editingItem ? "Update" : "Add"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setIsFormOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!confirmDeleteId} onOpenChange={() => setConfirmDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Are you sure you want to delete this item configuration?</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setConfirmDeleteId(null)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteConfirm}>
                Delete
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
