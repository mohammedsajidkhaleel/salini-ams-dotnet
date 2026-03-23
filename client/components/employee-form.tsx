"use client";

import type React from "react";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Employee } from "@/lib/types";
import { SubDepartmentService } from "@/lib/services/subDepartmentService";
import { DepartmentService } from "@/lib/services/departmentService";
import { employeePositionService } from "@/lib/services/employeePositionService";
import { employeeCategoryService } from "@/lib/services/employeeCategoryService";
import { nationalityService } from "@/lib/services/nationalityService";
import { CompanyService } from "@/lib/services/companyService";
import { ProjectService } from "@/lib/services/projectService";
import { CostCenterService } from "@/lib/services/costCenterService";
import { apiDeduplicator } from "@/lib/apiDeduplicator";

interface EmployeeFormProps {
  employee?: Employee;
  onSubmit: (employee: Omit<Employee, "id">) => void;
  onCancel: () => void;
}

type Option = { id: string; name: string };

export function EmployeeForm({
  employee,
  onSubmit,
  onCancel,
}: EmployeeFormProps) {
  const [formData, setFormData] = useState({
    code: employee?.code || "",
    name: employee?.name || "",
    email: employee?.email || "",
    mobileNumber: employee?.mobileNumber || "",
    idNumber: employee?.idNumber || "",
    // These fields now contain IDs directly from the API, not names
    department: employee?.department || "",
    subDepartment: employee?.subDepartment || "",
    position: employee?.position || "",
    category: employee?.category || "",
    joiningDate: employee?.joiningDate || "",
    nationality: employee?.nationality || "",
    company: employee?.company || "",
    project: employee?.project || "",
    costCenter: employee?.costCenter || "",
    status: employee?.status || ("active" as const),
    address: employee?.address || "",
  });

  // Master data options fetched from DB
  const [departments, setDepartments] = useState<Option[]>([])
  const [subDepartments, setSubDepartments] = useState<Option[]>([])
  const [positions, setPositions] = useState<Option[]>([])
  const [categories, setCategories] = useState<Option[]>([])
  const [nationalities, setNationalities] = useState<Option[]>([])
  const [companies, setCompanies] = useState<Option[]>([])
  const [projects, setProjects] = useState<Option[]>([])
  const [costCenters, setCostCenters] = useState<Option[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const hasLoadedRef = useRef(false) // Prevent multiple loads using ref

  // Load master data (once) - only when form is shown
  useEffect(() => {
    // Prevent multiple simultaneous loads
    if (hasLoadedRef.current) {
      console.log('EmployeeForm: Skipping load - already loaded')
      setIsLoading(false)
      return
    }

    const load = async () => {
      try {
        console.log('EmployeeForm: Loading master data from API')
        hasLoadedRef.current = true
        
        // Load all master data in parallel for better performance with deduplication
        const [
          departmentsData,
          positionsData,
          categoriesData,
          nationalitiesData,
          companiesData,
          projectsData,
          costCentersData
        ] = await Promise.all([
          apiDeduplicator.execute('departments_all', () => DepartmentService.getAll()),
          apiDeduplicator.execute('employee_positions_all', () => employeePositionService.getEmployeePositions({ pageNumber: 1, pageSize: 1000, isActive: true })),
          apiDeduplicator.execute('employee_categories_all', () => employeeCategoryService.getEmployeeCategories({ pageNumber: 1, pageSize: 1000, isActive: true })),
          apiDeduplicator.execute('nationalities_all', () => nationalityService.getNationalities({ pageNumber: 1, pageSize: 1000, isActive: true })),
          apiDeduplicator.execute('companies_all', () => CompanyService.getAll()),
          apiDeduplicator.execute('projects_all', () => ProjectService.getAll()),
          apiDeduplicator.execute('cost_centers_all', () => CostCenterService.getAll())
        ])

        // Set departments
        setDepartments(departmentsData.map(d => ({ id: d.id, name: d.name })))

        // Set positions
        setPositions((positionsData?.items || []).map(p => ({ id: p.id, name: p.name })))

        // Set categories
        setCategories((categoriesData?.items || []).map(c => ({ id: c.id, name: c.name })))

        // Set nationalities
        setNationalities((nationalitiesData?.items || []).map(n => ({ id: n.id, name: n.name })))

        // Set companies
        setCompanies(companiesData.map(c => ({ id: c.id, name: c.name })))

        // Set projects
        setProjects(projectsData.map(p => ({ id: p.id, name: p.name })))

        // Set cost centers
        setCostCenters(costCentersData.map(cc => ({ id: cc.id, name: cc.name })))

        console.log('EmployeeForm: Master data loaded successfully')
      } catch (error) {
        console.error('Error loading master data:', error)
        // Set empty arrays as fallback
        setDepartments([])
        setPositions([])
        setCategories([])
        setNationalities([])
        setCompanies([])
        setProjects([])
        setCostCenters([])
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, []) // Empty dependency array - only run once

  // Reset the loaded flag when component unmounts (for React Strict Mode)
  useEffect(() => {
    return () => {
      hasLoadedRef.current = false
    }
  }, [])

  // Load sub-departments when department changes
  useEffect(() => {
    const loadSubs = async () => {
      if (!formData.department) { setSubDepartments([]); return }
      try {
        const allSubDepartments = await apiDeduplicator.execute(
          'sub_departments_all',
          () => SubDepartmentService.getAll()
        );
        
        // Filter sub-departments by the selected department
        const filteredSubDepartments = allSubDepartments.filter(sub => 
          sub.departmentId === formData.department
        );
        
        setSubDepartments(filteredSubDepartments.map(sub => ({
            id: sub.id,
            name: sub.name
          })));
      } catch (error) {
        console.error("Error loading sub-departments:", error);
        setSubDepartments([]);
      }
    }
    loadSubs()
  }, [formData.department])

  // Track if we've already bound the current employee to prevent re-binding
  const boundEmployeeIdRef = useRef<string | undefined>(undefined)

  // When editing a different employee, rehydrate the form state from the incoming employee prop.
  // Note: employee prop now contains IDs directly (not names), so we can use them directly
  useEffect(() => {
    // Wait for all master data to be loaded and employee to be available
    if (!employee || isLoading) {
      console.log('EmployeeForm: Skipping binding - employee:', !!employee, 'isLoading:', isLoading)
      return
    }
    
    // Ensure at least departments are loaded (required field)
    // Other arrays might be empty, but that's okay as long as loading is complete
    if (departments.length === 0) {
      console.log('EmployeeForm: Skipping form data binding - departments not loaded yet')
      return
    }
    
    // Reset bound employee ref if employee ID changed
    if (boundEmployeeIdRef.current !== employee.id) {
      boundEmployeeIdRef.current = undefined
    }
    
    // Prevent re-binding the same employee
    if (boundEmployeeIdRef.current === employee.id) {
      console.log('EmployeeForm: Skipping form data binding - already bound this employee')
      return
    }
    
    console.log('EmployeeForm: Binding employee data to form')
    console.log('EmployeeForm: Employee prop:', JSON.stringify(employee, null, 2))
    console.log('EmployeeForm: Employee department ID:', employee.department)
    console.log('EmployeeForm: Employee position ID:', employee.position)
    console.log('EmployeeForm: Employee category ID:', employee.category)
    
    // Employee prop now contains IDs directly, so we can use them as-is
    // Validate that the IDs exist in the master data arrays
    const validateId = (id: string | undefined, array: Option[], fieldName: string) => {
      if (!id) return "";
      const exists = array.some(item => item.id === id);
      if (!exists) {
        console.warn(`EmployeeForm: ${fieldName} ID "${id}" not found in master data`);
      }
      return id;
    };
    
    const departmentId = validateId(employee.department, departments, 'department');
    const positionId = validateId(employee.position, positions, 'position');
    const categoryId = validateId(employee.category, categories, 'category');
    const nationalityId = validateId(employee.nationality, nationalities, 'nationality');
    const companyId = validateId(employee.company, companies, 'company');
    const projectId = validateId(employee.project, projects, 'project');
    const costCenterId = validateId(employee.costCenter, costCenters, 'costCenter');
    
    console.log('EmployeeForm: Using IDs directly - department:', departmentId, 'position:', positionId, 'category:', categoryId)
    console.log('EmployeeForm: Available departments:', departments.map(d => ({ id: d.id, name: d.name })))
    console.log('EmployeeForm: Available positions:', positions.map(p => ({ id: p.id, name: p.name })))
    console.log('EmployeeForm: Available categories:', categories.map(c => ({ id: c.id, name: c.name })))
    
    const newFormData = {
      code: employee.code || "",
      name: employee.name || "",
      email: employee.email || "",
      mobileNumber: employee.mobileNumber || "",
      idNumber: employee.idNumber || "",
      department: departmentId,
      subDepartment: employee.subDepartment || "", // Will be validated when sub-departments are loaded
      position: positionId,
      category: categoryId,
      joiningDate: employee.joiningDate || "",
      nationality: nationalityId,
      company: companyId,
      project: projectId,
      costCenter: costCenterId,
      status: employee.status || ("active" as const),
      address: employee.address || "",
    }
    
    console.log('EmployeeForm: Setting form data with IDs:', newFormData)
    
    setFormData(newFormData)
    boundEmployeeIdRef.current = employee.id
  }, [employee, isLoading, departments, positions, categories, nationalities, companies, projects, costCenters]) // Include all master data dependencies

  // Reset bound employee when employee prop changes (including when it becomes undefined)
  useEffect(() => {
    if (!employee) {
      boundEmployeeIdRef.current = undefined
      console.log('EmployeeForm: Employee prop cleared, resetting bound ref')
    } else if (boundEmployeeIdRef.current !== employee.id) {
      console.log('EmployeeForm: Employee ID changed from', boundEmployeeIdRef.current, 'to', employee.id, '- resetting bound ref')
      boundEmployeeIdRef.current = undefined
    }
  }, [employee?.id])

  // Additional effect to handle employee prop changes (for debugging)
  useEffect(() => {
    console.log('EmployeeForm: Employee prop changed:', employee)
  }, [employee])

  // Debug form data changes
  useEffect(() => {
    console.log('EmployeeForm: Form data changed:', formData)
  }, [formData])

  // Set sub-department after sub-departments are loaded for the selected department
  useEffect(() => {
    if (!employee || !employee.subDepartment || subDepartments.length === 0 || !formData.department) return
    
    // Employee prop now contains IDs directly, so validate the sub-department ID exists
    const subDepartmentId = employee.subDepartment;
    const exists = subDepartments.some(s => s.id === subDepartmentId);
    
    if (exists) {
      console.log('EmployeeForm: Validating sub-department ID:', subDepartmentId);
      setFormData(prev => ({ ...prev, subDepartment: subDepartmentId }));
    } else {
      console.log('EmployeeForm: Sub-department ID not found in filtered list:', subDepartmentId);
      // Clear invalid sub-department if it doesn't exist in the filtered list
      setFormData(prev => ({ ...prev, subDepartment: "" }));
    }
  }, [employee, subDepartments, formData.department])

  // When department changes, sub-departments are reloaded from DB via effect above.
  // If current subDepartment is not present in the fetched list, clear it.
  useEffect(() => {
    if (!formData.subDepartment) return
    const exists = subDepartments.some((s) => s.id === formData.subDepartment)
    if (!exists) setFormData((prev) => ({ ...prev, subDepartment: "" }))
  }, [subDepartments])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (field: string, value: string) => {
    if (field === "department") {
      // When department changes, clear sub-department
      setFormData((prev) => ({ ...prev, [field]: value, subDepartment: "" }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
  };

  // subDepartments state already contains the filtered list for the selected department

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            {employee ? "Edit Employee" : "Add New Employee"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Loading form data...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {employee ? "Edit Employee" : "Add New Employee"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="code">Employee Code</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => handleChange("code", e.target.value)}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => handleChange("status", e.target.value)}
                className="w-full p-2 border border-input rounded-md bg-background mt-1"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="email">Email (Optional)</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                className="mt-1"
                placeholder="Enter email address"
              />
            </div>
            <div>
              <Label htmlFor="mobileNumber">Mobile Number (Optional)</Label>
              <Input
                id="mobileNumber"
                value={formData.mobileNumber}
                onChange={(e) => handleChange("mobileNumber", e.target.value)}
                className="mt-1"
                placeholder="Enter mobile number"
              />
            </div>
            <div>
              <Label htmlFor="idNumber">ID Number (Optional)</Label>
              <Input
                id="idNumber"
                value={formData.idNumber}
                onChange={(e) => handleChange("idNumber", e.target.value)}
                className="mt-1"
                placeholder="Enter employee ID number"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="department">Department</Label>
              <select
                id="department"
                value={formData.department}
                onChange={(e) => handleChange("department", e.target.value)}
                className="w-full p-2 border border-input rounded-md bg-background mt-1"
                required
              >
                <option value="">Select Department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="subDepartment">Sub Department</Label>
              <select
                id="subDepartment"
                value={formData.subDepartment}
                onChange={(e) => handleChange("subDepartment", e.target.value)}
                className="w-full p-2 border border-input rounded-md bg-background mt-1"
                required
                disabled={!formData.department}
              >
                <option value="">Select Sub Department</option>
                {subDepartments.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="position">Position</Label>
              <select
                id="position"
                value={formData.position}
                onChange={(e) => handleChange("position", e.target.value)}
                className="w-full p-2 border border-input rounded-md bg-background mt-1"
                required
              >
                <option value="">Select Position</option>
                {positions.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => handleChange("category", e.target.value)}
                className="w-full p-2 border border-input rounded-md bg-background mt-1"
                required
              >
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="joiningDate">Joining Date (Optional)</Label>
              <Input
                id="joiningDate"
                type="date"
                value={formData.joiningDate}
                onChange={(e) => handleChange("joiningDate", e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="nationality">Nationality</Label>
              <select
                id="nationality"
                value={formData.nationality}
                onChange={(e) => handleChange("nationality", e.target.value)}
                className="w-full p-2 border border-input rounded-md bg-background mt-1"
                required
              >
                <option value="">Select Nationality</option>
                {nationalities.map((n) => (
                  <option key={n.id} value={n.id}>{n.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="company">Company</Label>
              <select
                id="company"
                value={formData.company}
                onChange={(e) => handleChange("company", e.target.value)}
                className="w-full p-2 border border-input rounded-md bg-background mt-1"
                required
              >
                <option value="">Select Company</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="project">Project</Label>
              <select
                id="project"
                value={formData.project}
                onChange={(e) => handleChange("project", e.target.value)}
                className="w-full p-2 border border-input rounded-md bg-background mt-1"
                required
              >
                <option value="">Select Project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="costCenter">Cost Center</Label>
              <select
                id="costCenter"
                value={formData.costCenter}
                onChange={(e) => handleChange("costCenter", e.target.value)}
                className="w-full p-2 border border-input rounded-md bg-background mt-1"
                required
              >
                <option value="">Select Cost Center</option>
                {costCenters.map((cc) => (
                  <option key={cc.id} value={cc.id}>{cc.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => handleChange("address", e.target.value)}
              rows={3}
              className="mt-1"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1">
              {employee ? "Update Employee" : "Add Employee"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1 bg-transparent"
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
