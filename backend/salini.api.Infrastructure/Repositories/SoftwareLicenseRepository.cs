using Microsoft.EntityFrameworkCore;
using salini.api.Application.Common.Interfaces;
using salini.api.Domain.Entities;
using salini.api.Domain.Enums;
using salini.api.Infrastructure.Data;

namespace salini.api.Infrastructure.Repositories;

public class SoftwareLicenseRepository : BaseRepository<SoftwareLicense>, ISoftwareLicenseRepository
{
    public SoftwareLicenseRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<SoftwareLicense?> GetByLicenseKeyAsync(string licenseKey, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(sl => sl.Project)
            .Include(sl => sl.EmployeeSoftwareLicenses.Where(esl => esl.Status == Domain.Enums.AssignmentStatus.Assigned))
                .ThenInclude(esl => esl.Employee)
            .FirstOrDefaultAsync(sl => sl.LicenseKey == licenseKey, cancellationToken);
    }

    public async Task<IEnumerable<SoftwareLicense>> GetByProjectAsync(string projectId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(sl => sl.Project)
            .Include(sl => sl.EmployeeSoftwareLicenses.Where(esl => esl.Status == Domain.Enums.AssignmentStatus.Assigned))
                .ThenInclude(esl => esl.Employee)
            .Where(sl => sl.ProjectId == projectId)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<SoftwareLicense>> GetByStatusAsync(SoftwareLicenseStatus status, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(sl => sl.Project)
            .Include(sl => sl.EmployeeSoftwareLicenses.Where(esl => esl.Status == Domain.Enums.AssignmentStatus.Assigned))
                .ThenInclude(esl => esl.Employee)
            .Where(sl => sl.Status == status)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<SoftwareLicense>> GetBySoftwareNameAsync(string softwareName, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(sl => sl.Project)
            .Include(sl => sl.EmployeeSoftwareLicenses.Where(esl => esl.Status == Domain.Enums.AssignmentStatus.Assigned))
                .ThenInclude(esl => esl.Employee)
            .Where(sl => sl.SoftwareName.ToLower().Contains(softwareName.ToLower()))
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<SoftwareLicense>> GetByVendorAsync(string vendor, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(sl => sl.Project)
            .Include(sl => sl.EmployeeSoftwareLicenses.Where(esl => esl.Status == Domain.Enums.AssignmentStatus.Assigned))
                .ThenInclude(esl => esl.Employee)
            .Where(sl => sl.Vendor != null && sl.Vendor.ToLower().Contains(vendor.ToLower()))
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<SoftwareLicense>> GetActiveLicensesAsync(CancellationToken cancellationToken = default)
    {
        return await GetByStatusAsync(SoftwareLicenseStatus.Active, cancellationToken);
    }

    public async Task<IEnumerable<SoftwareLicense>> GetExpiringLicensesAsync(DateTime expiryDate, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(sl => sl.Project)
            .Include(sl => sl.EmployeeSoftwareLicenses.Where(esl => esl.Status == Domain.Enums.AssignmentStatus.Assigned))
                .ThenInclude(esl => esl.Employee)
            .Where(sl => sl.ExpiryDate != null && sl.ExpiryDate <= expiryDate)
            .ToListAsync(cancellationToken);
    }

    public async Task<bool> LicenseKeyExistsAsync(string licenseKey, CancellationToken cancellationToken = default)
    {
        return await _dbSet.AnyAsync(sl => sl.LicenseKey == licenseKey, cancellationToken);
    }

    public async Task<IEnumerable<SoftwareLicense>> SearchSoftwareLicensesAsync(string searchTerm, CancellationToken cancellationToken = default)
    {
        var term = searchTerm.ToLower();
        return await _dbSet
            .Include(sl => sl.Project)
            .Include(sl => sl.EmployeeSoftwareLicenses.Where(esl => esl.Status == Domain.Enums.AssignmentStatus.Assigned))
                .ThenInclude(esl => esl.Employee)
            .Where(sl => 
                sl.SoftwareName.ToLower().Contains(term) ||
                (sl.LicenseKey != null && sl.LicenseKey.ToLower().Contains(term)) ||
                (sl.Vendor != null && sl.Vendor.ToLower().Contains(term)) ||
                (sl.Notes != null && sl.Notes.ToLower().Contains(term)))
            .ToListAsync(cancellationToken);
    }
}
