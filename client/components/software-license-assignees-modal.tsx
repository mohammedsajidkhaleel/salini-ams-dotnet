"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, User, Trash2, Plus, Users } from "lucide-react"
import { Employee } from "@/lib/types"
import { softwareLicenseService } from "@/lib/services/softwareLicenseService"
import { employeeService } from "@/lib/services/employeeService"

interface LicenseAssignment {
  id: string
  employee_id: string
  software_license_id: string
  assigned_date: string
  returned_date?: string
  status: "assigned" | "returned"
  notes?: string
  created_at: string
  // Employee details
  employee_code?: string
  employee_name?: string
  employee_email?: string
  employee_department?: string
}

interface SoftwareLicenseAssigneesModalProps {
  isOpen: boolean
  onClose: () => void
  licenseId: string
  licenseName: string
  totalSeats: number
}

export function SoftwareLicenseAssigneesModal({
  isOpen,
  onClose,
  licenseId,
  licenseName,
  totalSeats,
}: SoftwareLicenseAssigneesModalProps) {
  const [assignments, setAssignments] = useState<LicenseAssignment[]>([])
  const [availableEmployees, setAvailableEmployees] = useState<Employee[]>([])
  const [selectedEmployee, setSelectedEmployee] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState("")
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dataLoaded, setDataLoaded] = useState(false)
  const [loadedLicenseId, setLoadedLicenseId] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  // Load current assignments and available employees
  useEffect(() => {
    if (isOpen && licenseId && (!dataLoaded || loadedLicenseId !== licenseId)) {
      loadData()
    }
    
    // Reset data loaded flag when modal closes
    if (!isOpen) {
      setDataLoaded(false)
      setLoadedLicenseId(null)
      setAssignments([])
      setAvailableEmployees([])
      setError(null)
      setRetryCount(0)
    }
  }, [isOpen, licenseId, dataLoaded, loadedLicenseId])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.employee-dropdown-container')) {
        setShowEmployeeDropdown(false);
      }
    };

    if (showEmployeeDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showEmployeeDropdown]);

  const loadData = async () => {
    if (dataLoaded && loadedLicenseId === licenseId) return // Prevent duplicate calls for same license
    
    try {
      setLoading(true)
      setError(null)
      
      // Load both assignments and available employees in parallel
      await Promise.all([
        loadAssignments(),
        loadAvailableEmployees()
      ])
      
      setDataLoaded(true)
      setLoadedLicenseId(licenseId)
    } catch (err) {
      console.error("Error loading data:", err)
      setError("Failed to load license assignment data")
      
      // Retry mechanism (max 3 retries)
      if (retryCount < 3) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1)
          setDataLoaded(false) // Reset to allow retry
        }, 1000)
      }
    } finally {
      setLoading(false)
    }
  }

  const loadAssignments = async () => {
    try {
      console.log("Loading assignments for license:", licenseId);
      const response = await softwareLicenseService.getLicenseAssignments(licenseId);
      console.log("Raw assignments response:", response);
      
      if (response) {
        const mappedAssignments: LicenseAssignment[] = (response || []).map((assignment: any) => {
          console.log("Mapping assignment:", assignment);
          return {
            id: assignment.id,
            employee_id: assignment.employeeId,
            software_license_id: assignment.softwareLicenseId,
            assigned_date: assignment.assignedDate,
            returned_date: assignment.returnedDate,
            status: assignment.status,
            notes: assignment.notes,
            created_at: assignment.createdAt,
            employee_code: assignment.employeeCode,
            employee_name: assignment.employeeName,
            employee_email: assignment.employeeEmail,
            employee_department: assignment.employeeDepartment,
          };
        });

        console.log("Mapped assignments:", mappedAssignments);
        setAssignments(mappedAssignments);
      }
    } catch (err) {
      console.error("Error loading assignments:", err)
      throw err // Re-throw to be handled by loadData
    }
  }

  const loadAvailableEmployees = async () => {
    try {
      // Get all employees that are not currently assigned to this license
      const assignedResponse = await softwareLicenseService.getLicenseAssignments(licenseId);
      const assignedIds = assignedResponse?.map(a => a.employeeId) || [];

      // Get all active employees
      const employeesResponse = await employeeService.getEmployees({
        pageNumber: 1,
        pageSize: 1000,
        status: 1 // Active status
      });

      if (employeesResponse && employeesResponse.items) {
        // Filter out already assigned employees
        const availableEmployees = employeesResponse.items.filter(emp => 
          !assignedIds.includes(emp.id)
        );
      
        // Map the data to include department name
        const mappedEmployees: Employee[] = availableEmployees.map((emp: any) => ({
          id: emp.id,
          code: emp.employeeId,
          name: emp.fullName,
          email: emp.email,
          department: emp.department,
          status: "active" as const,
        }));
      
        setAvailableEmployees(mappedEmployees);
      }
    } catch (err) {
      console.error("Error loading available employees:", err)
      throw err // Re-throw to be handled by loadData
    }
  }

  const handleAssignLicense = useCallback(async () => {
    if (!selectedEmployee) return

    try {
      setLoading(true)
      setError(null)

      await softwareLicenseService.assignLicense(licenseId, {
        employeeId: selectedEmployee,
        notes: "License assigned via assignees modal"
      });

      // Reload data
      setDataLoaded(false)
      setSelectedEmployee("")
      setEmployeeSearchTerm("")
    } catch (err) {
      console.error("Error assigning license:", err)
      setError("Failed to assign license to employee")
    } finally {
      setLoading(false)
    }
  }, [selectedEmployee, licenseId, dataLoaded])

  const handleUnassignLicense = useCallback(async (assignmentId: string) => {
    if (!confirm("Are you sure you want to unassign this license from the employee?")) return

    try {
      setLoading(true)
      setError(null)

      await softwareLicenseService.unassignLicense(assignmentId, "License unassigned via assignees modal");

      // Reload data
      setDataLoaded(false)
    } catch (err) {
      console.error("Error unassigning license:", err)
      setError("Failed to unassign license from employee")
    } finally {
      setLoading(false)
    }
  }, [dataLoaded])

  const handleEmployeeSearch = (searchTerm: string) => {
    setEmployeeSearchTerm(searchTerm);
    setShowEmployeeDropdown(true);
  };

  const handleEmployeeSelect = (employee: Employee) => {
    setSelectedEmployee(employee.id);
    setEmployeeSearchTerm(`${employee.code} - ${employee.name}`);
    setShowEmployeeDropdown(false);
  };

  const filteredEmployees = useMemo(() => {
    if (!employeeSearchTerm) return availableEmployees;
    
    return availableEmployees.filter(
      (emp) =>
        emp.name?.toLowerCase().includes(employeeSearchTerm.toLowerCase()) ||
        emp.code?.toLowerCase().includes(employeeSearchTerm.toLowerCase()) ||
        emp.email?.toLowerCase().includes(employeeSearchTerm.toLowerCase())
    )
  }, [availableEmployees, employeeSearchTerm])

  const filteredEmployeesForTable = useMemo(() => {
    if (!searchTerm) return availableEmployees;
    
    return availableEmployees.filter(
      (emp) =>
        emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [availableEmployees, searchTerm])

  const assignedSeats = assignments.length
  const availableSeats = totalSeats - assignedSeats

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            License Assignees - {licenseName}
          </DialogTitle>
        </DialogHeader>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <div className="flex items-center justify-between">
              <p className="text-red-800 text-sm">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setError(null)
                  setRetryCount(0)
                  setDataLoaded(false)
                }}
                className="cursor-pointer"
              >
                Retry
              </Button>
            </div>
          </div>
        )}

        <Tabs defaultValue="current" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="current">
              Current Assignments ({assignedSeats}/{totalSeats})
            </TabsTrigger>
            <TabsTrigger value="assign">Assign License</TabsTrigger>
          </TabsList>

          <TabsContent value="current" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-cyan-600">{assignedSeats}</div>
                  <p className="text-xs text-gray-600">Assigned Seats</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-green-600">{availableSeats}</div>
                  <p className="text-xs text-gray-600">Available Seats</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-blue-600">{totalSeats}</div>
                  <p className="text-xs text-gray-600">Total Seats</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Assigned Employees ({assignments.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-600 mx-auto"></div>
                    <p className="text-gray-600 mt-2">Loading assignments...</p>
                  </div>
                ) : assignments.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No employees assigned to this license</p>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Employee</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Department</TableHead>
                          <TableHead>Assigned Date</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {assignments.map((assignment) => (
                          <TableRow key={assignment.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">{assignment.employee_code || "-"}</Badge>
                                <span className="font-medium">{assignment.employee_name || "Unknown"}</span>
                              </div>
                            </TableCell>
                            <TableCell>{assignment.employee_email || "-"}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">{assignment.employee_department || "-"}</Badge>
                            </TableCell>
                            <TableCell>
                              {new Date(assignment.assigned_date).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleUnassignLicense(assignment.id)}
                                className="text-red-600 hover:text-red-700 cursor-pointer"
                                disabled={loading}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assign" className="space-y-4">
            {availableSeats <= 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">All license seats are currently assigned</p>
                    <p className="text-sm text-gray-400">
                      Unassign some employees to make seats available for new assignments
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search employees by name, code, or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Assign License to Employee
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <div className="relative employee-dropdown-container flex-1">
                      <Input
                        value={employeeSearchTerm}
                        onChange={(e) => handleEmployeeSearch(e.target.value)}
                        onFocus={() => setShowEmployeeDropdown(true)}
                        placeholder="Search by employee code or name..."
                        className="cursor-pointer"
                      />
                      {showEmployeeDropdown && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                          {filteredEmployees.length > 0 ? (
                            filteredEmployees.map((employee) => (
                              <div
                                key={employee.id}
                                className="p-2 hover:bg-gray-100 cursor-pointer"
                                onClick={() => handleEmployeeSelect(employee)}
                              >
                                <div className="font-medium">{employee.code}</div>
                                <div className="text-sm text-gray-600">
                                  {employee.name}
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="p-2 text-gray-500">
                              {employeeSearchTerm ? "No employees found" : "No available employees"}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <Button 
                      onClick={handleAssignLicense} 
                      disabled={!selectedEmployee || loading}
                      className="cursor-pointer"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Assign
                    </Button>
                  </div>

                    {filteredEmployeesForTable.length === 0 && searchTerm && (
                      <p className="text-gray-500 text-center py-4">
                        No employees found matching "{searchTerm}"
                      </p>
                    )}

                    {filteredEmployeesForTable.length > 0 && (
                      <div className="max-h-64 overflow-y-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Employee</TableHead>
                              <TableHead>Email</TableHead>
                              <TableHead>Department</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredEmployeesForTable.slice(0, 10).map((employee) => (
                              <TableRow key={employee.id}>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline">{employee.code || "-"}</Badge>
                                    <span className="font-medium">{employee.name}</span>
                                  </div>
                                </TableCell>
                                <TableCell>{employee.email || "-"}</TableCell>
                                <TableCell>
                                  <Badge variant="secondary">{employee.department || "-"}</Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        {filteredEmployeesForTable.length > 10 && (
                          <p className="text-sm text-gray-500 text-center py-2">
                            Showing first 10 results. Use search to narrow down.
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex justify-end pt-4">
          <Button onClick={onClose} variant="outline" className="cursor-pointer">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
