using salini.api.Application.Common.Interfaces;
using salini.api.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace salini.api.Application.Services;

public class ReportingService : IReportingService
{
    private readonly IApplicationDbContext _context;

    public ReportingService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<AssetSummaryReportDto> GetAssetSummaryReportAsync()
    {
        var assets = await _context.Assets
            .Include(a => a.Project)
            .Include(a => a.Item)
            .ToListAsync();

        var report = new AssetSummaryReportDto
        {
            TotalAssets = assets.Count,
            AvailableAssets = assets.Count(a => a.Status == AssetStatus.Available),
            AssignedAssets = assets.Count(a => a.Status == AssetStatus.Assigned),
            MaintenanceAssets = assets.Count(a => a.Status == AssetStatus.Maintenance),
            RetiredAssets = assets.Count(a => a.Status == AssetStatus.Retired)
        };

        // Group by status
        report.AssetsByStatus = assets
            .GroupBy(a => a.Status.ToString())
            .ToDictionary(g => g.Key, g => g.Count());

        // Group by project
        report.AssetsByProject = assets
            .Where(a => a.Project != null)
            .GroupBy(a => a.Project!.Name)
            .ToDictionary(g => g.Key, g => g.Count());

        // Group by item
        report.AssetsByItem = assets
            .Where(a => a.Item != null)
            .GroupBy(a => a.Item!.Name)
            .ToDictionary(g => g.Key, g => g.Count());

        return report;
    }

    public async Task<EmployeeAssetReportDto> GetEmployeeAssetReportAsync(string? departmentId = null, string? projectId = null)
    {
        var query = _context.Employees
            .Include(e => e.Department)
            .Include(e => e.Project)
            .Include(e => e.EmployeeAssets.Where(ea => ea.Status == AssignmentStatus.Assigned))
            .Include(e => e.EmployeeSimCards.Where(esc => esc.Status == AssignmentStatus.Assigned))
            .Include(e => e.EmployeeSoftwareLicenses.Where(esl => esl.Status == AssignmentStatus.Assigned))
            .AsQueryable();

        if (!string.IsNullOrEmpty(departmentId))
        {
            query = query.Where(e => e.DepartmentId == departmentId);
        }

        if (!string.IsNullOrEmpty(projectId))
        {
            query = query.Where(e => e.ProjectId == projectId);
        }

        var employees = await query.ToListAsync();

        var report = new EmployeeAssetReportDto
        {
            TotalEmployees = employees.Count,
            EmployeesWithAssets = employees.Count(e => e.EmployeeAssets.Any(ea => ea.Status == AssignmentStatus.Assigned)),
            EmployeesWithoutAssets = employees.Count(e => !e.EmployeeAssets.Any(ea => ea.Status == AssignmentStatus.Assigned))
        };

        report.AverageAssetsPerEmployee = report.EmployeesWithAssets > 0 
            ? (decimal)employees.Sum(e => e.EmployeeAssets.Count(ea => ea.Status == AssignmentStatus.Assigned)) / report.EmployeesWithAssets 
            : 0;

        report.EmployeeSummaries = employees
            .Select(e => new EmployeeAssetSummaryDto
            {
                EmployeeId = e.Id,
                EmployeeCode = e.EmployeeId,
                EmployeeName = $"{e.FirstName} {e.LastName}",
                DepartmentName = e.Department?.Name ?? string.Empty,
                ProjectName = e.Project?.Name ?? string.Empty,
                AssetCount = e.EmployeeAssets.Count(ea => ea.Status == AssignmentStatus.Assigned),
                SimCardCount = e.EmployeeSimCards.Count(esc => esc.Status == AssignmentStatus.Assigned),
                SoftwareLicenseCount = e.EmployeeSoftwareLicenses.Count(esl => esl.Status == AssignmentStatus.Assigned)
            })
            .ToList();

        return report;
    }

    public async Task<AssetUtilizationReportDto> GetAssetUtilizationReportAsync()
    {
        var assets = await _context.Assets
            .Include(a => a.Project)
            .Include(a => a.EmployeeAssets)
            .ToListAsync();

        var report = new AssetUtilizationReportDto
        {
            TotalAssets = assets.Count,
            AssignedAssets = assets.Count(a => a.Status == AssetStatus.Assigned),
            AvailableAssets = assets.Count(a => a.Status == AssetStatus.Available)
        };

        report.UtilizationRate = report.TotalAssets > 0 
            ? (decimal)report.AssignedAssets / report.TotalAssets * 100 
            : 0;

        // Utilization by project
        var projectGroups = assets
            .Where(a => a.Project != null)
            .GroupBy(a => a.Project!.Name)
            .ToList();

        foreach (var group in projectGroups)
        {
            var totalInProject = group.Count();
            var assignedInProject = group.Count(a => a.Status == AssetStatus.Assigned);
            report.UtilizationByProject[group.Key] = totalInProject > 0 
                ? (decimal)assignedInProject / totalInProject * 100 
                : 0;
        }

        return report;
    }

    public async Task<AssetMaintenanceReportDto> GetAssetMaintenanceReportAsync()
    {
        var assets = await _context.Assets
            .Include(a => a.EmployeeAssets.Where(ea => ea.Status == AssignmentStatus.Assigned))
                .ThenInclude(ea => ea.Employee)
            .Include(a => a.Project)
            .Where(a => a.Status == AssetStatus.Maintenance || 
                       a.Condition == "Poor" || 
                       a.Condition == "Fair")
            .ToListAsync();

        var report = new AssetMaintenanceReportDto
        {
            AssetsNeedingMaintenance = assets.Count(a => a.Condition == "Poor" || a.Condition == "Fair"),
            AssetsInMaintenance = assets.Count(a => a.Status == AssetStatus.Maintenance)
        };

        report.MaintenanceItems = assets
            .Select(a => new AssetMaintenanceItemDto
            {
                AssetId = a.Id,
                AssetTag = a.AssetTag,
                AssetName = a.Name,
                Condition = a.Condition ?? "Unknown",
                AssignedEmployeeName = a.EmployeeAssets
                    .FirstOrDefault(ea => ea.Status == AssignmentStatus.Assigned)?.Employee != null
                    ? $"{a.EmployeeAssets.First(ea => ea.Status == AssignmentStatus.Assigned).Employee!.FirstName} {a.EmployeeAssets.First(ea => ea.Status == AssignmentStatus.Assigned).Employee!.LastName}"
                    : null,
                MaintenanceStatus = a.Status == AssetStatus.Maintenance ? "In Maintenance" : "Needs Maintenance"
            })
            .ToList();

        return report;
    }

    public async Task<IEnumerable<AssetExpiringWarrantyDto>> GetAssetsExpiringWarrantyAsync(int daysAhead = 30)
    {
        // TODO: Implement when Asset entity has WarrantyExpiry property
        return new List<AssetExpiringWarrantyDto>();
    }
}
