"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import { MasterDataService } from "@/lib/services/masterDataService";
import { ProjectService } from "@/lib/services/projectService";
import { ItemService } from "@/lib/services/itemService";
import { employeeService } from "@/lib/services/employeeService";

interface PurchaseOrderItem {
  id: string;
  itemId: string;
  itemName: string;
  quantity: number;
  description: string;
}

interface Employee {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  fullName: string;
}

interface PurchaseOrder {
  id: string;
  poNumber: string;
  purchaseDate: string;
  description: string;
  requestedBy: string;
  requestedById: string;
  supplierId: string;
  supplierName: string;
  projectId?: string;
  projectName?: string;
  items: PurchaseOrderItem[];
}

interface PurchaseOrderFormProps {
  purchaseOrder?: PurchaseOrder;
  onSubmit: (purchaseOrder: Omit<PurchaseOrder, "id">) => void;
  onCancel: () => void;
}

export function PurchaseOrderForm({
  purchaseOrder,
  onSubmit,
  onCancel,
}: PurchaseOrderFormProps) {
  const [formData, setFormData] = useState({
    poNumber: "",
    purchaseDate: new Date().toISOString().split("T")[0],
    description: "",
    requestedBy: "",
    requestedById: "",
    supplierId: "",
    projectId: "",
  });

  const [items, setItems] = useState<PurchaseOrderItem[]>([
    {
      id: crypto.randomUUID(),
      itemId: "",
      itemName: "",
      quantity: 1,
      description: "",
    },
  ]);

  const [employeeSearchTerm, setEmployeeSearchTerm] = useState("");
  const [itemSearchTerm, setItemSearchTerm] = useState("");
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
  const [showItemDropdown, setShowItemDropdown] = useState(false);

  // State for dynamic data
  const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [availableItems, setAvailableItems] = useState<{ id: string; name: string }[]>([]);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Initialize form data when purchase order changes
  useEffect(() => {
    console.log('PurchaseOrderForm: purchaseOrder prop changed:', purchaseOrder);
    if (purchaseOrder) {
      console.log('PurchaseOrderForm: Setting form data for editing:', {
        poNumber: purchaseOrder.poNumber,
        purchaseDate: purchaseOrder.purchaseDate,
        description: purchaseOrder.description,
        supplierId: purchaseOrder.supplierId,
        projectId: purchaseOrder.projectId,
        itemsCount: purchaseOrder.items?.length || 0
      });
      const newFormData = {
        poNumber: purchaseOrder.poNumber || "",
        purchaseDate: purchaseOrder.purchaseDate || new Date().toISOString().split("T")[0],
        description: purchaseOrder.description || "",
        requestedBy: purchaseOrder.requestedBy || "",
        requestedById: purchaseOrder.requestedById || "",
        supplierId: purchaseOrder.supplierId || "",
        projectId: purchaseOrder.projectId || "",
      };
      console.log('PurchaseOrderForm: Setting new form data:', newFormData);
      setFormData(newFormData);
      
      setEmployeeSearchTerm(purchaseOrder.requestedBy || "");
      
      // Log the items being set
      const itemsToSet = purchaseOrder.items && purchaseOrder.items.length > 0 ? purchaseOrder.items : [
        {
          id: crypto.randomUUID(),
          itemId: "",
          itemName: "",
          quantity: 1,
          description: "",
        },
      ];
      console.log('PurchaseOrderForm: Setting items:', itemsToSet);
      console.log('PurchaseOrderForm: Original items from purchaseOrder:', purchaseOrder.items);
      
      setItems(itemsToSet);
    } else {
      // Reset form for new purchase order
      setFormData({
        poNumber: "",
        purchaseDate: new Date().toISOString().split("T")[0],
        description: "",
        requestedBy: "",
        requestedById: "",
        supplierId: "",
        projectId: "",
      });
      
      setEmployeeSearchTerm("");
      
      setItems([
        {
          id: crypto.randomUUID(),
          itemId: "",
          itemName: "",
          quantity: 1,
          description: "",
        },
      ]);
    }
  }, [purchaseOrder]);

  // Update employee search term when employees are loaded and we're editing
  useEffect(() => {
    if (purchaseOrder && purchaseOrder.requestedById && employees.length > 0) {
      const selectedEmp = employees.find(emp => emp.id === purchaseOrder.requestedById);
      if (selectedEmp) {
        setEmployeeSearchTerm(selectedEmp.fullName);
      }
    }
  }, [employees, purchaseOrder]);

  // Fetch suppliers, employees, and items from database
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingData(true);

        // Fetch all data in parallel with individual error handling
        const [suppliersRes, employeesRes, itemsRes, projectsRes] = await Promise.allSettled([
          MasterDataService.getAll('suppliers'),
          employeeService.getEmployees({ pageSize: 1000 }),
          MasterDataService.getAll('items'),
          ProjectService.getAll()
        ]);

        // Handle each response
        const suppliers = suppliersRes.status === 'fulfilled' ? suppliersRes.value : [];
        const employees = employeesRes.status === 'fulfilled' ? employeesRes.value : { items: [] };
        const items = itemsRes.status === 'fulfilled' ? itemsRes.value : [];
        const projects = projectsRes.status === 'fulfilled' ? projectsRes.value : [];

        // Log any errors and successful responses
        if (suppliersRes.status === 'rejected') console.error('Suppliers API error:', suppliersRes.reason);
        if (employeesRes.status === 'rejected') console.error('Employees API error:', employeesRes.reason);
        if (itemsRes.status === 'rejected') console.error('Items API error:', itemsRes.reason);
        if (projectsRes.status === 'rejected') console.error('Projects API error:', projectsRes.reason);
        
        // Debug successful responses (can be removed after testing)
        if (itemsRes.status === 'fulfilled') {
          console.log('Items API success - found', itemsRes.value?.length, 'items');
        }

        // Process suppliers
        const activeSuppliers = suppliers
          .filter(supplier => supplier.status?.toLowerCase() === 'active')
          .map(supplier => ({ id: supplier.id, name: supplier.name }));
        setSuppliers(activeSuppliers);

        // Process employees
        const activeEmployees = employees.items
          .filter(emp => emp.status === 1)
          .map(emp => ({
            id: emp.id,
            employeeCode: emp.employeeId,
            firstName: emp.firstName,
            lastName: emp.lastName,
            fullName: emp.fullName
          }));
        setEmployees(activeEmployees);

        // Process items
        const activeItems = items
          .filter(item => item.status?.toLowerCase() === 'active')
          .map(item => ({ id: item.id, name: item.name }));
        
        // If no items from API, use fallback data
        if (activeItems.length === 0) {
          console.log('No active items found, using fallback data');
          const fallbackItems = [
            { id: 'ITEM_001', name: 'Dell Latitude 5520' },
            { id: 'ITEM_002', name: 'HP EliteBook 850' },
            { id: 'ITEM_003', name: 'Dell OptiPlex 7090' },
            { id: 'ITEM_004', name: 'iPhone 14' },
            { id: 'ITEM_005', name: 'Cisco Catalyst 2960' }
          ];
          setAvailableItems(fallbackItems);
        } else {
          console.log('Using real API data for items:', activeItems.length, 'items');
          setAvailableItems(activeItems);
        }

        // Process projects
        const activeProjects = projects
          .filter(project => project.status?.toLowerCase() === 'active')
          .map(project => ({ id: project.id, name: project.name }));
        setProjects(activeProjects);

      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, []);

  // Filter employees based on search term
  const filteredEmployees = employeeSearchTerm 
    ? employees.filter(emp =>
        emp.employeeCode.toLowerCase().includes(employeeSearchTerm.toLowerCase()) ||
        emp.fullName.toLowerCase().includes(employeeSearchTerm.toLowerCase())
      )
    : employees; // Show all employees when no search term


  // Get selected employee for display
  const selectedEmployee = employees.find(emp => emp.id === formData.requestedById);

  // Filter items based on search term
  const filteredItems = availableItems.filter(item =>
    item.name.toLowerCase().includes(itemSearchTerm.toLowerCase())
  );



  const handleItemChange = (
    id: string,
    field: keyof PurchaseOrderItem,
    value: string | number
  ) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };
          
          // If item is selected, update item name
          if (field === "itemId") {
            const selectedItem = availableItems.find(i => i.id === value);
            if (selectedItem) {
              updatedItem.itemName = selectedItem.name;
            }
          }
          
          return updatedItem;
        }
        return item;
      })
    );
  };

  const addItem = () => {
    const newItem: PurchaseOrderItem = {
      id: crypto.randomUUID(), // Generate proper UUID
      itemId: "",
      itemName: "",
      quantity: 1,
      description: "",
    };
    setItems((prev) => [...prev, newItem]);
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedSupplier = suppliers.find(s => s.id === formData.supplierId);
    onSubmit({
      ...formData,
      supplierName: selectedSupplier?.name || "",
      items,
    });
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };


  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <CardTitle>{purchaseOrder ? "Edit Purchase Order" : "Add New Purchase Order"}</CardTitle>
      </CardHeader>
      <CardContent>
        {loadingData ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Loading form data...</div>
          </div>
        ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
          <Card>
            <CardHeader>
                <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="poNumber">PO Number *</Label>
                <Input
                  id="poNumber"
                  value={formData.poNumber}
                  onChange={(e) => handleChange("poNumber", e.target.value)}
                      placeholder="PO-2024-001"
                  required
                />
              </div>
                  <div className="space-y-2">
                    <Label htmlFor="purchaseDate">Purchase Date *</Label>
                    <Input
                      id="purchaseDate"
                      type="date"
                      value={formData.purchaseDate}
                      onChange={(e) => handleChange("purchaseDate", e.target.value)}
                      required
                    />
              </div>
              </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleChange("description", e.target.value)}
                    placeholder="Purchase order description (optional)"
                    rows={2}
                  />
              </div>
              </CardContent>
            </Card>

            {/* Request Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Request Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                <Label htmlFor="requestedBy">Requested By</Label>
                    <div className="relative">
                <Input
                  id="requestedBy"
                        value={employeeSearchTerm}
                        onChange={(e) => {
                          setEmployeeSearchTerm(e.target.value);
                          setShowEmployeeDropdown(true);
                          // Clear selection if user starts typing
                          if (e.target.value !== selectedEmployee?.fullName) {
                            setFormData(prev => ({ 
                              ...prev, 
                              requestedBy: "",
                              requestedById: ""
                            }));
                          }
                        }}
                        onFocus={() => setShowEmployeeDropdown(true)}
                        onClick={() => setShowEmployeeDropdown(true)}
                        onBlur={() => {
                          // Delay hiding dropdown to allow click
                          setTimeout(() => setShowEmployeeDropdown(false), 200);
                        }}
                        placeholder="Search by employee code or name..."
                        autoComplete="off"
                      />
                      {showEmployeeDropdown && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                          {filteredEmployees.length > 0 ? (
                            filteredEmployees.map((employee) => (
                              <div
                                key={employee.id}
                                className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setFormData(prev => ({ 
                                    ...prev, 
                                    requestedBy: employee.fullName,
                                    requestedById: employee.id
                                  }));
                                  setEmployeeSearchTerm(employee.fullName);
                                  setShowEmployeeDropdown(false);
                                }}
                              >
                                <div className="font-medium text-sm">{employee.employeeCode}</div>
                                <div className="text-sm text-gray-600">{employee.fullName}</div>
                              </div>
                            ))
                          ) : (
                            <div className="px-4 py-2 text-gray-500 text-sm">
                              {employeeSearchTerm ? "No employees found" : "No employees available"}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    {selectedEmployee && !showEmployeeDropdown && (
                      <div className="text-sm text-muted-foreground">
                        Selected: {selectedEmployee.employeeCode} - {selectedEmployee.fullName}
              </div>
                    )}
              </div>
                  <div className="space-y-2">
                    <Label htmlFor="supplierId">Supplier</Label>
                <select
                      id="supplierId"
                      value={formData.supplierId}
                      onChange={(e) => handleChange("supplierId", e.target.value)}
                      className="w-full p-2 border border-input rounded-md bg-background"
                    >
                      <option value="">Select Supplier</option>
                      {suppliers.map((supplier) => (
                        <option key={supplier.id} value={supplier.id}>
                          {supplier.name}
                  </option>
                      ))}
                </select>
              </div>
                  <div className="space-y-2">
                    <Label htmlFor="projectId">Project</Label>
                <select
                      id="projectId"
                      value={formData.projectId}
                      onChange={(e) => handleChange("projectId", e.target.value)}
                      className="w-full p-2 border border-input rounded-md bg-background"
                    >
                      <option value="">Select Project (Optional)</option>
                      {projects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                  </option>
                      ))}
                </select>
              </div>
              </div>
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Items</CardTitle>
              <Button type="button" onClick={addItem} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {items.map((item, index) => (
                    <div key={item.id} className="border rounded-lg p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Item {index + 1}</h4>
                        {items.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`item-${item.id}`}>Item *</Label>
                          <div className="relative">
                      <Input
                              id={`item-${item.id}`}
                              value={itemSearchTerm}
                              onChange={(e) => {
                                setItemSearchTerm(e.target.value);
                                setShowItemDropdown(true);
                              }}
                              onFocus={() => setShowItemDropdown(true)}
                              placeholder="Search items..."
                            />
                            {showItemDropdown && itemSearchTerm && (
                              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                {filteredItems.map((availableItem) => (
                                  <div
                                    key={availableItem.id}
                                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                    onClick={() => {
                                      handleItemChange(item.id, "itemId", availableItem.id);
                                      handleItemChange(item.id, "itemName", availableItem.name);
                                      setItemSearchTerm("");
                                      setShowItemDropdown(false);
                                    }}
                                  >
                                    {availableItem.name}
                                  </div>
                                ))}
                                {filteredItems.length === 0 && (
                                  <div className="px-4 py-2 text-gray-500">No items found</div>
                                )}
                              </div>
                            )}
                          </div>
                          {item.itemName && (
                            <div className="text-sm text-muted-foreground">
                              Selected: {item.itemName}
                            </div>
                          )}
                    </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor={`quantity-${item.id}`}>Quantity *</Label>
                      <Input
                        id={`quantity-${item.id}`}
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) =>
                          handleItemChange(
                            item.id,
                            "quantity",
                            Number.parseInt(e.target.value) || 1
                          )
                        }
                        required
                      />
                    </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor={`description-${item.id}`}>Description *</Label>
                      <Input
                          id={`description-${item.id}`}
                          value={item.description}
                        onChange={(e) =>
                          handleItemChange(
                            item.id,
                              "description",
                              e.target.value
                          )
                        }
                          placeholder="Item description"
                        required
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>


            {/* Form Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
              <Button type="submit" className="bg-cyan-600 hover:bg-cyan-700">
                {purchaseOrder ? "Update Purchase Order" : "Create Purchase Order"}
              </Button>
          </div>
        </form>
        )}
      </CardContent>
    </Card>
  );
}
