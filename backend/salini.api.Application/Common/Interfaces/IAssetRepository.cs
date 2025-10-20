using salini.api.Domain.Entities;
using salini.api.Domain.Enums;

namespace salini.api.Application.Common.Interfaces;

public interface IAssetRepository : IRepository<Asset>
{
    Task<Asset?> GetByAssetTagAsync(string assetTag, CancellationToken cancellationToken = default);
    Task<Asset?> GetBySerialNumberAsync(string serialNumber, CancellationToken cancellationToken = default);
    Task<IEnumerable<Asset>> GetByProjectAsync(string projectId, CancellationToken cancellationToken = default);
    Task<IEnumerable<Asset>> GetByStatusAsync(AssetStatus status, CancellationToken cancellationToken = default);
    Task<IEnumerable<Asset>> GetAvailableAssetsAsync(CancellationToken cancellationToken = default);
    Task<IEnumerable<Asset>> GetAssignedAssetsAsync(CancellationToken cancellationToken = default);
    Task<IEnumerable<Asset>> GetByItemAsync(string itemId, CancellationToken cancellationToken = default);
    Task<bool> AssetTagExistsAsync(string assetTag, CancellationToken cancellationToken = default);
    Task<bool> SerialNumberExistsAsync(string serialNumber, CancellationToken cancellationToken = default);
    Task<IEnumerable<Asset>> SearchAssetsAsync(string searchTerm, CancellationToken cancellationToken = default);
}
