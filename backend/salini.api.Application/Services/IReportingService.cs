using salini.api.Application.DTOs.Asset;
using salini.api.Application.DTOs.Employee;

namespace salini.api.Application.Services;

public interface IReportingService
{
    Task<AssetSummaryReportDto> GetAssetSummaryReportAsync();
    Task<EmployeeAssetReportDto> GetEmployeeAssetReportAsync(string? departmentId = null, string? projectId = null);
    Task<AssetUtilizationReportDto> GetAssetUtilizationReportAsync();
    Task<AssetMaintenanceReportDto> GetAssetMaintenanceReportAsync();
    Task<IEnumerable<AssetExpiringWarrantyDto>> GetAssetsExpiringWarrantyAsync(int daysAhead = 30);
}

public class AssetSummaryReportDto
{
    public int TotalAssets { get; set; }
    public int AvailableAssets { get; set; }
    public int AssignedAssets { get; set; }
    public int MaintenanceAssets { get; set; }
    public int RetiredAssets { get; set; }
    public decimal TotalAssetValue { get; set; }
    public decimal AssignedAssetValue { get; set; }
    public Dictionary<string, int> AssetsByStatus { get; set; } = new();
    public Dictionary<string, int> AssetsByProject { get; set; } = new();
    public Dictionary<string, int> AssetsByItem { get; set; } = new();
}

public class EmployeeAssetReportDto
{
    public int TotalEmployees { get; set; }
    public int EmployeesWithAssets { get; set; }
    public int EmployeesWithoutAssets { get; set; }
    public decimal AverageAssetsPerEmployee { get; set; }
    public List<EmployeeAssetSummaryDto> EmployeeSummaries { get; set; } = new();
}

public class EmployeeAssetSummaryDto
{
    public string EmployeeId { get; set; } = string.Empty;
    public string EmployeeCode { get; set; } = string.Empty;
    public string EmployeeName { get; set; } = string.Empty;
    public string DepartmentName { get; set; } = string.Empty;
    public string ProjectName { get; set; } = string.Empty;
    public int AssetCount { get; set; }
    public int SimCardCount { get; set; }
    public int SoftwareLicenseCount { get; set; }
    public decimal TotalAssetValue { get; set; }
}

public class AssetUtilizationReportDto
{
    public decimal UtilizationRate { get; set; }
    public int TotalAssets { get; set; }
    public int AssignedAssets { get; set; }
    public int AvailableAssets { get; set; }
    public Dictionary<string, decimal> UtilizationByProject { get; set; } = new();
    public Dictionary<string, decimal> UtilizationByDepartment { get; set; } = new();
}

public class AssetMaintenanceReportDto
{
    public int AssetsNeedingMaintenance { get; set; }
    public int AssetsInMaintenance { get; set; }
    public List<AssetMaintenanceItemDto> MaintenanceItems { get; set; } = new();
}

public class AssetMaintenanceItemDto
{
    public string AssetId { get; set; } = string.Empty;
    public string AssetTag { get; set; } = string.Empty;
    public string AssetName { get; set; } = string.Empty;
    public string Condition { get; set; } = string.Empty;
    public string? AssignedEmployeeName { get; set; }
    public DateTime? LastMaintenanceDate { get; set; }
    public string MaintenanceStatus { get; set; } = string.Empty;
}

public class AssetExpiringWarrantyDto
{
    public string AssetId { get; set; } = string.Empty;
    public string AssetTag { get; set; } = string.Empty;
    public string AssetName { get; set; } = string.Empty;
    public string? WarrantyExpiry { get; set; }
    public int DaysUntilExpiry { get; set; }
    public string? AssignedEmployeeName { get; set; }
    public string ProjectName { get; set; } = string.Empty;
}
