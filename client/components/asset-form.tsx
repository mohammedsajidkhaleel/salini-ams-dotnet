"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { itemService } from "@/lib/services/itemService";
import { employeeService } from "@/lib/services/employeeService";
import { ProjectService } from "@/lib/services/projectService";

interface Asset {
  id: string;
  assetTag: string;
  assetName: string;
  serialNumber: string;
  item: string;
  assignedEmployee: string; // This will contain the employee ID
  assignedEmployeeDisplay?: string; // This will contain the display string
  project?: string; // This will contain the project ID for the form
  status: "available" | "assigned" | "maintenance" | "retired";
  condition: "excellent" | "good" | "fair" | "poor";
  poNumber: string;
  description: string;
  project_id?: string;
  project_name?: string;
}

interface AssetFormProps {
  asset?: Asset;
  onSubmit: (asset: Omit<Asset, "id">) => void;
  onCancel: () => void;
}

interface Item {
  id: string;
  name: string;
}

interface Employee {
  id: string;
  code: string;
  name: string;
}

export function AssetForm({
  asset,
  onSubmit,
  onCancel,
}: AssetFormProps) {
  const [formData, setFormData] = useState({
    assetTag: asset?.assetTag || "",
    assetName: asset?.assetName || "",
    serialNumber: asset?.serialNumber || "",
    item: asset?.item || "",
    assignedEmployee: asset?.assignedEmployee || "",
    assignedEmployeeDisplay: asset?.assignedEmployeeDisplay || "",
    project: asset?.project_id || "",
    status: asset?.status || ("available" as const),
    condition: asset?.condition || ("excellent" as const),
    poNumber: asset?.poNumber || "",
    description: asset?.description || "",
  });

  const [items, setItems] = useState<Item[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [projects, setProjects] = useState<Item[]>([]);
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState("");
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
  const [itemSearchTerm, setItemSearchTerm] = useState("");
  const [showItemDropdown, setShowItemDropdown] = useState(false);

  // Load items, employees, and projects from database
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load items
        const itemsResponse = await itemService.getItems({
          pageNumber: 1,
          pageSize: 1000,
          status: 1 // Active status
        });
        
        if (itemsResponse && itemsResponse.items) {
          setItems(itemsResponse.items.map(item => ({
            id: item.id,
            name: item.name
          })));
        }

        // Load employees
        const employeesResponse = await employeeService.getEmployees({
          pageNumber: 1,
          pageSize: 1000,
          status: 1 // Active status
        });
        
        if (employeesResponse && employeesResponse.items) {
          setEmployees(employeesResponse.items.map(emp => ({
            id: emp.id,
            code: emp.employeeId,
            name: emp.fullName
          })));
        }

        // Load projects
        const projects = await ProjectService.getAll();
        if (projects) {
          setProjects(projects.map(project => ({
            id: project.id,
            name: project.name
          })));
        }
      } catch (error) {
        console.error("Error loading form data:", error);
      }
    };

    loadData();
  }, []);

  // Update form data when asset prop changes
  useEffect(() => {
    if (asset) {
      console.log("🔍 Asset form received asset data:", asset)
      console.log("🔍 Asset project_id:", asset.project_id)
      console.log("🔍 Asset project field:", asset.project)
      setFormData({
        assetTag: asset.assetTag || "",
        assetName: asset.assetName || "",
        serialNumber: asset.serialNumber || "",
        item: asset.item || "",
        assignedEmployee: asset.assignedEmployee || "",
        assignedEmployeeDisplay: asset.assignedEmployeeDisplay || "",
        project: asset.project || asset.project_id || "",
        status: asset.status || "available",
        condition: asset.condition || "excellent",
        poNumber: asset.poNumber || "",
        description: asset.description || "",
      });
      setEmployeeSearchTerm(asset.assignedEmployeeDisplay || "");
      setItemSearchTerm(asset.item || "");
    } else {
      setFormData({
        assetTag: "",
        assetName: "",
        serialNumber: "",
        item: "",
        assignedEmployee: "",
        assignedEmployeeDisplay: "",
        project: "",
        status: "available",
        condition: "excellent",
        poNumber: "",
        description: "",
      });
      setEmployeeSearchTerm("");
      setItemSearchTerm("");
    }
  }, [asset]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.employee-dropdown-container')) {
        setShowEmployeeDropdown(false);
      }
      if (!target.closest('.item-dropdown-container')) {
        setShowItemDropdown(false);
      }
    };

    if (showEmployeeDropdown || showItemDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showEmployeeDropdown, showItemDropdown]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate item selection
    if (!formData.item || !items.some(item => item.name === formData.item)) {
      alert("Please select a valid item from the dropdown list.");
      return;
    }
    
    // Validate employee assignment
    if (formData.assignedEmployee && !formData.assignedEmployeeDisplay) {
      alert("Please select a valid employee from the dropdown list.");
      return;
    }
    
    // If employee is assigned but no ID is stored, it means the user typed manually
    if (formData.assignedEmployeeDisplay && !formData.assignedEmployee) {
      alert("Please select an employee from the dropdown list instead of typing manually.");
      return;
    }
    
    console.log("🔍 Form submitting with data:", formData)
    console.log("🔍 Project field being submitted:", formData.project)
    onSubmit(formData);
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleEmployeeSearch = (searchTerm: string) => {
    setEmployeeSearchTerm(searchTerm);
    setShowEmployeeDropdown(true);
    
    // If search term is cleared, clear the employee assignment
    if (searchTerm.trim() === "") {
      setFormData((prev) => ({ 
        ...prev, 
        assignedEmployee: "",
        assignedEmployeeDisplay: ""
      }));
    } else {
      // If user is typing manually, clear the stored employee ID to prevent invalid assignments
      // The validation in handleSubmit will catch this and show an error
      setFormData((prev) => ({ 
        ...prev, 
        assignedEmployee: ""
      }));
    }
  };

  const handleEmployeeSelect = (employee: Employee) => {
    setFormData((prev) => ({ 
      ...prev, 
      assignedEmployee: employee.id, // Store the employee ID
      assignedEmployeeDisplay: `${employee.code} - ${employee.name}` // Store the display string
    }));
    setEmployeeSearchTerm(`${employee.code} - ${employee.name}`);
    setShowEmployeeDropdown(false);
  };

  const handleItemSearch = (searchTerm: string) => {
    setItemSearchTerm(searchTerm);
    setShowItemDropdown(true);
    
    // If search term is cleared, clear the item selection
    if (searchTerm.trim() === "") {
      setFormData((prev) => ({ 
        ...prev, 
        item: ""
      }));
    }
  };

  const handleItemSelect = (item: Item) => {
    setFormData((prev) => ({ 
      ...prev, 
      item: item.name
    }));
    setItemSearchTerm(item.name);
    setShowItemDropdown(false);
  };

  const filteredEmployees = employees.filter(emp => 
    emp.code.toLowerCase().includes(employeeSearchTerm.toLowerCase()) ||
    emp.name.toLowerCase().includes(employeeSearchTerm.toLowerCase())
  );

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(itemSearchTerm.toLowerCase())
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{asset ? "Edit Asset" : "Add New Asset"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="assetTag">Asset Tag *</Label>
              <Input
                id="assetTag"
                value={formData.assetTag}
                onChange={(e) => handleChange("assetTag", e.target.value)}
                placeholder="AT-001"
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="status">Status *</Label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => handleChange("status", e.target.value)}
                className="w-full p-2 border border-input rounded-md bg-background cursor-pointer mt-1"
                required
              >
                <option value="available">Available</option>
                <option value="assigned">Assigned</option>
                <option value="maintenance">Maintenance</option>
                <option value="retired">Retired</option>
              </select>
            </div>
            <div>
              <Label htmlFor="condition">Condition *</Label>
              <select
                id="condition"
                value={formData.condition}
                onChange={(e) => handleChange("condition", e.target.value)}
                className="w-full p-2 border border-input rounded-md bg-background cursor-pointer mt-1"
                required
              >
                <option value="excellent">Excellent</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="poor">Poor</option>
              </select>
            </div>
            <div>
              <Label htmlFor="poNumber">PO Number</Label>
              <Input
                id="poNumber"
                value={formData.poNumber}
                onChange={(e) => handleChange("poNumber", e.target.value)}
                placeholder="PO-2024-001"
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="assetName">Asset Name *</Label>
              <Input
                id="assetName"
                value={formData.assetName}
                onChange={(e) => handleChange("assetName", e.target.value)}
                placeholder="Dell Laptop"
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="serialNumber">Serial Number *</Label>
              <Input
                id="serialNumber"
                value={formData.serialNumber}
                onChange={(e) => handleChange("serialNumber", e.target.value)}
                placeholder="SN123456789"
                required
                className="mt-1"
              />
            </div>
          </div>

          <div className="relative item-dropdown-container">
            <Label htmlFor="item">Item *</Label>
            <Input
              id="item"
              value={itemSearchTerm}
              onChange={(e) => handleItemSearch(e.target.value)}
              onFocus={() => setShowItemDropdown(true)}
              placeholder="Search items..."
              className="mt-1"
              required
            />
            {showItemDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                {filteredItems.length > 0 ? (
                  filteredItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => handleItemSelect(item)}
                    >
                      <div className="font-medium">{item.name}</div>
                    </div>
                  ))
                ) : (
                  <div className="p-2 text-gray-500">No items found</div>
                )}
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="project">Project</Label>
            <select
              id="project"
              value={formData.project}
              onChange={(e) => handleChange("project", e.target.value)}
              className="w-full p-2 border border-input rounded-md bg-background cursor-pointer mt-1"
            >
              <option value="">Select Project (Optional)</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          <div className="relative employee-dropdown-container">
            <Label htmlFor="assignedEmployee">Assigned Employee</Label>
            <Input
              id="assignedEmployee"
              value={employeeSearchTerm}
              onChange={(e) => handleEmployeeSearch(e.target.value)}
              onFocus={() => setShowEmployeeDropdown(true)}
              placeholder="Search by employee code or name..."
              className="mt-1"
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
                  <div className="p-2 text-gray-500">No employees found</div>
                )}
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              rows={3}
              placeholder="Additional notes or specifications"
              className="mt-1"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1 cursor-pointer">
              {asset ? "Update Asset" : "Add Asset"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1 bg-transparent cursor-pointer"
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
