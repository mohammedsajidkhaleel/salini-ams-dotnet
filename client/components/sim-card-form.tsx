"use client";

import type React from "react";
import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MasterDataService, ProjectService, employeeService } from "@/lib/services";
import { SimCard } from "@/lib/types";

interface Employee {
  id: string;
  code: string;
  name: string;
}

interface SimProvider {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
}

interface SimType {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
}

interface SimCardPlan {
  id: string;
  name: string;
  description?: string;
  data_limit?: string;
  monthly_fee?: number;
  provider_id: string;
  is_active: boolean;
}

interface SimCardFormProps {
  simCard?: SimCard;
  onSubmit: (simCard: Omit<SimCard, "id" | "created_at">) => void;
  onCancel: () => void;
}

type Option = { id: string; name: string; provider_id?: string };

export function SimCardForm({
  simCard,
  onSubmit,
  onCancel,
}: SimCardFormProps) {
  const [formData, setFormData] = useState({
    sim_account_no: simCard?.sim_account_no || "",
    sim_service_no: simCard?.sim_service_no || "",
    sim_start_date: simCard?.sim_start_date || "",
    sim_type_id: simCard?.sim_type_id || "",
    sim_card_plan_id: simCard?.sim_card_plan_id || "",
    sim_provider_id: simCard?.sim_provider_id || "",
    sim_status: simCard?.sim_status || ("active" as const),
    sim_serial_no: simCard?.sim_serial_no || "",
    assigned_to: simCard?.assigned_to || "",
    project_id: simCard?.project_id || "",
  });

  // Master data options fetched from DB
  const [providers, setProviders] = useState<Option[]>([]);
  const [types, setTypes] = useState<Option[]>([]);
  const [cardPlans, setCardPlans] = useState<Option[]>([]);
  const [projects, setProjects] = useState<Option[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState("");
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load master data (once)
  useEffect(() => {
    const load = async () => {
      try {
        const [providersRes, typesRes, cardPlansRes, projectsRes, employeesRes] = await Promise.all([
          MasterDataService.getSimProviders(),
          MasterDataService.getSimTypes(),
          MasterDataService.getSimCardPlans(),
          ProjectService.getAll(),
          employeeService.getEmployees({ pageSize: 1000 })
        ]);

        // Filter and map providers (only active ones)
        const activeProviders = providersRes
          .filter(provider => provider.isActive)
          .map(provider => ({ id: provider.id, name: provider.name }));
        setProviders(activeProviders);

        // Filter and map types (only active ones)
        const activeTypes = typesRes
          .filter(type => type.isActive)
          .map(type => ({ id: type.id, name: type.name }));
        setTypes(activeTypes);

        // Filter and map card plans (only active ones)
        const activeCardPlans = cardPlansRes
          .filter(plan => plan.isActive)
          .map(plan => ({ id: plan.id, name: plan.name, provider_id: plan.providerId }));
        setCardPlans(activeCardPlans);

        // Map projects (only active ones)
        const activeProjects = projectsRes
          .filter(project => project.status === 'active')
          .map(project => ({ id: project.id, name: project.name }));
        setProjects(activeProjects);

        // Map employees (only active ones)
        const activeEmployees = employeesRes.items
          .filter(employee => employee.status === 1) // Assuming 1 = active
          .map(employee => ({ id: employee.id, code: employee.employeeId, name: employee.fullName }));
        setEmployees(activeEmployees);
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading master data:', error);
        setIsLoading(false);
      }
    };
    load();
  }, []);

  // When editing a different sim card, rehydrate the form state from the incoming sim card prop
  useEffect(() => {
    if (!simCard) return;

    setFormData({
      sim_account_no: simCard.sim_account_no || "",
      sim_service_no: simCard.sim_service_no || "",
      sim_start_date: simCard.sim_start_date || "",
      sim_type_id: simCard.sim_type_id || "",
      sim_card_plan_id: simCard.sim_card_plan_id || "",
      sim_provider_id: simCard.sim_provider_id || "",
      sim_status: simCard.sim_status || ("active" as const),
      sim_serial_no: simCard.sim_serial_no || "",
      assigned_to: simCard.assigned_to || "",
      project_id: simCard.project_id || "",
    });
    setEmployeeSearchTerm(simCard.assigned_to_name || "");
  }, [simCard]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.employee-dropdown-container')) {
        setShowEmployeeDropdown(false);
      }
    };

    if (showEmployeeDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showEmployeeDropdown]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Convert empty strings to undefined for foreign key fields to avoid constraint violations
    const submitData = {
      ...formData,
      assigned_to: formData.assigned_to || undefined,
      project_id: formData.project_id || undefined,
      sim_type_id: formData.sim_type_id || undefined,
      sim_card_plan_id: formData.sim_card_plan_id || undefined,
      sim_provider_id: formData.sim_provider_id || undefined,
    };
    
    onSubmit(submitData);
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };
      // Reset card plan when provider changes
      if (field === 'sim_provider_id') {
        newData.sim_card_plan_id = '';
      }
      return newData;
    });
  };

  const handleEmployeeSearch = (searchTerm: string) => {
    setEmployeeSearchTerm(searchTerm);
    setShowEmployeeDropdown(true);
  };

  const handleEmployeeSelect = (employee: Employee) => {
    setFormData((prev) => ({ 
      ...prev, 
      assigned_to: employee.id 
    }));
    setEmployeeSearchTerm(`${employee.code} - ${employee.name}`);
    setShowEmployeeDropdown(false);
  };

  const filteredEmployees = employees.filter(emp => 
    emp.code.toLowerCase().includes(employeeSearchTerm.toLowerCase()) ||
    emp.name.toLowerCase().includes(employeeSearchTerm.toLowerCase())
  );

  // Memoize filtered card plans to prevent unnecessary re-computations
  const filteredCardPlans = useMemo(() => {
    if (!formData.sim_provider_id) {
      return cardPlans; // Show all plans if no provider is selected
    }
    return cardPlans.filter(plan => plan.provider_id === formData.sim_provider_id);
  }, [cardPlans, formData.sim_provider_id]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            {simCard ? "Edit SIM Card" : "Add New SIM Card"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Loading form data...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {simCard ? "Edit SIM Card" : "Add New SIM Card"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="sim_account_no">SIM Account Number *</Label>
              <Input
                id="sim_account_no"
                value={formData.sim_account_no}
                onChange={(e) => handleChange("sim_account_no", e.target.value)}
                placeholder="SIM account number"
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="sim_service_no">SIM Service Number *</Label>
              <Input
                id="sim_service_no"
                value={formData.sim_service_no}
                onChange={(e) => handleChange("sim_service_no", e.target.value)}
                placeholder="SIM service number"
                required
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="sim_start_date">SIM Start Date</Label>
              <Input
                id="sim_start_date"
                type="date"
                value={formData.sim_start_date}
                onChange={(e) => handleChange("sim_start_date", e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="employee-dropdown-container">
              <Label htmlFor="assigned_to">Assigned To</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="assigned_to"
                  value={employeeSearchTerm}
                  onChange={(e) => handleEmployeeSearch(e.target.value)}
                  placeholder="Search employee by code or name"
                  className="flex-1"
                />
                {employeeSearchTerm && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEmployeeSearchTerm("");
                      setFormData(prev => ({ ...prev, assigned_to: "" }));
                    }}
                    className="px-3"
                  >
                    Clear
                  </Button>
                )}
              </div>
              {showEmployeeDropdown && filteredEmployees.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                  {filteredEmployees.map((employee) => (
                    <div
                      key={employee.id}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => handleEmployeeSelect(employee)}
                    >
                      <div className="font-medium">{employee.code}</div>
                      <div className="text-sm text-gray-600">{employee.name}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="sim_status">Status</Label>
              <select
                id="sim_status"
                value={formData.sim_status}
                onChange={(e) => handleChange("sim_status", e.target.value)}
                className="w-full p-2 border border-input rounded-md bg-background mt-1"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
                <option value="expired">Expired</option>
              </select>
            </div>
            <div>
              <Label htmlFor="sim_provider_id">Provider</Label>
              <select
                id="sim_provider_id"
                value={formData.sim_provider_id}
                onChange={(e) => handleChange("sim_provider_id", e.target.value)}
                className="w-full p-2 border border-input rounded-md bg-background mt-1"
              >
                <option value="">Select Provider</option>
                {providers.map((provider) => (
                  <option key={provider.id} value={provider.id}>
                    {provider.name}
                  </option>
                ))}
                {providers.length === 0 && (
                  <option value="" disabled>No providers available</option>
                )}
              </select>
              {providers.length === 0 && (
                <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm text-yellow-800">No providers found. Please add SIM providers in the master data section first.</p>
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="sim_type_id">Type</Label>
              <select
                id="sim_type_id"
                value={formData.sim_type_id}
                onChange={(e) => handleChange("sim_type_id", e.target.value)}
                className="w-full p-2 border border-input rounded-md bg-background mt-1"
              >
                <option value="">Select Type</option>
                {types.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
                {types.length === 0 && (
                  <option value="" disabled>No types available</option>
                )}
              </select>
              {types.length === 0 && (
                <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm text-yellow-800">No SIM types found. Please add SIM types in the master data section first.</p>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="sim_card_plan_id">Card Plan</Label>
              <select
                id="sim_card_plan_id"
                value={formData.sim_card_plan_id}
                onChange={(e) => handleChange("sim_card_plan_id", e.target.value)}
                className="w-full p-2 border border-input rounded-md bg-background mt-1"
              >
                <option value="">Select Card Plan</option>
                {filteredCardPlans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name}
                  </option>
                ))}
                {cardPlans.length === 0 && (
                  <option value="" disabled>No card plans available</option>
                )}
                {formData.sim_provider_id && filteredCardPlans.length === 0 && cardPlans.length > 0 && (
                  <option value="" disabled>No plans available for selected provider</option>
                )}
              </select>
            </div>
            <div>
              <Label htmlFor="sim_serial_no">Serial Number</Label>
              <Input
                id="sim_serial_no"
                value={formData.sim_serial_no}
                onChange={(e) => handleChange("sim_serial_no", e.target.value)}
                placeholder="Serial number"
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="project_id">Project</Label>
              <select
                id="project_id"
                value={formData.project_id}
                onChange={(e) => handleChange("project_id", e.target.value)}
                className="w-full p-2 border border-input rounded-md bg-background mt-1"
              >
                <option value="">Select Project</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
            <div></div>
          </div>


          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1">
              {simCard ? "Update SIM Card" : "Add SIM Card"}
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
