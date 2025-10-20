"use client";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit, Trash2, Plus, Eye, Laptop, Package, Printer, Upload, Download } from "lucide-react";
import { EmployeeAssetsModal } from "./employee-assets-modal";
import { QuickAssignModal } from "./quick-assign-modal";
import { DateDisplay } from "@/components/ui/date-display";
import { EmployeeReport } from "./employee-report";
import { useAuth } from "@/contexts/auth-context-new";
import { ClientOnly } from "./client-only";
import { type Employee } from "@/lib/services";
import { toast } from "@/lib/toast";
import { employeeService } from "@/lib/services";

interface EmployeeTableProps {
  employees: Employee[];
  onEdit: (employee: Employee) => void;
  onDelete: (employee: Employee) => void;
  onAdd: () => void;
  onImport?: () => void;
  loading?: boolean;
  pagination?: {
    pageNumber: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
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
}: EmployeeTableProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'SuperAdmin' || user?.role === 'Admin' || user?.permissions?.includes('employees.create');
  
  const [showAssetsModal, setShowAssetsModal] = useState(false);
  const [showQuickAssignModal, setShowQuickAssignModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const handleViewAssets = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowAssetsModal(true);
  };

  const handleQuickAssign = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowQuickAssignModal(true);
  };

  const handleGenerateReport = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowReportModal(true);
  };

  const handleExportEmployees = async () => {
    try {
      const blob = await employeeService.exportEmployees({
        pageNumber: 1,
        pageSize: 1000, // Export all
      });
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `employees-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Employees exported successfully');
    } catch (error) {
      toast.error('Failed to export employees');
      console.error('Export error:', error);
    }
  };

  const getStatusBadge = (status: number) => {
    if (status === 1) {
      return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Active</span>;
    }
    return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Inactive</span>;
  };


  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
            <span className="ml-2 text-gray-600">Loading employees...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <ClientOnly>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold">Employees</CardTitle>
            <div className="flex gap-2">
              {isAdmin && onImport && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onImport}
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Import
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportEmployees}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
              <Button
                onClick={onAdd}
                className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700"
              >
                <Plus className="h-4 w-4" />
                Add Employee
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {employees.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No employees found</p>
              <Button
                onClick={onAdd}
                className="mt-4 bg-cyan-600 hover:bg-cyan-700"
              >
                Add First Employee
              </Button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employees.map((employee) => (
                      <TableRow key={employee.id}>
                        <TableCell className="font-medium">
                          {employee.employeeId}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{employee.fullName}</div>
                            <div className="text-sm text-gray-500">
                              {employee.employeeCategory?.name || '-'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{employee.email || '-'}</TableCell>
                        <TableCell>{employee.phone || '-'}</TableCell>
                        <TableCell>
                          <div>
                            <div>{employee.department?.name || '-'}</div>
                            {employee.subDepartment?.name && (
                              <div className="text-sm text-gray-500">
                                {employee.subDepartment.name}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{employee.employeePosition?.name || '-'}</TableCell>
                        <TableCell>{employee.project?.name || '-'}</TableCell>
                        <TableCell>{getStatusBadge(employee.status)}</TableCell>
                        <TableCell><DateDisplay date={employee.createdAt} /></TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewAssets(employee)}
                              title="View Assets"
                            >
                              <Laptop className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleQuickAssign(employee)}
                              title="Quick Assign"
                            >
                              <Package className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleGenerateReport(employee)}
                              title="Generate Report"
                            >
                              <Printer className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onEdit(employee)}
                              title="Edit Employee"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            {isAdmin && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onDelete(employee)}
                                title="Delete Employee"
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-500">
                    Showing {((pagination.pageNumber - 1) * pagination.pageSize) + 1} to{' '}
                    {Math.min(pagination.pageNumber * pagination.pageSize, pagination.totalCount)} of{' '}
                    {pagination.totalCount} employees
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <select
                      value={pagination.pageSize}
                      onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
                      className="px-2 py-1 border border-gray-300 rounded text-sm"
                    >
                      <option value={10}>10 per page</option>
                      <option value={25}>25 per page</option>
                      <option value={50}>50 per page</option>
                      <option value={100}>100 per page</option>
                    </select>
                    
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPageChange?.(pagination.pageNumber - 1)}
                        disabled={pagination.pageNumber <= 1}
                      >
                        Previous
                      </Button>
                      
                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        const pageNum = i + 1;
                        return (
                          <Button
                            key={pageNum}
                            variant={pageNum === pagination.pageNumber ? "default" : "outline"}
                            size="sm"
                            onClick={() => onPageChange?.(pageNum)}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPageChange?.(pagination.pageNumber + 1)}
                        disabled={pagination.pageNumber >= pagination.totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      {selectedEmployee && (
        <>
          <EmployeeAssetsModal
            isOpen={showAssetsModal}
            onClose={() => {
              setShowAssetsModal(false);
              setSelectedEmployee(null);
            }}
            employee={selectedEmployee}
          />
          
          <QuickAssignModal
            isOpen={showQuickAssignModal}
            onClose={() => {
              setShowQuickAssignModal(false);
              setSelectedEmployee(null);
            }}
            employee={selectedEmployee}
          />
          
          <EmployeeReport
            isOpen={showReportModal}
            onClose={() => {
              setShowReportModal(false);
              setSelectedEmployee(null);
            }}
            employee={selectedEmployee}
          />
        </>
      )}
    </ClientOnly>
  );
}
