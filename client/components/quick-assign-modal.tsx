"use client"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Search, Package, Laptop } from "lucide-react"
import { Employee } from "@/lib/types"
import { assetService } from "@/lib/services/assetService"
import { accessoryService } from "@/lib/services/accessoryService"

interface QuickAssignModalProps {
  employee: Employee | null
  isOpen: boolean
  onClose: () => void
  type: "asset" | "accessory"
}

interface Asset {
  id: string
  asset_tag: string
  name: string
  category: string
  status: string
}

interface Accessory {
  id: string
  name: string
  description?: string
  status: string
}

export function QuickAssignModal({ employee, isOpen, onClose, type }: QuickAssignModalProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [assignmentDate, setAssignmentDate] = useState(new Date().toISOString().split("T")[0])
  const [notes, setNotes] = useState("")
  const [availableAssets, setAvailableAssets] = useState<Asset[]>([])
  const [availableAccessories, setAvailableAccessories] = useState<Accessory[]>([])
  const [loading, setLoading] = useState(false)

  // Load available items when modal opens
  useEffect(() => {
    if (isOpen) {
      if (type === "asset") {
        loadAvailableAssets()
      } else {
        loadAvailableAccessories()
      }
    }
  }, [isOpen, type])

  const loadAvailableAssets = async () => {
    try {
      // Get assets that are not currently assigned to any employee
      const response = await assetService.getAssets({
        pageNumber: 1,
        pageSize: 1000,
        status: 1, // Available status (numeric value)
        assigned: false // Get unassigned assets
      });

      if (response && response.items) {
        setAvailableAssets(response.items.map(asset => ({
          id: asset.id,
          asset_tag: asset.assetTag,
          name: asset.name || asset.assetName || "", // Handle both possible property names
          category: asset.item,
          status: asset.status
        })));
      }
    } catch (error) {
      console.error("Error loading assets:", error)
    }
  }

  const loadAvailableAccessories = async () => {
    try {
      console.log("🔍 Loading available accessories for quick assign...")
      
      const response = await accessoryService.getAccessories({
        pageNumber: 1,
        pageSize: 1000,
        status: "active"
      });

      if (response && response.items) {
        const data = response.items.map(accessory => ({
          id: accessory.id,
          name: accessory.name || "", // Add null protection
          description: accessory.description,
          status: accessory.status
        }));
        
        console.log("📊 Raw accessories data from database:", data)
        console.log("📊 Number of active accessories found:", data?.length || 0)
        
        setAvailableAccessories(data || [])
      }
    } catch (error) {
      console.error("❌ Error loading accessories:", error)
    }
  }

  if (!employee) return null

  const items = type === "asset" ? availableAssets : availableAccessories
  const filteredItems = items.filter(
    (item) =>
      (item.name && item.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (type === "asset" && "assetTag" in item && item.assetTag && item.assetTag.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const handleItemToggle = (itemId: string) => {
    setSelectedItems((prev) => {
      if (prev.includes(itemId)) {
        // Remove item and its quantity
        const newQuantities = { ...quantities }
        delete newQuantities[itemId]
        setQuantities(newQuantities)
        return prev.filter((id) => id !== itemId)
      } else {
        // Add item with default quantity
        setQuantities((prev) => ({ ...prev, [itemId]: 1 }))
        return [...prev, itemId]
      }
    })
  }

  const handleQuantityChange = (itemId: string, quantity: number) => {
    setQuantities((prev) => ({ ...prev, [itemId]: Math.max(1, quantity) }))
  }

  const handleAssign = async () => {
    if (selectedItems.length === 0) return

    setLoading(true)
    try {
      if (type === "asset") {
        // Create assignments in employee_assets table
        console.log("Assigning assets to employee:", employee.id, employee.code, employee.name, "Asset IDs:", selectedItems)
        
        // Assign each asset to the employee using the new API
        for (const assetId of selectedItems) {
          await assetService.assignAsset(assetId, {
            employeeId: employee.id,
            notes: notes || "Asset assigned via quick assign modal"
          });
        }
        console.log("Assets assigned successfully")
      } else {
        // Assign accessories with quantities using the new API
        for (const accessoryId of selectedItems) {
          await accessoryService.assignAccessory(accessoryId, {
            employeeId: employee.id,
            quantity: quantities[accessoryId] || 1,
            notes: notes || "Accessory assigned via quick assign modal"
          });
        }
      }

      // Reset form and close modal
      setSelectedItems([])
      setQuantities({})
      setSearchTerm("")
      setNotes("")
      onClose()
    } catch (error) {
      console.error("Error assigning items:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] w-[95vw] h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            {type === "asset" ? <Laptop className="h-5 w-5" /> : <Package className="h-5 w-5" />}
            Quick Assign {type === "asset" ? "Asset" : "Accessory"} - {employee.name} ({employee.code})
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 pr-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={`Search available ${type}s...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Available Items */}
          <div className="space-y-2 max-h-96 overflow-y-auto border rounded-lg p-4">
            <Label className="text-sm font-medium">Available {type === "asset" ? "Assets" : "Accessories"}</Label>
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedItems.includes(item.id) ? "bg-cyan-50 border-cyan-200" : "hover:bg-muted"
                }`}
                onClick={() => handleItemToggle(item.id)}
              >
                <div className="flex-1">
                  <div className="font-medium">{item.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {type === "asset" && "asset_tag" in item && <span className="font-mono">{item.asset_tag} • </span>}
                    {type === "asset" && "category" in item && item.category}
                    {type === "accessory" && "description" in item && item.description}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {selectedItems.includes(item.id) && type === "accessory" && (
                    <Input
                      type="number"
                      min="1"
                      value={quantities[item.id] || 1}
                      onChange={(e) => {
                        e.stopPropagation()
                        handleQuantityChange(item.id, Number(e.target.value) || 1)
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="w-16 h-8 text-center"
                    />
                  )}
                  {selectedItems.includes(item.id) && <Badge variant="default">Selected</Badge>}
                </div>
              </div>
            ))}
            {filteredItems.length === 0 && (
              <div className="text-center py-4 text-muted-foreground">
                {items.length === 0 ? (
                  <div>
                    <div>No {type}s available for assignment.</div>
                    {type === "accessory" && (
                      <div className="text-xs mt-1">
                        Please add accessories in Master Data → Accessories
                      </div>
                    )}
                  </div>
                ) : (
                  `No ${type}s found matching your search.`
                )}
              </div>
            )}
          </div>

          {/* Selected Items Summary */}
          {selectedItems.length > 0 && (
            <div className="p-4 bg-muted rounded-lg">
              <Label className="text-sm font-medium">Selected Items ({selectedItems.length})</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedItems.map((itemId) => {
                  const item = items.find((i) => i.id === itemId)
                  const quantity = quantities[itemId] || 1
                  return item ? (
                    <Badge key={itemId} variant="secondary">
                      {item.name}
                      {type === "accessory" && quantity > 1 && ` (${quantity})`}
                    </Badge>
                  ) : null
                })}
              </div>
            </div>
          )}

          {/* Assignment Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="assignmentDate">Assignment Date</Label>
              <Input
                id="assignmentDate"
                type="date"
                value={assignmentDate}
                onChange={(e) => setAssignmentDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Employee</Label>
              <div className="p-2 bg-muted rounded-md text-sm">
                {employee.name} ({employee.code}) - {employee.department}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes about this assignment..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 flex-shrink-0">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleAssign}
              disabled={selectedItems.length === 0 || loading}
              className="bg-cyan-600 hover:bg-cyan-700"
            >
              {loading ? "Assigning..." : `Assign ${selectedItems.length} ${type}${selectedItems.length !== 1 ? "s" : ""}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
