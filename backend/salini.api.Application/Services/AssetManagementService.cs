using salini.api.Application.Common.Interfaces;
using salini.api.Application.DTOs.Asset;
using salini.api.Application.DTOs.Employee;
using salini.api.Domain.Enums;
using salini.api.Domain.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace salini.api.Application.Services;

public class AssetManagementService : IAssetManagementService
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public AssetManagementService(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<bool> AssignAssetToEmployeeAsync(string assetId, string employeeId, string? notes = null)
    {
        // Verify asset exists and is available
        var asset = await _context.Assets
            .FirstOrDefaultAsync(a => a.Id == assetId);

        if (asset == null)
        {
            throw new NotFoundException($"Asset with ID '{assetId}' not found.");
        }

        if (asset.Status != AssetStatus.Available)
        {
            throw new ValidationException($"Asset '{asset.AssetTag}' is not available for assignment. Current status: {asset.Status}");
        }

        // Verify employee exists and is active
        var employee = await _context.Employees
            .FirstOrDefaultAsync(e => e.Id == employeeId);

        if (employee == null)
        {
            throw new NotFoundException($"Employee with ID '{employeeId}' not found.");
        }

        if (employee.Status != Status.Active)
        {
            throw new ValidationException($"Employee '{employee.EmployeeId}' is not active. Current status: {employee.Status}");
        }

        // Check if asset is already assigned
        var existingAssignment = await _context.EmployeeAssets
            .FirstOrDefaultAsync(ea => ea.AssetId == assetId && ea.Status == AssignmentStatus.Assigned);

        if (existingAssignment != null)
        {
            throw new ValidationException($"Asset '{asset.AssetTag}' is already assigned to another employee.");
        }

        // Create assignment
        var assignment = new salini.api.Domain.Entities.EmployeeAsset
        {
            Id = Guid.NewGuid().ToString(),
            EmployeeId = employeeId,
            AssetId = assetId,
            Status = AssignmentStatus.Assigned,
            AssignedDate = DateTime.UtcNow,
            Notes = notes,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = _currentUserService.UserId
        };

        // Update asset status
        asset.Status = AssetStatus.Assigned;
        asset.UpdatedAt = DateTime.UtcNow;
        asset.UpdatedBy = _currentUserService.UserId;

        _context.EmployeeAssets.Add(assignment);
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<bool> UnassignAssetFromEmployeeAsync(string assetId, string? notes = null)
    {
        // Find the current assignment
        var assignment = await _context.EmployeeAssets
            .Include(ea => ea.Asset)
            .FirstOrDefaultAsync(ea => ea.AssetId == assetId && ea.Status == AssignmentStatus.Assigned);

        if (assignment == null)
        {
            throw new NotFoundException($"No active assignment found for asset with ID '{assetId}'.");
        }

        // Update assignment status
        assignment.Status = AssignmentStatus.Returned;
        assignment.ReturnedDate = DateTime.UtcNow;
        assignment.Notes = notes;
        assignment.UpdatedAt = DateTime.UtcNow;
        assignment.UpdatedBy = _currentUserService.UserId;

        // Update asset status
        assignment.Asset.Status = AssetStatus.Available;
        assignment.Asset.UpdatedAt = DateTime.UtcNow;
        assignment.Asset.UpdatedBy = _currentUserService.UserId;

        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<bool> TransferAssetAsync(string assetId, string fromEmployeeId, string toEmployeeId, string? notes = null)
    {
        // First unassign from current employee
        await UnassignAssetFromEmployeeAsync(assetId, $"Transferred from employee {fromEmployeeId}");

        // Then assign to new employee
        await AssignAssetToEmployeeAsync(assetId, toEmployeeId, notes);

        return true;
    }

    public async Task<IEnumerable<AssetListDto>> GetAvailableAssetsAsync()
    {
        var assets = await _context.Assets
            .Include(a => a.Item)
            .Include(a => a.Project)
            .Where(a => a.Status == AssetStatus.Available)
            .Select(a => new AssetListDto
            {
                Id = a.Id,
                AssetTag = a.AssetTag,
                Name = a.Name,
                SerialNumber = a.SerialNumber,
                Status = a.Status,
                Condition = a.Condition,
                Location = a.Location,
                ItemName = a.Item != null ? a.Item.Name : null,
                ProjectName = a.Project != null ? a.Project.Name : null
            })
            .ToListAsync();

        return assets;
    }

    public async Task<IEnumerable<AssetListDto>> GetAssetsByEmployeeAsync(string employeeId)
    {
        var assets = await _context.EmployeeAssets
            .Include(ea => ea.Asset)
                .ThenInclude(a => a.Item)
            .Include(ea => ea.Asset)
                .ThenInclude(a => a.Project)
            .Where(ea => ea.EmployeeId == employeeId && ea.Status == AssignmentStatus.Assigned)
            .Select(ea => new AssetListDto
            {
                Id = ea.Asset.Id,
                AssetTag = ea.Asset.AssetTag,
                Name = ea.Asset.Name,
                SerialNumber = ea.Asset.SerialNumber,
                Status = ea.Asset.Status,
                Condition = ea.Asset.Condition,
                Location = ea.Asset.Location,
                ItemName = ea.Asset.Item != null ? ea.Asset.Item.Name : null,
                ProjectName = ea.Asset.Project != null ? ea.Asset.Project.Name : null,
                AssignmentDate = ea.AssignedDate
            })
            .ToListAsync();

        return assets;
    }

    public async Task<IEnumerable<EmployeeListDto>> GetEmployeesWithAssetsAsync()
    {
        var employees = await _context.Employees
            .Include(e => e.Department)
            .Include(e => e.Project)
            .Include(e => e.Company)
            .Include(e => e.EmployeeAssets.Where(ea => ea.Status == AssignmentStatus.Assigned))
            .Where(e => e.EmployeeAssets.Any(ea => ea.Status == AssignmentStatus.Assigned))
            .Select(e => new EmployeeListDto
            {
                Id = e.Id,
                EmployeeId = e.EmployeeId,
                FullName = $"{e.FirstName} {e.LastName}",
                Email = e.Email,
                Phone = e.Phone,
                DepartmentName = e.Department != null ? e.Department.Name : null,
                ProjectName = e.Project != null ? e.Project.Name : null,
                CompanyName = e.Company != null ? e.Company.Name : null,
                Status = e.Status,
                AssetCount = e.EmployeeAssets.Count(ea => ea.Status == AssignmentStatus.Assigned)
            })
            .ToListAsync();

        return employees;
    }

    public async Task<AssetAssignmentHistoryDto> GetAssetAssignmentHistoryAsync(string assetId)
    {
        var asset = await _context.Assets
            .FirstOrDefaultAsync(a => a.Id == assetId);

        if (asset == null)
        {
            throw new NotFoundException($"Asset with ID '{assetId}' not found.");
        }

        var assignments = await _context.EmployeeAssets
            .Include(ea => ea.Employee)
            .Where(ea => ea.AssetId == assetId)
            .OrderBy(ea => ea.AssignedDate)
            .Select(ea => new AssetAssignmentRecordDto
            {
                EmployeeId = ea.EmployeeId,
                EmployeeName = ea.Employee != null ? $"{ea.Employee.FirstName} {ea.Employee.LastName}" : string.Empty,
                EmployeeCode = ea.Employee != null ? ea.Employee.EmployeeId : string.Empty,
                AssignedDate = ea.AssignedDate,
                ReturnedDate = ea.ReturnedDate,
                Notes = ea.Notes,
                IsCurrent = ea.Status == AssignmentStatus.Assigned
            })
            .ToListAsync();

        return new AssetAssignmentHistoryDto
        {
            AssetId = asset.Id,
            AssetTag = asset.AssetTag,
            AssetName = asset.Name,
            Assignments = assignments
        };
    }
}
