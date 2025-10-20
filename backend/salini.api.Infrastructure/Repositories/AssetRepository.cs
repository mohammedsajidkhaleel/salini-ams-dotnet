using Microsoft.EntityFrameworkCore;
using salini.api.Application.Common.Interfaces;
using salini.api.Domain.Entities;
using salini.api.Domain.Enums;
using salini.api.Infrastructure.Data;

namespace salini.api.Infrastructure.Repositories;

public class AssetRepository : BaseRepository<Asset>, IAssetRepository
{
    public AssetRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<Asset?> GetByAssetTagAsync(string assetTag, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(a => a.Item)
            .Include(a => a.Project)
            .Include(a => a.EmployeeAssets.Where(ea => ea.Status == Domain.Enums.AssignmentStatus.Assigned))
                .ThenInclude(ea => ea.Employee)
            .FirstOrDefaultAsync(a => a.AssetTag == assetTag, cancellationToken);
    }

    public async Task<Asset?> GetBySerialNumberAsync(string serialNumber, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(a => a.Item)
            .Include(a => a.Project)
            .Include(a => a.EmployeeAssets.Where(ea => ea.Status == Domain.Enums.AssignmentStatus.Assigned))
                .ThenInclude(ea => ea.Employee)
            .FirstOrDefaultAsync(a => a.SerialNumber == serialNumber, cancellationToken);
    }

    public async Task<IEnumerable<Asset>> GetByProjectAsync(string projectId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(a => a.Item)
            .Include(a => a.Project)
            .Include(a => a.EmployeeAssets.Where(ea => ea.Status == Domain.Enums.AssignmentStatus.Assigned))
                .ThenInclude(ea => ea.Employee)
            .Where(a => a.ProjectId == projectId)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<Asset>> GetByStatusAsync(AssetStatus status, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(a => a.Item)
            .Include(a => a.Project)
            .Include(a => a.EmployeeAssets.Where(ea => ea.Status == Domain.Enums.AssignmentStatus.Assigned))
                .ThenInclude(ea => ea.Employee)
            .Where(a => a.Status == status)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<Asset>> GetAvailableAssetsAsync(CancellationToken cancellationToken = default)
    {
        return await GetByStatusAsync(AssetStatus.Available, cancellationToken);
    }

    public async Task<IEnumerable<Asset>> GetAssignedAssetsAsync(CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(a => a.Item)
            .Include(a => a.Project)
            .Include(a => a.EmployeeAssets.Where(ea => ea.Status == Domain.Enums.AssignmentStatus.Assigned))
                .ThenInclude(ea => ea.Employee)
            .Where(a => a.EmployeeAssets.Any(ea => ea.Status == Domain.Enums.AssignmentStatus.Assigned))
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<Asset>> GetByItemAsync(string itemId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(a => a.Item)
            .Include(a => a.Project)
            .Include(a => a.EmployeeAssets.Where(ea => ea.Status == Domain.Enums.AssignmentStatus.Assigned))
                .ThenInclude(ea => ea.Employee)
            .Where(a => a.ItemId == itemId)
            .ToListAsync(cancellationToken);
    }

    public async Task<bool> AssetTagExistsAsync(string assetTag, CancellationToken cancellationToken = default)
    {
        return await _dbSet.AnyAsync(a => a.AssetTag == assetTag, cancellationToken);
    }

    public async Task<bool> SerialNumberExistsAsync(string serialNumber, CancellationToken cancellationToken = default)
    {
        return await _dbSet.AnyAsync(a => a.SerialNumber == serialNumber, cancellationToken);
    }

    public async Task<IEnumerable<Asset>> SearchAssetsAsync(string searchTerm, CancellationToken cancellationToken = default)
    {
        var term = searchTerm.ToLower();
        return await _dbSet
            .Include(a => a.Item)
            .Include(a => a.Project)
            .Include(a => a.EmployeeAssets.Where(ea => ea.Status == Domain.Enums.AssignmentStatus.Assigned))
                .ThenInclude(ea => ea.Employee)
            .Where(a => 
                a.AssetTag.ToLower().Contains(term) ||
                a.Name.ToLower().Contains(term) ||
                (a.SerialNumber != null && a.SerialNumber.ToLower().Contains(term)) ||
                (a.Description != null && a.Description.ToLower().Contains(term)))
            .ToListAsync(cancellationToken);
    }
}
