namespace salini.api.Domain.Constants;

public static class SystemConstants
{
    public const string DefaultPassword = "TempPassword123!";
    public const int DefaultPageSize = 50;
    public const int MaxPageSize = 100;
    public const int MinPasswordLength = 6;
    public const int MaxPasswordLength = 100;
    
    // File upload constants
    public const int MaxFileSize = 10 * 1024 * 1024; // 10MB
    public const string AllowedImageExtensions = ".jpg,.jpeg,.png,.gif,.bmp";
    public const string AllowedDocumentExtensions = ".pdf,.doc,.docx,.xls,.xlsx,.csv";
    
    // Audit constants
    public const string AuditActionCreate = "INSERT";
    public const string AuditActionUpdate = "UPDATE";
    public const string AuditActionDelete = "DELETE";
    
    // ID generation prefixes
    public const string CompanyIdPrefix = "COMP";
    public const string ProjectIdPrefix = "PROJ";
    public const string EmployeeIdPrefix = "EMP";
    public const string AssetIdPrefix = "AST";
    public const string SimCardIdPrefix = "SIM";
    public const string LicenseIdPrefix = "LIC";
    public const string PurchaseOrderIdPrefix = "PO";
}
