"use client";
import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit, Trash2, Search, Plus, Eye, Laptop, Package, Printer, Upload } from "lucide-react";
import { EmployeeAssetsModal } from "./employee-assets-modal";
import { QuickAssignModal } from "./quick-assign-modal";
import { EmployeeReport } from "./employee-report";
import { PDFService } from "@/lib/pdfService";
import { Pagination } from "./ui/pagination";
import { ProjectFilter } from "./project-filter";
import { assetService } from "@/lib/services/assetService";
import { accessoryService } from "@/lib/services/accessoryService";
import { softwareLicenseService } from "@/lib/services/softwareLicenseService";
import { simCardService } from "@/lib/services/simCardService";
import { useAuth } from "@/contexts/auth-context-new";
import { ClientOnly } from "./client-only";
import { Employee } from "@/lib/types";
import { type EmployeeListItem } from "@/lib/services/employeeService";

interface EmployeeTableProps {
  employees: Employee[] | EmployeeListItem[];
  onEdit: (employee: Employee | EmployeeListItem) => void;
  onDelete: (employee: Employee | EmployeeListItem) => void;
  onAdd: () => void;
  onImport?: () => void;
  loading?: boolean;
  pagination?: {
    pageNumber: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
  onPageChange?: (pageNumber: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  filters?: {
    search: string;
    departmentId: string;
    status: string;
    projectId: string;
  };
  onFilterChange?: (filters: {
    search: string;
    departmentId: string;
    status: string;
    projectId: string;
  }) => void;
  searchInput?: string;
  onSearchInputChange?: (value: string) => void;
}

export function EmployeeTable({
  employees,
  onEdit,
  onDelete,
  onAdd,
  onImport,
  loading = false,
  pagination,
  onPageChange,
  onPageSizeChange,
  filters,
  onFilterChange,
  searchInput,
  onSearchInputChange,
}: EmployeeTableProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'SuperAdmin' || 
                  user?.role === 'Admin' ||
                  user?.role?.toLowerCase() === 'superadmin' ||
                  user?.role?.toLowerCase() === 'super admin' ||
                  user?.permissions?.includes('manage_employees');
  
  
  // Use filters from props instead of local state
  const searchTerm = searchInput || "";
  const filterDepartment = filters?.departmentId || "";
  const filterStatus = filters?.status || "";
  const filterProject = filters?.projectId || "all";

  const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);
  const [assigningEmployee, setAssigningEmployee] = useState<Employee | null>(
    null
  );
  const [assignmentType, setAssignmentType] = useState<"asset" | "accessory">(
    "asset"
  );
  const [reportingEmployee, setReportingEmployee] = useState<Employee | null>(null);

  // Helper function to get display values from either Employee or EmployeeListItem
  const getEmployeeDisplayValues = (employee: Employee | EmployeeListItem) => {
    const isLegacyEmployee = 'name' in employee;
    
    if (isLegacyEmployee) {
      const legacyEmp = employee as Employee;
      return {
        name: legacyEmp.name,
        code: legacyEmp.code,
        email: legacyEmp.email,
        phone: legacyEmp.mobileNumber,
        department: legacyEmp.department,
        subDepartment: legacyEmp.subDepartment,
        position: legacyEmp.position,
        project: legacyEmp.project_name || legacyEmp.project,
        status: legacyEmp.status,
        project_id: legacyEmp.project_id
      };
    } else {
      const listItem = employee as EmployeeListItem;
      return {
        name: listItem.fullName,
        code: listItem.employeeId,
        email: listItem.email,
        phone: listItem.phone,
        department: listItem.departmentName,
        subDepartment: listItem.subDepartmentName,
        position: listItem.employeePositionName,
        project: listItem.projectName,
        status: listItem.status === 1 ? "active" : "inactive",
        project_id: undefined
      };
    }
  };

  // No client-side filtering - all filtering is done server-side
  const displayEmployees = employees;

  // Handle filter changes by calling parent's onFilterChange
  const handleSearchChange = (newSearch: string) => {
    if (onSearchInputChange) {
      onSearchInputChange(newSearch);
    }
  };

  const handleDepartmentChange = (newDepartment: string) => {
    if (onFilterChange) {
      onFilterChange({
        ...filters!,
        departmentId: newDepartment
      });
    }
  };

  const handleStatusChange = (newStatus: string) => {
    if (onFilterChange) {
      onFilterChange({
        ...filters!,
        status: newStatus
      });
    }
  };

  const handleProjectChange = (newProject: string) => {
    if (onFilterChange) {
      onFilterChange({
        ...filters!,
        projectId: newProject
      });
    }
  };

  const departments = [...new Set(employees.map((emp) => getEmployeeDisplayValues(emp).department).filter(Boolean))];

  const handleViewAssets = (employee: Employee) => {
    setViewingEmployee(employee);
  };

  const handleQuickAssign = (
    employee: Employee,
    type: "asset" | "accessory"
  ) => {
    setAssigningEmployee(employee);
    setAssignmentType(type);
  };

  const loadEmployeeAssets = async (employee: Employee) => {
    try {
      console.log("🔍 Loading assets for employee:", employee.id, employee.name)
      // Use proper backend filtering with assignedTo parameter
      const assetsResponse = await assetService.getAssets({
        pageNumber: 1,
        pageSize: 1000,
        assignedTo: employee.id
      });

      const assets = (assetsResponse?.items || []).map((asset: any) => ({
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

      // Use proper backend filtering with assignedTo parameter
      const accessoriesResponse = await accessoryService.getAccessories({
        pageNumber: 1,
        pageSize: 1000,
        assignedTo: employee.id
      });

      const accessories = (accessoriesResponse?.items || []).map((accessory: any) => ({
        id: accessory.id,
        name: accessory.name || "",
        category: "Accessory",
        brand: accessory.brand || "",
        model: accessory.model || "",
        serialNumber: accessory.serialNumber || "",
        assignedDate: accessory.currentAssignment?.assignedDate ? new Date(accessory.currentAssignment.assignedDate).toISOString().split("T")[0] : "",
        condition: accessory.condition || "good",
        quantity: accessory.quantity || 1,
      }));

      // Use proper backend filtering with assignedTo parameter
      const licensesResponse = await softwareLicenseService.getSoftwareLicenses({
        pageNumber: 1,
        pageSize: 1000,
        assignedTo: employee.id
      });

      const softwareLicenses = (licensesResponse?.items || []).map((license: any) => ({
        id: license.id,
        name: license.softwareName || "",
        vendor: license.vendor || "",
        licenseType: license.licenseType || "",
        assignedDate: license.currentAssignment?.assignedDate ? new Date(license.currentAssignment.assignedDate).toISOString().split("T")[0] : "",
        expiryDate: license.expiryDate || "",
        status: license.status || "",
      }));

      // Use proper backend filtering with assignedTo parameter
      const simResponse = await simCardService.getSimCards({
        pageNumber: 1,
        pageSize: 1000,
        assignedTo: employee.id
      });

      const simCards = (simResponse?.items || []).map((sim: any) => ({
        id: sim.id,
        accountService: sim.accountNumber || "",
        provider: sim.provider || "",
        type: sim.planName || "",
        assignedDate: sim.currentAssignment?.assignedDate ? new Date(sim.currentAssignment.assignedDate).toISOString().split("T")[0] : "",
        expiryDate: sim.expiryDate || "",
        status: sim.status,
        imei: sim.imei || "",
        accountNo: sim.accountNumber || "",
        serviceNo: sim.serviceNumber || "",
      }));

      console.log("📊 Loaded employee assets:", { 
        assets: assets.length, 
        accessories: accessories.length, 
        softwareLicenses: softwareLicenses.length, 
        simCards: simCards.length 
      });

      return { assets, accessories, softwareLicenses, simCards };
    } catch (error) {
      console.error("❌ Error loading employee assets:", error);
      return { assets: [], accessories: [], softwareLicenses: [], simCards: [] };
    }
  };

  const handlePrintReport = (employee: Employee) => {
      setReportingEmployee(employee);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Employees ({pagination?.totalCount || displayEmployees.length})</CardTitle>
            <div className="flex gap-2">
              <ClientOnly>
                {isAdmin && onImport && (
                  <Button onClick={onImport} variant="outline">
                    <Upload className="h-4 w-4 mr-2" />
                    Import Excel
                  </Button>
                )}
              </ClientOnly>
              <Button onClick={onAdd}>
                <Plus className="h-4 w-4 mr-2" />
                Add Employee
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={filterDepartment}
              onChange={(e) => handleDepartmentChange(e.target.value)}
              className="px-3 py-2 border border-input rounded-md bg-background cursor-pointer"
            >
              <option value="">All Departments</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="px-3 py-2 border border-input rounded-md bg-background cursor-pointer"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <ProjectFilter
              selectedProjectId={filterProject}
              onProjectChange={handleProjectChange}
              className="min-w-[200px]"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Department - SubDepartment</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayEmployees.map((employee) => {
                  const displayValues = getEmployeeDisplayValues(employee);
                  return (
                    <TableRow key={employee.id}>
                      <TableCell className="font-medium">
                        {displayValues.code}
                      </TableCell>
                      <TableCell>{displayValues.name}</TableCell>
                      <TableCell>{displayValues.email || '-'}</TableCell>
                      <TableCell>{displayValues.phone || '-'}</TableCell>
                      <TableCell>
                        {displayValues.department || '-'} - {displayValues.subDepartment || '-'}
                      </TableCell>
                      <TableCell>{displayValues.position || '-'}</TableCell>
                      <TableCell>
                        {displayValues.project || 'N/A'}
                      </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewAssets(employee)}
                          title="View Assets & Accessories"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePrintReport(employee)}
                          title="Print Employee Report"
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleQuickAssign(employee, "asset")}
                          title="Quick Assign Asset"
                          className="text-cyan-600 hover:text-cyan-700"
                        >
                          <Laptop className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleQuickAssign(employee, "accessory")
                          }
                          title="Quick Assign Accessory"
                          className="text-amber-600 hover:text-amber-700"
                        >
                          <Package className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(employee)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(employee)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          {displayEmployees.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No employees found matching your criteria.
            </div>
          )}

          {displayEmployees.length > 0 && (
            <div className="mt-4">
              <Pagination
                currentPage={pagination ? pagination.pageNumber : 1}
                totalPages={pagination ? pagination.totalPages : 1}
                onPageChange={onPageChange || (() => {})}
                itemsPerPage={pagination ? pagination.pageSize : 10}
                totalItems={pagination ? pagination.totalCount : displayEmployees.length}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <EmployeeAssetsModal
        employee={viewingEmployee}
        isOpen={!!viewingEmployee}
        onClose={() => setViewingEmployee(null)}
      />

      <QuickAssignModal
        employee={assigningEmployee}
        isOpen={!!assigningEmployee}
        onClose={() => setAssigningEmployee(null)}
        type={assignmentType}
      />

      <EmployeeReport
        employee={reportingEmployee}
        isOpen={!!reportingEmployee}
        onClose={() => setReportingEmployee(null)}
      />
    </>
  );
}
