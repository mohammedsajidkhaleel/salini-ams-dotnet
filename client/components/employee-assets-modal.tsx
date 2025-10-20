"use client"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Monitor, Laptop, Smartphone, Headphones, Mouse, Keyboard, Trash2 } from "lucide-react"
import { useState, useEffect } from "react"
import { Employee } from "@/lib/types"
import { assetService } from "@/lib/services/assetService"
import { accessoryService } from "@/lib/services/accessoryService"

interface Asset {
  id: string
  assetTag: string
  name: string
  category: string
  brand: string
  model: string
  serialNumber: string
  assignedDate: string
  status: "assigned" | "available" | "maintenance"
  condition: "excellent" | "good" | "fair" | "poor"
}

interface Accessory {
  id: string
  name: string
  category: string
  brand: string
  model: string
  serialNumber: string
  assignedDate: string
  condition: "excellent" | "good" | "fair" | "poor"
}

interface EmployeeAssetsModalProps {
  employee: Employee | null
  isOpen: boolean
  onClose: () => void
}


const getCategoryIcon = (category: string) => {
  switch (category.toLowerCase()) {
    case "laptops":
      return <Laptop className="h-4 w-4" />
    case "monitors":
      return <Monitor className="h-4 w-4" />
    case "smartphones":
      return <Smartphone className="h-4 w-4" />
    case "headphones":
      return <Headphones className="h-4 w-4" />
    case "mouse":
      return <Mouse className="h-4 w-4" />
    case "keyboards":
      return <Keyboard className="h-4 w-4" />
    default:
      return <Monitor className="h-4 w-4" />
  }
}

