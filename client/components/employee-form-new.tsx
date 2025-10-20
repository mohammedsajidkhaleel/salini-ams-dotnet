"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type Employee } from "@/lib/services";
import { toast } from "@/lib/toast";
import { ErrorHandler } from "@/lib/errorHandler";

interface EmployeeFormProps {
  employee?: Employee;
  onSubmit: (employee: Omit<Employee, "id" | "createdAt" | "updatedAt">) => void;
  onCancel: () => void;
}

type Option = { id: string; name: string };

export function EmployeeForm({
  employee,
  onSubmit,
  onCancel,
}: EmployeeFormProps) {
  const [formData, setFormData] = useState({
    employeeId: employee?.employeeId || "",
    firstName: employee?.firstName || "",
    lastName: employee?.lastName || "",
    email: employee?.email || "",
    phone: employee?.phone || "",
    status: employee?.status || 1,
    nationalityId: employee?.nationalityId || "",
    employeeCategoryId: employee?.employeeCategoryId || "",
    employeePositionId: employee?.employeePositionId || "",
    departmentId: employee?.departmentId || "",
    subDepartmentId: employee?.subDepartmentId || "",
    projectId: employee?.projectId || "",
    companyId: employee?.companyId || "",
    costCenterId: employee?.costCenterId || "",
  });

  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Master data options
  const [departments, setDepartments] = useState<Option[]>([]);
  const [subDepartments, setSubDepartments] = useState<Option[]>([]);
  const [positions, setPositions] = useState<Option[]>([]);
  const [categories, setCategories] = useState<Option[]>([]);
  const [nationalities, setNationalities] = useState<Option[]>([]);
  const [companies, setCompanies] = useState<Option[]>([]);
  const [projects, setProjects] = useState<Option[]>([]);
  const [costCenters, setCostCenters] = useState<Option[]>([]);

  // Load master data
  useEffect(() => {
    loadMasterData();
  }, []);

  // Update sub-departments when department changes
  useEffect(() => {
    if (formData.departmentId) {
      loadSubDepartments(formData.departmentId);
    } else {
      setSubDepartments([]);
      setFormData(prev => ({ ...prev, subDepartmentId: "" }));
    }
  }, [formData.departmentId]);

  const loadMasterData = async () => {
    try {
      setLoading(true);
      
      // TODO: Replace with actual API calls when master data services are implemented
      // For now, using placeholder data
      setDepartments([
        { id: "1", name: "IT Department" },
        { id: "2", name: "HR Department" },
        { id: "3", name: "Finance Department" },
      ]);
      
      setPositions([
        { id: "1", name: "Software Developer" },
        { id: "2", name: "Project Manager" },
        { id: "3", name: "System Administrator" },
      ]);
      
      setCategories([
        { id: "1", name: "Full-time" },
        { id: "2", name: "Part-time" },
        { id: "3", name: "Contract" },
      ]);
      
      setNationalities([
        { id: "1", name: "Indian" },
        { id: "2", name: "American" },
        { id: "3", name: "British" },
      ]);
      
      setCompanies([
        { id: "1", name: "Salini Construction" },
        { id: "2", name: "Salini Engineering" },
      ]);
      
      setProjects([
        { id: "1", name: "Project Alpha" },
        { id: "2", name: "Project Beta" },
        { id: "3", name: "Project Gamma" },
      ]);
      
      setCostCenters([
        { id: "1", name: "IT Operations" },
        { id: "2", name: "Development" },
        { id: "3", name: "Support" },
      ]);
      
    } catch (error) {
      const errorMessage = ErrorHandler.showError(error as Error, 'EmployeeForm');
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const loadSubDepartments = async (departmentId: string) => {
    try {
      // TODO: Replace with actual API call
      // For now, using placeholder data
      setSubDepartments([
        { id: "1", name: "Software Development" },
        { id: "2", name: "Infrastructure" },
        { id: "3", name: "Quality Assurance" },
      ]);
    } catch (error) {
      console.error("Error loading sub-departments:", error);
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.employeeId || !formData.firstName || !formData.lastName) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    
    try {
      await onSubmit(formData);
    } catch (error) {
      const errorMessage = ErrorHandler.showError(error as Error, 'EmployeeForm');
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
            <span className="ml-2 text-gray-600">Loading form data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {employee ? "Edit Employee" : "Add New Employee"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="employeeId">Employee ID *</Label>
              <Input
                id="employeeId"
                value={formData.employeeId}
                onChange={(e) => handleInputChange("employeeId", e.target.value)}
                placeholder="Enter employee ID"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
                placeholder="Enter first name"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => handleInputChange("lastName", e.target.value)}
                placeholder="Enter last name"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="Enter email address"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                placeholder="Enter phone number"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status.toString()}
                onValueChange={(value) => handleInputChange("status", Number(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Active</SelectItem>
                  <SelectItem value="0">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Organizational Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Select
                value={formData.departmentId}
                onValueChange={(value) => handleInputChange("departmentId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="subDepartment">Sub Department</Label>
              <Select
                value={formData.subDepartmentId}
                onValueChange={(value) => handleInputChange("subDepartmentId", value)}
                disabled={!formData.departmentId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select sub department" />
                </SelectTrigger>
                <SelectContent>
                  {subDepartments.map((subDept) => (
                    <SelectItem key={subDept.id} value={subDept.id}>
                      {subDept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="position">Position</Label>
              <Select
                value={formData.employeePositionId}
                onValueChange={(value) => handleInputChange("employeePositionId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select position" />
                </SelectTrigger>
                <SelectContent>
                  {positions.map((position) => (
                    <SelectItem key={position.id} value={position.id}>
                      {position.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.employeeCategoryId}
                onValueChange={(value) => handleInputChange("employeeCategoryId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="nationality">Nationality</Label>
              <Select
                value={formData.nationalityId}
                onValueChange={(value) => handleInputChange("nationalityId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select nationality" />
                </SelectTrigger>
                <SelectContent>
                  {nationalities.map((nationality) => (
                    <SelectItem key={nationality.id} value={nationality.id}>
                      {nationality.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Select
                value={formData.companyId}
                onValueChange={(value) => handleInputChange("companyId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select company" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="project">Project</Label>
              <Select
                value={formData.projectId}
                onValueChange={(value) => handleInputChange("projectId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="costCenter">Cost Center</Label>
              <Select
                value={formData.costCenterId}
                onValueChange={(value) => handleInputChange("costCenterId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select cost center" />
                </SelectTrigger>
                <SelectContent>
                  {costCenters.map((costCenter) => (
                    <SelectItem key={costCenter.id} value={costCenter.id}>
                      {costCenter.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-4 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-cyan-600 hover:bg-cyan-700"
            >
              {isSubmitting ? "Saving..." : employee ? "Update Employee" : "Create Employee"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
