"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Printer, Search, Users, Building, MapPin, Calendar } from "lucide-react";
import { useReactToPrint } from "react-to-print";
import { useRef } from "react";
import { useAuth } from "@/contexts/auth-context-new";
import { employeeService, type Employee } from "@/lib/services";
import { toast } from "@/lib/toast";
import { ErrorHandler } from "@/lib/errorHandler";

interface EmployeeReportData {
  id: string;
  employeeId: string;
  fullName: string;
  email: string;
  phone: string;
  department: string;
  subDepartment: string;
  position: string;
  category: string;
  nationality: string;
  company: string;
  project: string;
  costCenter: string;
  status: number;
  joiningDate: string;
  createdAt: string;
}

export function EmployeeReport() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<EmployeeReportData[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<EmployeeReportData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<number | undefined>(undefined);
  const [departmentFilter, setDepartmentFilter] = useState<string>("");
  const [projectFilter, setProjectFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadEmployeeData();
  }, []);

  useEffect(() => {
    filterEmployees();
  }, [employees, searchTerm, statusFilter, departmentFilter, projectFilter]);

  const loadEmployeeData = async () => {
    try {
      setLoading(true);
      
      const response = await employeeService.getEmployees({
        pageNumber: 1,
        pageSize: 1000, // Get all employees for the report
        sortBy: 'createdAt',
        sortDirection: 'desc',
      });

      const mappedEmployees: EmployeeReportData[] = response.items.map((employee: Employee) => ({
        id: employee.id,
        employeeId: employee.employeeId,
        fullName: employee.fullName,
        email: employee.email || "",
        phone: employee.phone || "",
        department: employee.department?.name || "Unknown",
        subDepartment: employee.subDepartment?.name || "",
        position: employee.employeePosition?.name || "Unknown",
        category: employee.employeeCategory?.name || "Unknown",
        nationality: employee.nationality?.name || "Unknown",
        company: employee.company?.name || "Unknown",
        project: employee.project?.name || "Unassigned",
        costCenter: employee.costCenter?.name || "Unknown",
        status: employee.status,
        joiningDate: employee.joiningDate ? new Date(employee.joiningDate).toISOString().split("T")[0] : "",
        createdAt: new Date(employee.createdAt).toISOString().split("T")[0],
      }));

      setEmployees(mappedEmployees);
      toast.success(`Loaded ${mappedEmployees.length} employees for report`);
    } catch (error) {
      const errorMessage = ErrorHandler.showError(error as Error, 'EmployeeReport');
      toast.error(errorMessage);
      console.error("Error loading employee data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterEmployees = () => {
    let filtered = employees;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(employee =>
        employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.position.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== undefined) {
      filtered = filtered.filter(employee => employee.status === statusFilter);
    }

    // Department filter
    if (departmentFilter) {
      filtered = filtered.filter(employee => employee.department === departmentFilter);
    }

    // Project filter
    if (projectFilter) {
      filtered = filtered.filter(employee => employee.project === projectFilter);
    }

    setFilteredEmployees(filtered);
    setCurrentPage(1);
  };

  const getStatusColor = (status: number) => {
    switch (status) {
      case 1: // Active
        return "bg-green-100 text-green-800";
      case 0: // Inactive
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: number) => {
    switch (status) {
      case 1: return "Active";
      case 0: return "Inactive";
      default: return "Unknown";
    }
  };

  const handlePrint = useReactToPrint({
    contentRef: reportRef,
    documentTitle: `Employee Report - ${new Date().toLocaleDateString()}`,
  });

  const handleExport = () => {
    const csvContent = [
      ["Employee ID", "Full Name", "Email", "Phone", "Department", "Sub Department", "Position", "Category", "Nationality", "Company", "Project", "Cost Center", "Status", "Joining Date", "Created Date"],
      ...filteredEmployees.map(employee => [
        employee.employeeId,
        employee.fullName,
        employee.email,
        employee.phone,
        employee.department,
        employee.subDepartment,
        employee.position,
        employee.category,
        employee.nationality,
        employee.company,
        employee.project,
        employee.costCenter,
        getStatusLabel(employee.status),
        employee.joiningDate,
        employee.createdAt,
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `employee-report-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success("Employee report exported successfully");
  };

  // Pagination
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedEmployees = filteredEmployees.slice(startIndex, endIndex);

  // Get unique values for filters
  const departments = [...new Set(employees.map(employee => employee.department))];
  const projects = [...new Set(employees.map(employee => employee.project))];

  // Statistics
  const totalEmployees = employees.length;
  const activeEmployees = employees.filter(employee => employee.status === 1).length;
  const inactiveEmployees = employees.filter(employee => employee.status === 0).length;
  const departmentsCount = departments.length;
  const projectsCount = projects.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600 mx-auto mb-4"></div>
          <div className="text-muted-foreground">Loading employee data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEmployees}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <div className="h-2 w-2 bg-green-500 rounded-full"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeEmployees}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive</CardTitle>
            <div className="h-2 w-2 bg-red-500 rounded-full"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{inactiveEmployees}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Departments</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{departmentsCount}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projects</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{projectsCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Employee Report</CardTitle>
            <div className="flex gap-2">
              <Button onClick={handleExport} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Print Report
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <select
              value={statusFilter || ""}
              onChange={(e) => setStatusFilter(e.target.value ? Number(e.target.value) : undefined)}
              className="px-3 py-2 border border-input rounded-md bg-background cursor-pointer"
            >
              <option value="">All Status</option>
              <option value="1">Active</option>
              <option value="0">Inactive</option>
            </select>
            
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="px-3 py-2 border border-input rounded-md bg-background cursor-pointer"
            >
              <option value="">All Departments</option>
              {departments.map(department => (
                <option key={department} value={department}>{department}</option>
              ))}
            </select>
            
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="px-3 py-2 border border-input rounded-md bg-background cursor-pointer"
            >
              <option value="">All Projects</option>
              {projects.map(project => (
                <option key={project} value={project}>{project}</option>
              ))}
            </select>
          </div>

          {/* Report Table */}
          <div ref={reportRef} className="print:max-w-none print:w-full">
            <div className="print:hidden mb-4">
              <p className="text-sm text-muted-foreground">
                Showing {filteredEmployees.length} of {totalEmployees} employees
              </p>
            </div>
            
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee ID</TableHead>
                    <TableHead>Full Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="print:hidden">Joining Date</TableHead>
                    <TableHead className="print:hidden">Created Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedEmployees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell className="font-medium">{employee.employeeId}</TableCell>
                      <TableCell>{employee.fullName}</TableCell>
                      <TableCell>{employee.email}</TableCell>
                      <TableCell>{employee.phone}</TableCell>
                      <TableCell>{employee.department}</TableCell>
                      <TableCell>{employee.position}</TableCell>
                      <TableCell>{employee.project}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(employee.status)}>
                          {getStatusLabel(employee.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="print:hidden">{employee.joiningDate}</TableCell>
                      <TableCell className="print:hidden">{employee.createdAt}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 print:hidden">
                <p className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
