/**
 * Services Index
 * Centralized export of all API services
 */

// Core services
export { apiClient } from '../apiClient';
export { authService } from '../authService';

// Data services
export { MasterDataService } from './masterDataService';
export { ErrorHandler, useErrorHandler } from '../errorHandler';
export { toast } from '../toast';
export { config } from '../config';

// Entity services
export { employeeService } from './employeeService';
export { assetService } from './assetService';
export { simCardService } from './simCardService';
export { softwareLicenseService } from './softwareLicenseService';
export { reportsService } from './reportsService';
export { userManagementService } from './userManagementService';

// Master data services (existing)
export { companyService } from './companyService';
export { costCenterService } from './costCenterService';
export { departmentService } from './departmentService';
export { itemService } from './itemService';
export { ProjectService } from './projectService';
export type { Project, ProjectListItem } from './projectService';
export { simCardPlanService } from './simCardPlanService';
export { subDepartmentService } from './subDepartmentService';

// Types
export type { ApiResponse, PaginatedResponse, ApiError } from '../apiClient';
export type { User, AuthState } from '../authService';
export type { ErrorInfo } from '../errorHandler';
export type { ToastType, ToastOptions } from '../toast';

// Employee types
export type {
  Employee,
  EmployeeListItem,
  EmployeeCreateRequest,
  EmployeeUpdateRequest,
  EmployeeListRequest,
} from './employeeService';

// Asset types
export type {
  Asset,
  AssetCreateRequest,
  AssetUpdateRequest,
  AssetListRequest,
  AssetAssignmentRequest,
  AssetUnassignmentRequest,
} from './assetService';

// SIM Card types
export type {
  SimCard,
  SimCardCreateRequest,
  SimCardUpdateRequest,
  SimCardListRequest,
  SimCardAssignmentRequest,
  SimCardUnassignmentRequest,
} from './simCardService';

// Software License types
export type {
  SoftwareLicense,
  SoftwareLicenseCreateRequest,
  SoftwareLicenseUpdateRequest,
  SoftwareLicenseListRequest,
  SoftwareLicenseAssignmentRequest,
  SoftwareLicenseUnassignmentRequest,
} from './softwareLicenseService';

// Reports types
export type {
  AssetSummaryReport,
  EmployeeAssetReport,
  AssetUtilizationReport,
  AssetMaintenanceReport,
  AssetExpiringWarranty,
  ReportRequest,
} from './reportsService';

// User Management types
export type {
  User as UserManagementUser,
  UserCreateRequest,
  UserUpdateRequest,
  UserListRequest,
  ChangePasswordRequest,
  ResetPasswordRequest,
  UserRole,
  UserPermission,
} from './userManagementService';
