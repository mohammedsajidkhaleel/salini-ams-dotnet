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
import type { Asset } from "@/lib/services/assetService";

interface AssetFormProps {
  asset?: Asset;
  onSubmit: (data: {
    assetTag: string;
    name: string;
    serialNumber?: string;
    itemId?: string;
    projectId?: string;
    status: number;
    condition?: string;
    poNumber?: string;
    description?: string;
    location?: string;
    notes?: string;
    assignedEmployeeId?: string;
    assignedEmployeeDisplay?: string;
  }) => void;
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
  // Helper to convert status number to label
  const statusToLabel = (status: number): string => {
    switch (status) {
      case 1: return "available";
      case 2: return "assigned";
      case 3: return "maintenance";
      case 4: return "retired";
      default: return "available";
    }
  };

  // Helper to convert status label to number
  const labelToStatus = (label: string): number => {
    switch (label) {
      case "available": return 1;
      case "assigned": return 2;
      case "maintenance": return 3;
      case "retired": return 4;
      default: return 1;
    }
  };

  const [formData, setFormData] = useState({
    assetTag: asset?.assetTag || "",
    name: asset?.name || "",
    serialNumber: asset?.serialNumber || "",
    itemId: asset?.itemId || "",
    itemName: asset?.itemName || asset?.item?.name || "",
    assignedEmployeeId: asset?.assignedEmployeeId || asset?.currentAssignment?.employeeId || "",
    assignedEmployeeDisplay: asset?.assignedEmployeeName || asset?.currentAssignment?.employeeName || "",
    projectId: asset?.projectId || "",
    status: asset?.status || 1,
    condition: asset?.condition || "excellent",
    poNumber: asset?.poNumber || "",
    description: asset?.description || "",
    location: asset?.location || "",
    notes: asset?.notes || "",
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
        const isEditing = !!asset;

        // Load items - when editing, include inactive items so we can see the current item
        const itemsResponse = await itemService.getItems({
          pageNumber: 1,
          pageSize: 1000,
          status: isEditing ? undefined : 1 // Load all items when editing, only active when creating
        });

        if (itemsResponse && itemsResponse.items) {
          const mappedItems = itemsResponse.items.map(item => ({
            id: item.id,
            name: item.name
          }));
          console.log("🔍 Loaded items from API:", itemsResponse.items);
          console.log("🔍 Mapped items for state:", mappedItems);
          setItems(mappedItems);
        } else {
          console.warn("⚠️ No items received from API");
        }

        // Load employees - when editing, include inactive employees so we can see the current assignment
        const employeesResponse = await employeeService.getEmployees({
          pageNumber: 1,
          pageSize: 1000,
          status: isEditing ? undefined : 1 // Load all employees when editing, only active when creating
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
  }, [asset]);

  // Update form data when asset prop changes
  useEffect(() => {
    if (asset) {
      const assignedEmployeeId = asset.assignedEmployeeId || asset.currentAssignment?.employeeId || "";
      const assignedEmployeeName = asset.assignedEmployeeName || asset.currentAssignment?.employeeName || "";

      // Try to get IDs from asset object first
      let projectId = asset.projectId || asset.project?.id || "";
      let itemId = asset.itemId || asset.item?.id || "";

      // Fallback: Look up IDs from loaded lists using names if IDs are missing
      // This is necessary because the asset list API might return flattened objects with names but no IDs
      if (!projectId && projects.length > 0) {
        const projectName = asset.projectName || asset.project?.name;
        if (projectName) {
          const foundProject = projects.find(p => p.name.toLowerCase() === projectName.toLowerCase());
          if (foundProject) projectId = foundProject.id;
        }
      }

      if (!itemId && items.length > 0) {
        const itemName = asset.itemName || asset.item?.name;
        if (itemName) {
          const foundItem = items.find(i => i.name.toLowerCase() === itemName.toLowerCase());
          if (foundItem) itemId = foundItem.id;
        }
      }

      setFormData({
        assetTag: asset.assetTag || "",
        name: asset.name || "",
        serialNumber: asset.serialNumber || "",
        itemId: itemId,
        itemName: asset.itemName || asset.item?.name || "",
        assignedEmployeeId,
        assignedEmployeeDisplay: assignedEmployeeName,
        projectId,
        status: asset.status || 1,
        condition: asset.condition || "excellent",
        poNumber: asset.poNumber || "",
        description: asset.description || "",
        location: asset.location || "",
        notes: asset.notes || "",
      });
      setEmployeeSearchTerm(assignedEmployeeName);
      setItemSearchTerm(asset.itemName || asset.item?.name || "");
    } else {
      setFormData({
        assetTag: "",
        name: "",
        serialNumber: "",
        itemId: "",
        itemName: "",
        assignedEmployeeId: "",
        assignedEmployeeDisplay: "",
        projectId: "",
        status: 1,
        condition: "excellent",
        poNumber: "",
        description: "",
        location: "",
        notes: "",
      });
      setEmployeeSearchTerm("");
      setItemSearchTerm("");
    }
  }, [asset, items, projects]);

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

    const isEditing = !!asset;

    // Validate item selection
    if (!formData.itemId) {
      alert("Please select an item from the dropdown list.");
      return;
    }

    // When editing, allow existing itemId even if not in current items list (item might be inactive)
    // When creating, require itemId to be in the items list
    const originalItemId = asset?.itemId || asset?.item?.id;
    const itemIdUnchanged = isEditing && originalItemId === formData.itemId;

    if (!itemIdUnchanged && !items.some(item => item.id === formData.itemId)) {
      alert("Please select a valid item from the dropdown list.");
      return;
    }

    // Validate employee assignment
    // When editing, allow existing assignedEmployeeId even if not in current employees list
    if (formData.assignedEmployeeDisplay) {
      const originalEmployeeId = asset?.assignedEmployeeId || asset?.currentAssignment?.employeeId;
      const originalEmployeeName = asset?.assignedEmployeeName || asset?.currentAssignment?.employeeName;
      const employeeIdUnchanged = isEditing && originalEmployeeId === formData.assignedEmployeeId;

      if (!formData.assignedEmployeeId) {
        // Check if this matches the original asset's assigned employee (if editing)
        const isOriginalAssignment = isEditing &&
          originalEmployeeName === formData.assignedEmployeeDisplay &&
          !originalEmployeeId;

        if (!isOriginalAssignment) {
          alert("Please select an employee from the dropdown list instead of typing manually.");
          return;
        }
        // If it's the original assignment without ID, we'll allow it and let the backend handle it
      } else if (!employeeIdUnchanged && !employees.some(emp => emp.id === formData.assignedEmployeeId)) {
        // For new assets or when employeeId changed, validate it exists in employees list
        alert("Please select a valid employee from the dropdown list.");
        return;
      }
    }

    // Validate project selection
    if (!formData.projectId) {
      alert("Please select a project.");
      return;
    }

    // When editing, allow existing projectId even if not in current projects list
    const originalProjectId = asset?.projectId || asset?.project?.id;
    const projectIdUnchanged = isEditing && originalProjectId === formData.projectId;

    if (!projectIdUnchanged && !projects.some(proj => proj.id === formData.projectId)) {
      alert("Please select a valid project from the dropdown list.");
      return;
    }

    onSubmit({
      assetTag: formData.assetTag,
      name: formData.name,
      serialNumber: formData.serialNumber || undefined,
      itemId: formData.itemId || undefined,
      projectId: formData.projectId,
      status: formData.status,
      condition: formData.condition || undefined,
      poNumber: formData.poNumber || undefined,
      description: formData.description || undefined,
      location: formData.location || undefined,
      notes: formData.notes || undefined,
      assignedEmployeeId: formData.assignedEmployeeId || undefined,
      assignedEmployeeDisplay: formData.assignedEmployeeDisplay || undefined,
    });
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
        assignedEmployeeId: "",
        assignedEmployeeDisplay: ""
      }));
    } else {
      // Only clear the employee ID if the search term doesn't match the current display name
      // This prevents clearing the ID when the form first loads with existing data
      const currentDisplay = formData.assignedEmployeeDisplay || "";
      if (searchTerm !== currentDisplay) {
        // If user is typing manually (different from current value), clear the stored employee ID
        // The validation in handleSubmit will catch this and show an error
        setFormData((prev) => ({
          ...prev,
          assignedEmployeeId: ""
        }));
      }
    }
  };

  const handleEmployeeSelect = (employee: Employee) => {
    setFormData((prev) => ({
      ...prev,
      assignedEmployeeId: employee.id, // Store the employee ID
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
        itemId: "",
        itemName: ""
      }));
    } else {
      // Only clear the item ID if the search term doesn't match the current item name
      // This prevents clearing the ID when the form first loads with existing data
      const currentItemName = formData.itemName || "";
      if (searchTerm !== currentItemName) {
        // If user is typing manually (different from current value), clear the stored item ID
        setFormData((prev) => ({
          ...prev,
          itemId: ""
        }));
      }
    }
  };

  const handleItemSelect = (item: Item) => {
    setFormData((prev) => ({
      ...prev,
      itemId: item.id, // Store the item ID
      itemName: item.name // Store the item name for display
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

  console.log("🔍 Filtering items - Total items:", items.length, "Search term:", itemSearchTerm, "Filtered results:", filteredItems.length);

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
                onChange={(e) => handleChange("status", labelToStatus(e.target.value))}
                className="w-full p-2 border border-input rounded-md bg-background cursor-pointer mt-1"
                required
              >
                <option value={1}>Available</option>
                <option value={2}>Assigned</option>
                <option value={3}>Maintenance</option>
                <option value={4}>Retired</option>
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
              <Label htmlFor="name">Asset Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
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
            <Label htmlFor="project">Project *</Label>
            <select
              id="project"
              value={formData.projectId}
              onChange={(e) => handleChange("projectId", e.target.value)}
              className="w-full p-2 border border-input rounded-md bg-background cursor-pointer mt-1"
              required
            >
              <option value="">Select Project</option>
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
