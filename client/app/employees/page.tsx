"use client";

import { useEffect, useState, useCallback } from "react";
import { Sidebar } from "@/components/sidebar";
import { EmployeeTable } from "@/components/employee-table";
import { EmployeeForm } from "@/components/employee-form";
import { UserHeader } from "@/components/user-header";
import { SimpleEmployeeImportModalV2 } from "@/components/simple-employee-import-modal-v2";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Button } from "@/components/ui/button";
import { ProtectedRoute } from "@/components/protected-route";
import { useAuth } from "@/contexts/auth-context-new";
import { Employee as LegacyEmployee } from "@/lib/types";
import { employeeService, type Employee } from "@/lib/services";
import { type EmployeeListItem } from "@/lib/services/employeeService";

export default function EmployeesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'SuperAdmin' || 
                  user?.role === 'Admin' ||
                  user?.role?.toLowerCase() === 'superadmin' ||
                  user?.role?.toLowerCase() === 'super admin' ||
                  user?.permissions?.includes('manage_employees');
  
  
  const [employees, setEmployees] = useState<LegacyEmployee[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<LegacyEmployee | undefined>();
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    employee: LegacyEmployee | null;
  }>({ isOpen: false, employee: null });
  const [pagination, setPagination] = useState({
    pageNumber: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState({
    search: "",
    departmentId: "",
    status: "",
    projectId: "all",
  });
  const [searchInput, setSearchInput] = useState(""); // Local search input state
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  // Map service EmployeeListItem to legacy Employee format
  const mapEmployeeToLegacy = (employee: EmployeeListItem): LegacyEmployee => {
    return {
      id: employee.id,
      code: employee.employeeId,
      name: employee.fullName,
      email: employee.email,
      mobileNumber: employee.phone,
      department: employee.departmentName,
      subDepartment: employee.subDepartmentName,
      position: employee.employeePositionName,
      category: undefined, // Not available in list view
      nationality: undefined, // Not available in list view
      company: employee.companyName,
      project: employee.projectName,
      project_name: employee.projectName,
      costCenter: undefined, // Not available in list view
      status: employee.status === 1 ? "active" : "inactive",
    };
  };

  // Load employees from DB with joined data for display
  const loadEmployees = async (pageNumber = 1, pageSize = 10, currentFilters = filters) => {
    try {
      // Build request parameters with filters
      const requestParams: any = {
        pageNumber,
        pageSize,
        sortBy: 'createdAt',
        sortDirection: 'desc'
      };

      // Add search filter
      if (currentFilters.search) {
        requestParams.searchTerm = currentFilters.search;
      }

      // Add department filter
      if (currentFilters.departmentId) {
        requestParams.departmentId = currentFilters.departmentId;
      }

      // Add status filter
      if (currentFilters.status) {
        requestParams.status = currentFilters.status === 'active' ? 1 : 0;
      }

      // Add project filter (if not "all")
      if (currentFilters.projectId && currentFilters.projectId !== 'all') {
        requestParams.projectId = currentFilters.projectId;
      }

      const response = await employeeService.getEmployees(requestParams);
      if (response && response.items) {
        const mappedEmployees = response.items.map(mapEmployeeToLegacy);
        setEmployees(mappedEmployees);
        setPagination({
          pageNumber: response.pageNumber,
          pageSize: response.pageSize,
          totalCount: response.totalCount,
          totalPages: response.totalPages,
        });
      }
    } catch (error) {
      console.error("Error loading employees", error);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  const handlePageChange = (pageNumber: number) => {
    loadEmployees(pageNumber, pagination.pageSize);
  };

  const handlePageSizeChange = (pageSize: number) => {
    loadEmployees(1, pageSize);
  };

  // Debounced search function
  const debouncedSearch = useCallback((searchTerm: string) => {
    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Set new timeout
    const timeout = setTimeout(() => {
      const newFilters = { ...filters, search: searchTerm };
      setFilters(newFilters);
      // Reset to first page when search changes
      loadEmployees(1, pagination.pageSize, newFilters);
    }, 300); // 300ms delay - optimal for search inputs

    setSearchTimeout(timeout);
  }, [filters, pagination.pageSize, searchTimeout]);

  // Handle search input change
  const handleSearchInputChange = (value: string) => {
    setSearchInput(value);
    debouncedSearch(value);
  };

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
    // Reset to first page when filters change
    loadEmployees(1, pagination.pageSize, newFilters);
  };

  const handleAdd = () => {
    setEditingEmployee(undefined);
    setShowForm(true);
  };

  const handleEdit = (employee: LegacyEmployee) => {
    // For editing, we need to fetch the full employee details
    employeeService.getEmployeeById(employee.id).then(fullEmployee => {
      console.log('handleEdit: Full employee data from API:', fullEmployee)
      // Convert the full employee to legacy format
      const legacyEmployee: LegacyEmployee = {
        id: fullEmployee.id,
        code: fullEmployee.employeeId,
        name: fullEmployee.fullName || `${fullEmployee.firstName} ${fullEmployee.lastName}`,
        email: fullEmployee.email,
        mobileNumber: fullEmployee.phone,
        department: fullEmployee.department?.name,
        subDepartment: fullEmployee.subDepartment?.name,
        position: fullEmployee.employeePosition?.name,
        category: fullEmployee.employeeCategory?.name,
        nationality: fullEmployee.nationality?.name,
        company: fullEmployee.company?.name,
        project: fullEmployee.project?.name,
        project_name: fullEmployee.project?.name,
        costCenter: fullEmployee.costCenter?.name,
        status: fullEmployee.status === 1 ? "active" : "inactive",
      };
      console.log('handleEdit: Converted legacy employee:', legacyEmployee)
      setEditingEmployee(legacyEmployee);
      setShowForm(true);
    }).catch(error => {
      console.error('Error fetching employee details:', error);
      // Show user-friendly error message
      alert('Failed to load employee details. Please try again.');
    });
  };

  const handleDelete = (employee: LegacyEmployee) => {
    setDeleteConfirmation({ isOpen: true, employee });
  };

  const confirmDelete = async () => {
    if (!deleteConfirmation.employee) return;
    
    try {
      await employeeService.deleteEmployee(deleteConfirmation.employee.id);
      setEmployees((prev) => prev.filter((emp) => emp.id !== deleteConfirmation.employee!.id));
      setDeleteConfirmation({ isOpen: false, employee: null });
    } catch (error) {
      console.error("Error deleting employee", error);
    }
  };

  const handleSubmit = async (employeeData: Omit<LegacyEmployee, "id">) => {
    try {
      if (editingEmployee) {
        // Update existing employee
        // Split name into first_name and last_name for database compatibility
        const nameParts = employeeData.name.trim().split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || firstName; // Use firstName as lastName if no last name provided
        
        const updatePayload = {
          firstName: firstName,
          lastName: lastName,
          email: employeeData.email || null,
          phone: employeeData.mobileNumber || null,
          status: employeeData.status === "active" ? 1 : 0,
          nationalityId: employeeData.nationality,
          employeeCategoryId: employeeData.category,
          employeePositionId: employeeData.position,
          departmentId: employeeData.department,
          subDepartmentId: employeeData.subDepartment,
          projectId: employeeData.project,
          companyId: employeeData.company,
          costCenterId: employeeData.costCenter,
        };
        
        await employeeService.updateEmployee(editingEmployee.id, updatePayload);
        // Reload employees to get updated data with proper names
        loadEmployees();
      } else {
        // Add new employee
        // Split name into first_name and last_name for database compatibility
        const nameParts = employeeData.name.trim().split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || firstName; // Use firstName as lastName if no last name provided
        
        const createPayload = {
          employeeId: employeeData.code,
          firstName: firstName,
          lastName: lastName,
          email: employeeData.email || null,
          phone: employeeData.mobileNumber || null,
          status: employeeData.status === "active" ? 1 : 0,
          nationalityId: employeeData.nationality,
          employeeCategoryId: employeeData.category,
          employeePositionId: employeeData.position,
          departmentId: employeeData.department,
          subDepartmentId: employeeData.subDepartment,
          projectId: employeeData.project,
          companyId: employeeData.company,
          costCenterId: employeeData.costCenter,
        };
        
        await employeeService.createEmployee(createPayload);
        // Reload employees to get updated data with proper names
        loadEmployees();
      }
    } catch (error) {
      console.error("Error in handleSubmit:", error);
    } finally {
      setShowForm(false);
      setEditingEmployee(undefined);
    }
  };

  const handleImportComplete = () => {
    setShowImportModal(false);
    // Reload employees without page refresh
    loadEmployees();
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
                key={showForm ? 'form' : 'none'} // Stable key to prevent unnecessary remounting
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

            <EmployeeTable
              employees={employees}
              onEdit={(employee) => handleEdit(employee as LegacyEmployee)}
              onDelete={(employee) => handleDelete(employee as LegacyEmployee)} 
              onAdd={handleAdd}
              onImport={isAdmin ? () => setShowImportModal(true) : undefined}
              pagination={pagination}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              filters={filters}
              onFilterChange={handleFilterChange}
              searchInput={searchInput}
              onSearchInputChange={handleSearchInputChange}
            />
          </div>
        </main>
        
        {isAdmin && (
          <SimpleEmployeeImportModalV2
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
          description={`Are you sure you want to delete employee "${deleteConfirmation.employee?.name}" (${deleteConfirmation.employee?.code})? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          variant="destructive"
        />
      </div>
    </ProtectedRoute>
  );
}
