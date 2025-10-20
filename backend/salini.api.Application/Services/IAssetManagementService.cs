using salini.api.Application.DTOs.Asset;
using salini.api.Application.DTOs.Employee;

namespace salini.api.Application.Services;

public interface IAssetManagementService
{
    Task<bool> AssignAssetToEmployeeAsync(string assetId, string employeeId, string? notes = null);
    Task<bool> UnassignAssetFromEmployeeAsync(string assetId, string? notes = null);
    Task<bool> TransferAssetAsync(string assetId, string fromEmployeeId, string toEmployeeId, string? notes = null);
    Task<IEnumerable<AssetListDto>> GetAvailableAssetsAsync();
    Task<IEnumerable<AssetListDto>> GetAssetsByEmployeeAsync(string employeeId);
    Task<IEnumerable<EmployeeListDto>> GetEmployeesWithAssetsAsync();
    Task<AssetAssignmentHistoryDto> GetAssetAssignmentHistoryAsync(string assetId);
}

public class AssetAssignmentHistoryDto
{
    public string AssetId { get; set; } = string.Empty;
    public string AssetTag { get; set; } = string.Empty;
    public string AssetName { get; set; } = string.Empty;
    public List<AssetAssignmentRecordDto> Assignments { get; set; } = new();
}

public class AssetAssignmentRecordDto
{
    public string EmployeeId { get; set; } = string.Empty;
    public string EmployeeName { get; set; } = string.Empty;
    public string EmployeeCode { get; set; } = string.Empty;
    public DateTime AssignedDate { get; set; }
    public DateTime? ReturnedDate { get; set; }
    public string? Notes { get; set; }
    public bool IsCurrent { get; set; }
}
