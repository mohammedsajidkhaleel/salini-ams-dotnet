using salini.api.Domain.Entities;
using salini.api.Domain.Enums;

namespace salini.api.Application.Common.Interfaces;

public interface ISoftwareLicenseRepository : IRepository<SoftwareLicense>
{
    Task<SoftwareLicense?> GetByLicenseKeyAsync(string licenseKey, CancellationToken cancellationToken = default);
    Task<IEnumerable<SoftwareLicense>> GetByProjectAsync(string projectId, CancellationToken cancellationToken = default);
    Task<IEnumerable<SoftwareLicense>> GetByStatusAsync(SoftwareLicenseStatus status, CancellationToken cancellationToken = default);
    Task<IEnumerable<SoftwareLicense>> GetBySoftwareNameAsync(string softwareName, CancellationToken cancellationToken = default);
    Task<IEnumerable<SoftwareLicense>> GetByVendorAsync(string vendor, CancellationToken cancellationToken = default);
    Task<IEnumerable<SoftwareLicense>> GetActiveLicensesAsync(CancellationToken cancellationToken = default);
    Task<IEnumerable<SoftwareLicense>> GetExpiringLicensesAsync(DateTime expiryDate, CancellationToken cancellationToken = default);
    Task<bool> LicenseKeyExistsAsync(string licenseKey, CancellationToken cancellationToken = default);
    Task<IEnumerable<SoftwareLicense>> SearchSoftwareLicensesAsync(string searchTerm, CancellationToken cancellationToken = default);
}
