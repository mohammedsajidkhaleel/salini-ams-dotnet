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
  sim_account_no: string;
  sim_service_no: string;
  sim_start_date?: string;
  sim_type_id?: string;
  sim_card_plan_id?: string;
  sim_provider_id?: string;
  sim_status: "active" | "inactive" | "suspended" | "expired";
  sim_serial_no?: string;
  created_by?: string;
  created_at: string;
  assigned_to?: string;
  project_id?: string;
  // Display names for foreign keys
  sim_type_name?: string;
  sim_card_plan_name?: string;
  sim_provider_name?: string;
  assigned_to_name?: string;
  project_name?: string;
}