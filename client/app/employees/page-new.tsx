"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { EmployeeTable } from "@/components/employee-table";
import { EmployeeForm } from "@/components/employee-form";
import { UserHeader } from "@/components/user-header";
import { EnhancedEmployeeImportModal } from "@/components/enhanced-employee-import-modal";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Button } from "@/components/ui/button";
import { ProtectedRoute } from "@/components/protected-route";
import { useAuth } from "@/contexts/auth-context-new";
import { employeeService, type Employee } from "@/lib/services";
import { type EmployeeListItem } from "@/lib/services/employeeService";
import { toast } from "@/lib/toast";
import { ErrorHandler } from "@/lib/errorHandler";

export default function EmployeesPage() {
  const { user, isAuthenticated } = useAuth();
  const isAdmin = user?.role === 'SuperAdmin' || user?.role === 'Admin' || user?.permissions?.includes('employees.create');
  
  const [employees, setEmployees] = useState<EmployeeListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | undefined>();
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    employee: EmployeeListItem | null;
  }>({ isOpen: false, employee: null });

  // Pagination state
  const [pagination, setPagination] = useState({
    pageNumber: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 0,
  });

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<number | undefined>(undefined);

  // Load employees from API
  const loadEmployees = async (pageNumber = 1, pageSize = 10, search = "", status?: number) => {
    try {
      setLoading(true);
      
      const response = await employeeService.getEmployees({
        pageNumber,
        pageSize,
        search: search || undefined,
        status,
        sortBy: 'createdAt',
        sortDirection: 'desc',
      });

      setEmployees(response.items);
      setPagination({
        pageNumber: response.pageNumber,
        pageSize: response.pageSize,
        totalCount: response.totalCount,
        totalPages: response.totalPages,
      });


    } catch (error) {
      const errorMessage = ErrorHandler.showError(error as Error, 'EmployeesPage');
      toast.error(errorMessage);
      console.error("Error loading employees:", error);
    } finally {
      setLoading(false);
    }
  };

  // Separate effects to prevent unnecessary re-renders
  useEffect(() => {
    if (isAuthenticated) {
      loadEmployees(1, 10, "", undefined); // Initial load
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      loadEmployees(pagination.pageNumber, pagination.pageSize, searchTerm, statusFilter);
    }
  }, [pagination.pageNumber, pagination.pageSize, searchTerm, statusFilter]);

  const handleAdd = () => {
    setEditingEmployee(undefined);
    setShowForm(true);
  };

  const handleEdit = (employee: EmployeeListItem) => {
    // For editing, we need to fetch the full employee details
    employeeService.getEmployeeById(employee.id).then(fullEmployee => {
      setEditingEmployee(fullEmployee);
      setShowForm(true);
    }).catch(error => {
      console.error('Error fetching employee details:', error);
      toast.error('Failed to load employee details');
    });
  };

  const handleDelete = (employee: EmployeeListItem) => {
    setDeleteConfirmation({ isOpen: true, employee });
  };

  const confirmDelete = async () => {
    if (!deleteConfirmation.employee) return;
    
    try {
      await employeeService.deleteEmployee(deleteConfirmation.employee.id);
      
      setEmployees((prev) => 
        prev.filter((emp) => emp.id !== deleteConfirmation.employee!.id)
      );
      
      toast.success(`Employee ${deleteConfirmation.employee.fullName} deleted successfully`);
      setDeleteConfirmation({ isOpen: false, employee: null });
    } catch (error) {
      const errorMessage = ErrorHandler.showError(error as Error, 'EmployeesPage');
      toast.error(errorMessage);
    }
  };

  const handleSubmit = async (employeeData: Omit<Employee, "id" | "createdAt" | "updatedAt">) => {
    try {
      if (editingEmployee) {
        // Update existing employee
        const updatedEmployee = await employeeService.updateEmployee(editingEmployee.id, {
          firstName: employeeData.firstName,
          lastName: employeeData.lastName,
          email: employeeData.email,
          phone: employeeData.phone,
          status: employeeData.status,
          nationalityId: employeeData.nationalityId,
          employeeCategoryId: employeeData.employeeCategoryId,
          employeePositionId: employeeData.employeePositionId,
          departmentId: employeeData.departmentId,
          subDepartmentId: employeeData.subDepartmentId,
          projectId: employeeData.projectId,
          companyId: employeeData.companyId,
          costCenterId: employeeData.costCenterId,
        });

        setEmployees((prev) =>
          prev.map((emp) => (emp.id === editingEmployee.id ? updatedEmployee : emp))
        );

        toast.success(`Employee ${updatedEmployee.firstName} ${updatedEmployee.lastName} updated successfully`);
      } else {
        // Add new employee
        const newEmployee = await employeeService.createEmployee({
          employeeId: employeeData.employeeId,
          firstName: employeeData.firstName,
          lastName: employeeData.lastName,
          email: employeeData.email,
          phone: employeeData.phone,
          status: employeeData.status,
          nationalityId: employeeData.nationalityId,
          employeeCategoryId: employeeData.employeeCategoryId,
          employeePositionId: employeeData.employeePositionId,
          departmentId: employeeData.departmentId,
          subDepartmentId: employeeData.subDepartmentId,
          projectId: employeeData.projectId,
          companyId: employeeData.companyId,
          costCenterId: employeeData.costCenterId,
        });

        setEmployees((prev) => [newEmployee, ...prev]);
        toast.success(`Employee ${newEmployee.firstName} ${newEmployee.lastName} created successfully`);
      }
    } catch (error) {
      const errorMessage = ErrorHandler.showError(error as Error, 'EmployeesPage');
      toast.error(errorMessage);
    } finally {
      setShowForm(false);
      setEditingEmployee(undefined);
    }
  };

  const handleImportComplete = () => {
    setShowImportModal(false);
    // Reload employees to show imported data
    loadEmployees(pagination.pageNumber, pagination.pageSize, searchTerm, statusFilter);
  };

  const handleSearch = (search: string) => {
    setSearchTerm(search);
    loadEmployees(1, pagination.pageSize, search, statusFilter);
  };

  const handleStatusFilter = (status: number | undefined) => {
    setStatusFilter(status);
    loadEmployees(1, pagination.pageSize, searchTerm, status);
  };

  const handlePageChange = (pageNumber: number) => {
    loadEmployees(pageNumber, pagination.pageSize, searchTerm, statusFilter);
  };

  const handlePageSizeChange = (pageSize: number) => {
    loadEmployees(1, pageSize, searchTerm, statusFilter);
  };

  if (showForm) {
    return (
      <ProtectedRoute>
        <div className="flex h-screen bg-background">
          <Sidebar />
          <main className="flex-1 overflow-auto">
            <div className="p-6 space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-foreground">Employee Management</h1>
                  <p className="text-muted-foreground">Manage employee information and records</p>
                </div>
                <UserHeader />
              </div>
              <EmployeeForm
                key={editingEmployee?.id || 'new'}
                employee={editingEmployee}
                onSubmit={handleSubmit}
                onCancel={() => {
                  setShowForm(false);
                  setEditingEmployee(undefined);
                }}
              />
            </div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Employee Management</h1>
                <p className="text-muted-foreground">Manage employee information and records</p>
              </div>
              <UserHeader />
            </div>

            {/* Search and Filter Controls */}
            <div className="flex gap-4 items-center">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <select
                value={statusFilter || ""}
                onChange={(e) => handleStatusFilter(e.target.value ? Number(e.target.value) : undefined)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="">All Status</option>
                <option value="1">Active</option>
                <option value="0">Inactive</option>
              </select>
            </div>

            {/* Employee Table */}
            <EmployeeTable 
              employees={employees} 
              onEdit={handleEdit} 
              onDelete={handleDelete} 
              onAdd={handleAdd}
              onImport={isAdmin ? () => setShowImportModal(true) : undefined}
              loading={loading}
              pagination={pagination}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          </div>
        </main>
        
        {isAdmin && (
          <EnhancedEmployeeImportModal
            isOpen={showImportModal}
            onClose={() => setShowImportModal(false)}
            onImportComplete={handleImportComplete}
          />
        )}
        
        <ConfirmationDialog
          isOpen={deleteConfirmation.isOpen}
          onClose={() => setDeleteConfirmation({ isOpen: false, employee: null })}
          onConfirm={confirmDelete}
          title="Delete Employee"
          description={`Are you sure you want to delete employee "${deleteConfirmation.employee?.fullName}" (${deleteConfirmation.employee?.employeeId})? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          variant="destructive"
        />
      </div>
    </ProtectedRoute>
  );
}
