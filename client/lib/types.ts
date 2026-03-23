export interface Employee {
  id: string;
  code: string;
  name: string;
  email?: string;
  mobileNumber?: string;
  idNumber?: string;
  department?: string;
  subDepartment?: string;
  position?: string;
  category?: string;
  joiningDate?: string;
  nationality?: string;
  company?: string;
  company_name?: string;
  project?: string;
  project_name?: string;
  costCenter?: string;
  status: "active" | "inactive";
  address?: string;
}

export interface SoftwareLicense {
  id: string;
  software_name: string;
  license_key?: string;
  license_type?: string;
  seats?: number;
  vendor?: string;
  purchase_date?: string;
  expiry_date?: string;
  cost?: number;
  status: "active" | "inactive" | "expired";
  notes?: string;
  project_id?: string;
  project_name?: string;
  po_number?: string;
  created_at: string;
  created_by?: string;
}

export interface Project {
  id: string;
  name: string;
  code?: string;
  company_id?: string;
  cost_center_id?: string;
  nationality_id?: string;
  created_at: string;
}

export interface Asset {
  id: string;
  asset_tag: string;
  asset_name: string;
  serial_number?: string;
  item_id?: string;
  assigned_to?: string;
  status: "available" | "assigned" | "maintenance" | "retired";
  condition?: "excellent" | "good" | "fair" | "poor";
  po_number?: string;
  description?: string;
  project_id?: string;
  created_at: string;
  created_by?: string;
  // Display names for foreign keys
  item_name?: string;
  assigned_to_name?: string;
  project_name?: string;
}

export interface SimCard {
  id: string;
  simAccountNo: string;
  simServiceNo: string;
  simStartDate?: string;
  simTypeId?: string;
  simCardPlanId?: string;
  simProviderId?: string;
  simStatus: number | "active" | "inactive" | "suspended" | "expired";
  simSerialNo?: string;
  createdBy?: string;
  createdAt: string;
  assignedTo?: string;
  projectId?: string;
  // Display names for foreign keys (matching backend response)
  simTypeName?: string;
  simCardPlanName?: string;
  simProviderName?: string;
  assignedEmployeeName?: string;
  assignmentDate? : string;
  projectName?: string;
  // Navigation properties
  simType?: {
    id: string;
    name: string;
  };
  simCardPlan?: {
    id: string;
    name: string;
    dataLimit?: string;
    monthlyFee?: number;
  };
  simProvider?: {
    id: string;
    name: string;
  };
  project?: {
    id: string;
    name: string;
    code: string;
  };
  currentAssignment?: {
    id: string;
    employeeId: string;
    employeeName: string;
    assignedDate: string;
    status: number;
  };
}