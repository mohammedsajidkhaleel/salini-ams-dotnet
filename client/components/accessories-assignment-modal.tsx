"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { X, Plus, Trash2, Package } from "lucide-react"
import { accessoryService } from "@/lib/services/accessoryService"

interface Accessory {
  id: string
  name: string
  description?: string
  status: string
}

interface EmployeeAccessory {
  id: string
  accessory_id: string
  accessory_name: string
  quantity: number
  assigned_date: string
  status: string
  notes?: string
}

interface AccessoriesAssignmentModalProps {
  isOpen: boolean
  onClose: () => void
  employeeId: string
  employeeName: string
}

export function AccessoriesAssignmentModal({
  isOpen,
  onClose,
  employeeId,
  employeeName,
}: AccessoriesAssignmentModalProps) {
  const [accessories, setAccessories] = useState<Accessory[]>([])
  const [assignedAccessories, setAssignedAccessories] = useState<EmployeeAccessory[]>([])
  const [selectedAccessory, setSelectedAccessory] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)

  // Load accessories and current assignments
  useEffect(() => {
    if (isOpen && employeeId) {
      loadAccessories()
      loadAssignedAccessories()
    }
  }, [isOpen, employeeId])

  const loadAccessories = async () => {
    try {
      console.log("🔍 Loading accessories for assignment...")
      
      const response = await accessoryService.getAccessories({
        pageNumber: 1,
        pageSize: 1000,
        status: "active"
      });

      if (response && response.items) {
        const data = response.items.map(accessory => ({
          id: accessory.id,
          name: accessory.name,
          description: accessory.description,
          status: accessory.status
        }));
        
        console.log("📊 Raw accessories data from database:", data)
        console.log("📊 Number of active accessories found:", data?.length || 0)
        
        setAccessories(data || [])
      }
    } catch (error) {
      console.error("❌ Error loading accessories:", error)
    }
  }

  const loadAssignedAccessories = async () => {
    try {
      console.log("🔍 Loading assigned accessories for employee:", employeeId)
      
      // Use proper backend filtering with assignedTo parameter
      const response = await accessoryService.getAccessories({
        pageNumber: 1,
        pageSize: 1000,
        assignedTo: employeeId
      });

      if (response && response.items) {
        console.log("📊 Accessories assigned to employee:", response.items.length)

        const formattedData = response.items.map((item: any) => ({
          id: item.id,
          accessory_id: item.id,
          accessory_name: item.name,
          quantity: item.quantity || 1,
          assigned_date: item.currentAssignment?.assignedDate,
          status: item.status,
          notes: item.notes,
        }));

        setAssignedAccessories(formattedData)
      }
    } catch (error) {
      console.error("Error loading assigned accessories:", error)
    }
  }

  const handleAssignAccessory = async () => {
    if (!selectedAccessory || quantity < 1) return

    setLoading(true)
    try {
      await accessoryService.assignAccessory(selectedAccessory, {
        employeeId: employeeId,
        quantity: quantity,
        notes: notes || "Accessory assigned via assignment modal"
      });

      // Reset form
      setSelectedAccessory("")
      setQuantity(1)
      setNotes("")

      // Reload assigned accessories
      await loadAssignedAccessories()
    } catch (error) {
      console.error("Error assigning accessory:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleReturnAccessory = async (assignmentId: string) => {
    if (!confirm("Are you sure you want to return this accessory?")) return

    setLoading(true)
    try {
      await accessoryService.unassignAccessory(assignmentId, {
        employeeId: employeeId,
        notes: "Accessory returned via assignment modal"
      });

      // Reload assigned accessories
      await loadAssignedAccessories()
    } catch (error) {
      console.error("Error returning accessory:", error)
    } finally {
      setLoading(false)
    }
  }

  const selectedAccessoryName = accessories.find(a => a.id === selectedAccessory)?.name || ""

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Assign Accessories - {employeeName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Assignment Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Assign New Accessory</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="accessory">Accessory</Label>
                  <Select value={selectedAccessory} onValueChange={setSelectedAccessory}>
                    <SelectTrigger>
                      <SelectValue placeholder={accessories.length === 0 ? "No accessories available" : "Select accessory"} />
                    </SelectTrigger>
                    <SelectContent>
                      {accessories.length === 0 ? (
                        <SelectItem value="" disabled>
                          No active accessories available. Please add accessories in Master Data.
                        </SelectItem>
                      ) : (
                        accessories.map((accessory) => (
                          <SelectItem key={accessory.id} value={accessory.id}>
                            {accessory.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value) || 1)}
                    placeholder="1"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Input
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Additional notes..."
                  />
                </div>
              </div>

              {accessories.length === 0 && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="text-sm text-yellow-800">
                    <strong>No accessories available:</strong> Please add accessories in Master Data → Accessories before assigning them to employees.
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <Button
                  onClick={handleAssignAccessory}
                  disabled={!selectedAccessory || quantity < 1 || loading || accessories.length === 0}
                  className="bg-cyan-600 hover:bg-cyan-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Assign Accessory
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Currently Assigned Accessories */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Currently Assigned Accessories</CardTitle>
            </CardHeader>
            <CardContent>
              {assignedAccessories.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No accessories assigned to this employee
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Accessory</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Assigned Date</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignedAccessories.map((assignment) => (
                      <TableRow key={assignment.id}>
                        <TableCell>
                          <div className="font-medium">{assignment.accessory_name}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{assignment.quantity}</Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(assignment.assigned_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {assignment.notes || "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleReturnAccessory(assignment.id)}
                            disabled={loading}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