export function EmployeeAssetsModal({ employee, isOpen, onClose }: EmployeeAssetsModalProps) {
  const [assignedAssets, setAssignedAssets] = useState<Asset[]>([])
  const [assignedAccessories, setAssignedAccessories] = useState<Accessory[]>([])
  const [loading, setLoading] = useState(false)

  // Load employee's assigned assets and accessories when modal opens
  useEffect(() => {
    if (isOpen && employee) {
      loadEmployeeAssets()
      loadEmployeeAccessories()
    }
  }, [isOpen, employee])

  const loadEmployeeAssets = async () => {
    try {
      setLoading(true)
      console.log("🔍 Loading assets for employee:", employee?.name, employee?.code, employee?.id)
      
      // Use proper backend filtering with assignedTo parameter
      const response = await assetService.getAssets({
        pageNumber: 1,
        pageSize: 1000,
        assignedTo: employee?.id
      });

      if (response && response.items) {
        console.log("📊 Assets assigned to employee:", response.items.length)

        const mappedAssets: Asset[] = response.items.map((asset: any) => ({
          id: asset.id,
          assetTag: asset.assetTag || "",
          name: asset.assetName || "",
          category: asset.item || "",
          brand: asset.brand || "",
          model: asset.model || "",
          serialNumber: asset.serialNumber || "",
          assignedDate: asset.currentAssignment?.assignedDate ? new Date(asset.currentAssignment.assignedDate).toISOString().split("T")[0] : "",
          status: asset.status || "assigned",
          condition: asset.condition || "good",
        }));

        console.log("📊 Mapped assets for display:", mappedAssets)
        setAssignedAssets(mappedAssets)
      }
    } catch (error) {
      console.error("❌ Error loading employee assets:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadEmployeeAccessories = async () => {
    try {
      console.log("🔍 Loading accessories for employee:", employee?.name, employee?.id)
      
      // Use proper backend filtering with assignedTo parameter
      const response = await accessoryService.getAccessories({
        pageNumber: 1,
        pageSize: 1000,
        assignedTo: employee?.id
      });

      if (response && response.items) {
        console.log("📊 Accessories assigned to employee:", response.items.length)

        const mappedAccessories: Accessory[] = response.items.map((accessory: any) => ({
          id: accessory.id,
          name: accessory.name || "",
          category: "Accessory",
          brand: accessory.brand || "",
          model: accessory.model || "",
          serialNumber: accessory.serialNumber || "",
          assignedDate: accessory.currentAssignment?.assignedDate ? new Date(accessory.currentAssignment.assignedDate).toISOString().split("T")[0] : "",
          condition: "good" as const,
        }));

        console.log("📊 Mapped accessories for display:", mappedAccessories)
        setAssignedAccessories(mappedAccessories)
      }
    } catch (error) {
      console.error("❌ Error loading employee accessories:", error)
    }
  }

  if (!employee) return null

  const totalValue = assignedAssets.reduce((sum, asset) => sum + 2000, 0) // Mock calculation

  const handleUnassignAsset = async (assetId: string) => {
    try {
      await assetService.unassignAsset(assetId, "Asset unassigned via employee assets modal");
      setAssignedAssets((prev) => prev.filter((asset) => asset.id !== assetId))
    } catch (error) {
      console.error("Error unassigning asset:", error)
    }
  }

  const handleUnassignAccessory = async (accessoryId: string) => {
    try {
      await accessoryService.unassignAccessory(accessoryId, {
        employeeId: employee.id,
        notes: "Accessory unassigned via employee assets modal"
      });
      setAssignedAccessories((prev) => prev.filter((accessory) => accessory.id !== accessoryId))
    } catch (error) {
      console.error("Error unassigning accessory:", error)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[98vw] max-h-[95vh] w-[98vw] h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            Assets & Accessories - {employee.name} ({employee.code})
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-muted-foreground">Loading assets and accessories...</div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-6 pr-2">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Assets</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-cyan-600">{assignedAssets.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Accessories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-600">{assignedAccessories.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Estimated Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">${totalValue.toLocaleString()}</div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="assets" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="assets">Assets ({assignedAssets.length})</TabsTrigger>
              <TabsTrigger value="accessories">Accessories ({assignedAccessories.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="assets" className="space-y-4">
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[100px]">Asset Tag</TableHead>
                      <TableHead className="min-w-[200px]">Name</TableHead>
                      <TableHead className="min-w-[120px]">Category</TableHead>
                      <TableHead className="min-w-[180px]">Brand/Model</TableHead>
                      <TableHead className="min-w-[150px]">Serial Number</TableHead>
                      <TableHead className="min-w-[120px]">Assigned Date</TableHead>
                      <TableHead className="min-w-[100px]">Condition</TableHead>
                      <TableHead className="min-w-[100px]">Status</TableHead>
                      <TableHead className="min-w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignedAssets.map((asset) => (
                      <TableRow key={asset.id}>
                        <TableCell className="font-medium">{asset.assetTag}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getCategoryIcon(asset.category)}
                            {asset.name}
                          </div>
                        </TableCell>
                        <TableCell>{asset.category}</TableCell>
                        <TableCell>
                          {asset.brand} {asset.model}
                        </TableCell>
                        <TableCell className="font-mono text-sm">{asset.serialNumber}</TableCell>
                        <TableCell>{asset.assignedDate}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              asset.condition === "excellent"
                                ? "default"
                                : asset.condition === "good"
                                  ? "secondary"
                                  : "destructive"
                            }
                          >
                            {asset.condition}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="default">{asset.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUnassignAsset(asset.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="accessories" className="space-y-4">
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[200px]">Name</TableHead>
                      <TableHead className="min-w-[120px]">Category</TableHead>
                      <TableHead className="min-w-[180px]">Brand/Model</TableHead>
                      <TableHead className="min-w-[150px]">Serial Number</TableHead>
                      <TableHead className="min-w-[120px]">Assigned Date</TableHead>
                      <TableHead className="min-w-[100px]">Condition</TableHead>
                      <TableHead className="min-w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignedAccessories.map((accessory) => (
                      <TableRow key={accessory.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getCategoryIcon(accessory.category)}
                            {accessory.name}
                          </div>
                        </TableCell>
                        <TableCell>{accessory.category}</TableCell>
                        <TableCell>
                          {accessory.brand} {accessory.model}
                        </TableCell>
                        <TableCell className="font-mono text-sm">{accessory.serialNumber}</TableCell>
                        <TableCell>{accessory.assignedDate}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              accessory.condition === "excellent"
                                ? "default"
                                : accessory.condition === "good"
                                  ? "secondary"
                                  : "destructive"
                            }
                          >
                            {accessory.condition}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUnassignAccessory(accessory.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
