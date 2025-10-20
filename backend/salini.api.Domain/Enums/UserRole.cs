namespace salini.api.Domain.Enums;

public enum UserRole
{
    SuperAdmin = 1,
    Admin = 2,
    Manager = 3,
    User = 4
}

public static class UserPermissions
{
    // Master Data Permissions
    public const string MasterDataRead = "master_data:read";
    public const string MasterDataCreate = "master_data:create";
    public const string MasterDataUpdate = "master_data:update";
    public const string MasterDataDelete = "master_data:delete";
    
    // Employee Permissions
    public const string EmployeesRead = "employees:read";
    public const string EmployeesCreate = "employees:create";
    public const string EmployeesUpdate = "employees:update";
    public const string EmployeesDelete = "employees:delete";
    public const string EmployeesImport = "employees:import";
    public const string EmployeesExport = "employees:export";
    
    // Asset Permissions
    public const string AssetsRead = "assets:read";
    public const string AssetsCreate = "assets:create";
    public const string AssetsUpdate = "assets:update";
    public const string AssetsDelete = "assets:delete";
    public const string AssetsAssign = "assets:assign";
    public const string AssetsUnassign = "assets:unassign";
    
    // Accessory Permissions
    public const string AccessoriesRead = "accessories:read";
    public const string AccessoriesCreate = "accessories:create";
    public const string AccessoriesUpdate = "accessories:update";
    public const string AccessoriesDelete = "accessories:delete";
    public const string AccessoriesAssign = "accessories:assign";
    public const string AccessoriesUnassign = "accessories:unassign";
    
    // SIM Card Permissions
    public const string SimCardsRead = "sim_cards:read";
    public const string SimCardsCreate = "sim_cards:create";
    public const string SimCardsUpdate = "sim_cards:update";
    public const string SimCardsDelete = "sim_cards:delete";
    public const string SimCardsAssign = "sim_cards:assign";
    public const string SimCardsUnassign = "sim_cards:unassign";
    
    // Software License Permissions
    public const string SoftwareLicensesRead = "software_licenses:read";
    public const string SoftwareLicensesCreate = "software_licenses:create";
    public const string SoftwareLicensesUpdate = "software_licenses:update";
    public const string SoftwareLicensesDelete = "software_licenses:delete";
    public const string SoftwareLicensesAssign = "software_licenses:assign";
    public const string SoftwareLicensesUnassign = "software_licenses:unassign";
    
    // Purchase Order Permissions
    public const string PurchaseOrdersRead = "purchase_orders:read";
    public const string PurchaseOrdersCreate = "purchase_orders:create";
    public const string PurchaseOrdersUpdate = "purchase_orders:update";
    public const string PurchaseOrdersDelete = "purchase_orders:delete";
    public const string PurchaseOrdersApprove = "purchase_orders:approve";
    
    // Report Permissions
    public const string ReportsRead = "reports:read";
    public const string ReportsGenerate = "reports:generate";
    public const string ReportsExport = "reports:export";
    
    // User Management Permissions
    public const string UsersRead = "users:read";
    public const string UsersCreate = "users:create";
    public const string UsersUpdate = "users:update";
    public const string UsersDelete = "users:delete";
    public const string UsersAssignRoles = "users:assign_roles";
    public const string UsersManagePermissions = "users:manage_permissions";
    
    // System Administration
    public const string SystemAdmin = "system:admin";
    public const string SystemAuditLogs = "system:audit_logs";
    public const string SystemBackup = "system:backup";
    public const string SystemRestore = "system:restore";
}
