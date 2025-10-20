"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, User, Monitor, Trash2, Plus } from "lucide-react"

interface Assignment {
  id: string
  type: "employee" | "asset"
  name: string
  email?: string
  assetTag?: string
  department?: string
  assignedDate: string
}

interface LicenseAssignmentModalProps {
  isOpen: boolean
  onClose: () => void
  licenseName: string
  assignments: Assignment[]
  onAssign: (type: "employee" | "asset", id: string) => void
  onUnassign: (assignmentId: string) => void
}

// Mock data for employees and assets
const mockEmployees = [
  { id: "1", name: "John Doe", email: "john.doe@company.com", department: "IT" },
  { id: "2", name: "Jane Smith", email: "jane.smith@company.com", department: "Finance" },
  { id: "3", name: "Mike Johnson", email: "mike.johnson@company.com", department: "HR" },
  { id: "4", name: "Sarah Wilson", email: "sarah.wilson@company.com", department: "Marketing" },
]

const mockAssets = [
  { id: "1", name: "Dell Laptop", assetTag: "DL001", model: "Latitude 7420" },
  { id: "2", name: "MacBook Pro", assetTag: "MB002", model: "MacBook Pro 16" },
  { id: "3", name: "HP Workstation", assetTag: "HP003", model: "Z4 G4" },
  { id: "4", name: "Surface Pro", assetTag: "SP004", model: "Surface Pro 8" },
]

export function LicenseAssignmentModal({
  isOpen,
  onClose,
  licenseName,
  assignments,
  onAssign,
  onUnassign,
}: LicenseAssignmentModalProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedEmployee, setSelectedEmployee] = useState("")
  const [selectedAsset, setSelectedAsset] = useState("")

  const employeeAssignments = assignments.filter((a) => a.type === "employee")
  const assetAssignments = assignments.filter((a) => a.type === "asset")

  const availableEmployees = mockEmployees.filter(
    (emp) => !assignments.some((a) => a.type === "employee" && a.id === emp.id),
  )

  const availableAssets = mockAssets.filter(
    (asset) => !assignments.some((a) => a.type === "asset" && a.id === asset.id),
  )

  const filteredEmployees = availableEmployees.filter(
    (emp) =>
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const filteredAssets = availableAssets.filter(
    (asset) =>
      asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.assetTag.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleAssignEmployee = () => {
    if (selectedEmployee) {
      onAssign("employee", selectedEmployee)
      setSelectedEmployee("")
    }
  }

  const handleAssignAsset = () => {
    if (selectedAsset) {
      onAssign("asset", selectedAsset)
      setSelectedAsset("")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">License Assignments - {licenseName}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="current" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="current">Current Assignments</TabsTrigger>
            <TabsTrigger value="assign">Assign License</TabsTrigger>
          </TabsList>

          <TabsContent value="current" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Employee Assignments */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Employee Assignments ({employeeAssignments.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {employeeAssignments.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No employees assigned</p>
                  ) : (
                    <div className="space-y-2">
                      {employeeAssignments.map((assignment) => (
                        <div key={assignment.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <div className="font-medium">{assignment.name}</div>
                            <div className="text-sm text-gray-500">{assignment.email}</div>
                            <div className="text-xs text-gray-400">
                              Assigned: {new Date(assignment.assignedDate).toLocaleDateString()}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onUnassign(assignment.id)}
                            className="text-red-600 hover:text-red-700 cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Asset Assignments */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Monitor className="h-5 w-5" />
                    Asset Assignments ({assetAssignments.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {assetAssignments.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No assets assigned</p>
                  ) : (
                    <div className="space-y-2">
                      {assetAssignments.map((assignment) => (
                        <div key={assignment.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <div className="font-medium">{assignment.name}</div>
                            <div className="text-sm text-gray-500">Tag: {assignment.assetTag}</div>
                            <div className="text-xs text-gray-400">
                              Assigned: {new Date(assignment.assignedDate).toLocaleDateString()}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onUnassign(assignment.id)}
                            className="text-red-600 hover:text-red-700 cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="assign" className="space-y-4">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search employees or assets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Assign to Employee */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Assign to Employee
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select employee" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredEmployees.map((employee) => (
                          <SelectItem key={employee.id} value={employee.id}>
                            <div>
                              <div className="font-medium">{employee.name}</div>
                              <div className="text-sm text-gray-500">{employee.email}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button onClick={handleAssignEmployee} disabled={!selectedEmployee} className="cursor-pointer">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="max-h-48 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Employee</TableHead>
                          <TableHead>Department</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredEmployees.map((employee) => (
                          <TableRow key={employee.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{employee.name}</div>
                                <div className="text-sm text-gray-500">{employee.email}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">{employee.department}</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* Assign to Asset */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Monitor className="h-5 w-5" />
                    Assign to Asset
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Select value={selectedAsset} onValueChange={setSelectedAsset}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select asset" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredAssets.map((asset) => (
                          <SelectItem key={asset.id} value={asset.id}>
                            <div>
                              <div className="font-medium">{asset.name}</div>
                              <div className="text-sm text-gray-500">Tag: {asset.assetTag}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button onClick={handleAssignAsset} disabled={!selectedAsset} className="cursor-pointer">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="max-h-48 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Asset</TableHead>
                          <TableHead>Tag</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredAssets.map((asset) => (
                          <TableRow key={asset.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{asset.name}</div>
                                <div className="text-sm text-gray-500">{asset.model}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{asset.assetTag}</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end pt-4">
          <Button onClick={onClose} variant="outline" className="cursor-pointer bg-transparent">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
