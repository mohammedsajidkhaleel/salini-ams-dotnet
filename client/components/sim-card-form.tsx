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

// Helper functions to convert between numeric status and string status
const statusNumberToString = (status: number | string | undefined): string => {
  if (typeof status === 'string') return status;
  switch (status) {
    case 1: return 'active';
    case 2: return 'inactive';
    case 3: return 'suspended';
    case 4: return 'expired';
    default: return 'active';
  }
};

const statusStringToNumber = (status: string): number => {
  switch (status) {
    case 'active': return 1;
    case 'inactive': return 2;
    case 'suspended': return 3;
    case 'expired': return 4;
    default: return 1;
  }
};

export function SimCardForm({
  simCard,
  onSubmit,
  onCancel,
}: SimCardFormProps) {
  const [formData, setFormData] = useState({
    simAccountNo: simCard?.simAccountNo || "",
    simServiceNo: simCard?.simServiceNo || "",
    simStartDate: simCard?.simStartDate || "",
    simTypeId: simCard?.simTypeId || "",
    simCardPlanId: simCard?.simCardPlanId || "",
    simProviderId: simCard?.simProviderId || "",
    simStatus: statusNumberToString(simCard?.simStatus),
    simSerialNo: simCard?.simSerialNo || "",
    assignedTo: simCard?.assignedTo || "",
    projectId: simCard?.projectId || "",
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

  // Load master data and set form data
  // When editing, include inactive items so current selections are visible
  // Form data is set AFTER master data loads to ensure dropdowns bind correctly
  useEffect(() => {
    const load = async () => {
      try {
        const isEditing = !!simCard;

        const [providersRes, typesRes, cardPlansRes, projectsRes, employeesRes] = await Promise.all([
          MasterDataService.getSimProviders(),
          MasterDataService.getSimTypes(),
          MasterDataService.getSimCardPlans(),
          ProjectService.getAll(),
          employeeService.getEmployees({ pageSize: 1000 })
        ]);

        // Filter and map providers
        // When editing, include inactive providers so current selection is visible
        const providersList = isEditing
          ? providersRes.map(provider => ({ id: provider.id, name: provider.name }))
          : providersRes
            .filter(provider => provider.isActive)
            .map(provider => ({ id: provider.id, name: provider.name }));
        setProviders(providersList);

        // Filter and map types
        // When editing, include inactive types so current selection is visible
        const typesList = isEditing
          ? typesRes.map(type => ({ id: type.id, name: type.name }))
          : typesRes
            .filter(type => type.isActive)
            .map(type => ({ id: type.id, name: type.name }));
        setTypes(typesList);

        // Filter and map card plans
        // When editing, include inactive plans so current selection is visible
        const cardPlansList = isEditing
          ? cardPlansRes.map(plan => ({ id: plan.id, name: plan.name, provider_id: plan.providerId }))
          : cardPlansRes
            .filter(plan => plan.isActive)
            .map(plan => ({ id: plan.id, name: plan.name, provider_id: plan.providerId }));
        setCardPlans(cardPlansList);

        // Map projects (only active ones for now, but could include inactive when editing)
        const activeProjects = projectsRes
          .filter(project => project.status === 'active')
          .map(project => ({ id: project.id, name: project.name }));
        setProjects(activeProjects);

        // Map employees
        // When editing, include inactive employees so current assignment is visible
        const employeesList = isEditing
          ? employeesRes.items.map(employee => ({ id: employee.id, code: employee.employeeId, name: employee.fullName }))
          : employeesRes.items
            .filter(employee => employee.status === 1)
            .map(employee => ({ id: employee.id, code: employee.employeeId, name: employee.fullName }));
        setEmployees(employeesList);

        // NOW set form data AFTER master data is loaded
        // This ensures dropdowns have options available when values are set

        if (!simCard) {
          // Reset form for new SIM card
          setFormData({
            simAccountNo: "",
            simServiceNo: "",
            simStartDate: "",
            simTypeId: "",
            simCardPlanId: "",
            simProviderId: "",
            simStatus: "active",
            simSerialNo: "",
            assignedTo: "",
            projectId: "",
          });
          setEmployeeSearchTerm("");
        } else {
          // Helper to safely extract IDs from potentially inconsistent API responses
          const getSafeId = (key: string, relatedObjKey?: string) => {
            let val: any = undefined;

            // 1. Try exact match (camelCase) -> simProviderId
            if ((simCard as any)[key] !== undefined) val = (simCard as any)[key];

            // 2. Try PascalCase -> SimProviderId
            if (!val) {
              const pascalKey = key.charAt(0).toUpperCase() + key.slice(1);
              if ((simCard as any)[pascalKey] !== undefined) val = (simCard as any)[pascalKey];
            }

            // 3. Try PascalCase with ID suffix -> SimProviderID
            if (!val) {
              const pascalKeyID = key.charAt(0).toUpperCase() + key.slice(1).replace('Id', 'ID');
              if ((simCard as any)[pascalKeyID] !== undefined) val = (simCard as any)[pascalKeyID];
            }

            // 4. Try related object
            if (!val && relatedObjKey) {
              // Try camelCase object
              const related = (simCard as any)[relatedObjKey];
              if (related?.id) val = related.id;

              // Try PascalCase object
              const relatedPascal = (simCard as any)[relatedObjKey.charAt(0).toUpperCase() + relatedObjKey.slice(1)];
              if (relatedPascal?.id) val = relatedPascal.id;
              if (relatedPascal?.Id) val = relatedPascal.Id;
              if (relatedPascal?.ID) val = relatedPascal.ID;
            }

            // Return as string if found, otherwise empty string
            return val !== undefined && val !== null ? String(val) : "";
          };

          // Debug: Log all keys to see what we actually have
          console.log("🔑 SimCard Object Keys:", Object.keys(simCard));
          console.log("🔍 Extracting IDs:", {
            Provider: getSafeId('simProviderId', 'simProvider'),
            Type: getSafeId('simTypeId', 'simType'),
            Plan: getSafeId('simCardPlanId', 'simCardPlan'),
            Project: getSafeId('projectId', 'project')
          });

          // Helper to format date for input (YYYY-MM-DD)
          const formatDateForInput = (dateString: string | undefined | null) => {
            if (!dateString) return "";
            try {
              return new Date(dateString).toISOString().split('T')[0];
            } catch (e) {
              return "";
            }
          };

          // Populate form with existing SIM card data
          const formDataToSet = {
            simAccountNo: simCard.simAccountNo || (simCard as any).SimAccountNo || "",
            simServiceNo: simCard.simServiceNo || (simCard as any).SimServiceNo || "",
            simStartDate: formatDateForInput(simCard.simStartDate || (simCard as any).SimStartDate),

            // Use safe extraction for foreign keys
            simTypeId: getSafeId('simTypeId', 'simType'),
            simCardPlanId: getSafeId('simCardPlanId', 'simCardPlan'),
            simProviderId: getSafeId('simProviderId', 'simProvider'),

            simStatus: statusNumberToString(simCard.simStatus || (simCard as any).SimStatus),

            simSerialNo: simCard.simSerialNo || (simCard as any).SimSerialNo || "",
            assignedTo: getSafeId('assignedTo') || (simCard.currentAssignment?.employeeId) || "",
            projectId: getSafeId('projectId', 'project'),
          };

          // Debug logging to verify data binding
          console.log("📝 Setting form data for edit:", {
            simCard: simCard,
            formData: formDataToSet,
            providers: providersList.length,
            types: typesList.length,
            cardPlans: cardPlansList.length,
            projects: activeProjects.length,
            employees: employeesList.length
          });

          // Verify IDs exist in dropdown options and fix if needed
          if (formDataToSet.simProviderId) {
            const foundProvider = providersList.find(p => p.id === formDataToSet.simProviderId);
            if (!foundProvider) {
              console.warn("⚠️ Provider ID not found in options:", formDataToSet.simProviderId);
              // Try to find by name (in case the ID field contains a name)
              const providerByName = providersList.find(p => p.name === formDataToSet.simProviderId);
              if (providerByName) {
                console.log("✅ Found provider by name, using ID:", providerByName.id);
                formDataToSet.simProviderId = providerByName.id;
              } else {
                // Also check if simCard has simProviderName and try to match
                const providerName = (simCard as any).simProviderName || (simCard as any).SimProviderName;
                if (providerName) {
                  const providerByNameMatch = providersList.find(p => p.name === providerName);
                  if (providerByNameMatch) {
                    console.log("✅ Found provider by simProviderName, using ID:", providerByNameMatch.id);
                    formDataToSet.simProviderId = providerByNameMatch.id;
                  } else {
                    console.warn("⚠️ Could not find provider by name either:", providerName);
                    formDataToSet.simProviderId = ""; // Clear invalid value
                  }
                } else {
                  formDataToSet.simProviderId = ""; // Clear invalid value
                }
              }
            }
          }
          if (formDataToSet.simTypeId && !typesList.find(t => t.id === formDataToSet.simTypeId)) {
            console.warn("⚠️ Type ID not found in options:", formDataToSet.simTypeId);
          }
          if (formDataToSet.simCardPlanId && !cardPlansList.find(cp => cp.id === formDataToSet.simCardPlanId)) {
            console.warn("⚠️ Card Plan ID not found in options:", formDataToSet.simCardPlanId);
          }
          if (formDataToSet.projectId && !activeProjects.find(p => p.id === formDataToSet.projectId)) {
            console.warn("⚠️ Project ID not found in options:", formDataToSet.projectId);
          }

          setFormData(formDataToSet);
          // Try to set employee name from various sources
          const empName = simCard.assignedEmployeeName ||
            (simCard as any).AssignedEmployeeName ||
            (simCard.currentAssignment?.employeeName) ||
            "";
          setEmployeeSearchTerm(empName);
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Error loading master data:', error);
        setIsLoading(false);
      }
    };
    load();
  }, [simCard]);

  // Validate provider ID whenever formData or providers change
  // This ensures we always have a valid ID, not a name
  useEffect(() => {
    if (formData.simProviderId && providers.length > 0) {
      const providerById = providers.find(p => p.id === formData.simProviderId);
      if (!providerById) {
        // If not found by ID, it might be a name - try to find by name and correct it
        const providerByName = providers.find(p => p.name === formData.simProviderId);
        if (providerByName) {
          console.warn("⚠️ Provider value was a name, correcting to ID:", providerByName.id);
          setFormData(prev => ({ ...prev, simProviderId: providerByName.id }));
        } else {
          // Invalid value - clear it
          console.warn("⚠️ Invalid provider value, clearing:", formData.simProviderId);
          setFormData(prev => ({ ...prev, simProviderId: "" }));
        }
      }
    }
  }, [formData.simProviderId, providers]);

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
    
    // Validate that simProviderId is actually an ID from the providers list, not a name
    let validatedProviderId = formData.simProviderId;
    if (validatedProviderId) {
      const providerById = providers.find(p => p.id === validatedProviderId);
      if (!providerById) {
        // If not found by ID, it might be a name - try to find by name
        const providerByName = providers.find(p => p.name === validatedProviderId);
        if (providerByName) {
          console.warn("⚠️ Provider value was a name, converting to ID:", providerByName.id);
          validatedProviderId = providerByName.id;
        } else {
          console.error("❌ Invalid provider value (not an ID or name):", validatedProviderId);
          alert("Invalid provider selected. Please select a valid provider.");
          return;
        }
      }
    }
    
    // Convert empty strings to undefined for foreign key fields to avoid constraint violations
    // Convert status string to number for backend
    const submitData = {
      ...formData,
      simStatus: statusStringToNumber(formData.simStatus),
      assignedTo: formData.assignedTo || undefined,
      projectId: formData.projectId || undefined,
      simTypeId: formData.simTypeId || undefined,
      simCardPlanId: formData.simCardPlanId || undefined,
      simProviderId: validatedProviderId || undefined,
    };
    
    onSubmit(submitData);
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };
      // Reset card plan when provider changes
      if (field === 'simProviderId') {
        newData.simCardPlanId = '';
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
      assignedTo: employee.id
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
    if (!formData.simProviderId) {
      return cardPlans; // Show all plans if no provider is selected
    }
    return cardPlans.filter(plan => plan.provider_id === formData.simProviderId);
  }, [cardPlans, formData.simProviderId]);

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
              <Label htmlFor="simAccountNo">SIM Account Number *</Label>
              <Input
                id="simAccountNo"
                value={formData.simAccountNo}
                onChange={(e) => handleChange("simAccountNo", e.target.value)}
                placeholder="SIM account number"
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="simServiceNo">SIM Service Number *</Label>
              <Input
                id="simServiceNo"
                value={formData.simServiceNo}
                onChange={(e) => handleChange("simServiceNo", e.target.value)}
                placeholder="SIM service number"
                required
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="simStartDate">SIM Start Date</Label>
              <Input
                id="simStartDate"
                type="date"
                value={formData.simStartDate}
                onChange={(e) => handleChange("simStartDate", e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="employee-dropdown-container">
              <Label htmlFor="assignedTo">Assigned To</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="assignedTo"
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
                      setFormData(prev => ({ ...prev, assignedTo: "" }));
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
              <Label htmlFor="simStatus">Status</Label>
              <select
                id="simStatus"
                value={formData.simStatus}
                onChange={(e) => handleChange("simStatus", e.target.value)}
                className="w-full p-2 border border-input rounded-md bg-background mt-1"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
                <option value="expired">Expired</option>
              </select>
            </div>
            <div>
              <Label htmlFor="simProviderId">Provider</Label>
              <select
                id="simProviderId"
                value={formData.simProviderId}
                onChange={(e) => handleChange("simProviderId", e.target.value)}
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
              <Label htmlFor="simTypeId">Type</Label>
              <select
                id="simTypeId"
                value={formData.simTypeId}
                onChange={(e) => handleChange("simTypeId", e.target.value)}
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
              <Label htmlFor="simCardPlanId">Card Plan</Label>
              <select
                id="simCardPlanId"
                value={formData.simCardPlanId}
                onChange={(e) => handleChange("simCardPlanId", e.target.value)}
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
                {formData.simProviderId && filteredCardPlans.length === 0 && cardPlans.length > 0 && (
                  <option value="" disabled>No plans available for selected provider</option>
                )}
              </select>
            </div>
            <div>
              <Label htmlFor="simSerialNo">Serial Number</Label>
              <Input
                id="simSerialNo"
                value={formData.simSerialNo}
                onChange={(e) => handleChange("simSerialNo", e.target.value)}
                placeholder="Serial number"
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="projectId">Project</Label>
              <select
                id="projectId"
                value={formData.projectId}
                onChange={(e) => handleChange("projectId", e.target.value)}
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
