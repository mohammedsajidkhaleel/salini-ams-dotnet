using salini.api.Domain.Entities;
using salini.api.Domain.Enums;

namespace salini.api.Application.Common.Interfaces;

public interface ISimCardRepository : IRepository<SimCard>
{
    Task<SimCard?> GetBySimAccountNoAsync(string simAccountNo, CancellationToken cancellationToken = default);
    Task<SimCard?> GetBySimServiceNoAsync(string simServiceNo, CancellationToken cancellationToken = default);
    Task<SimCard?> GetBySimSerialNoAsync(string simSerialNo, CancellationToken cancellationToken = default);
    Task<IEnumerable<SimCard>> GetByProjectAsync(string projectId, CancellationToken cancellationToken = default);
    Task<IEnumerable<SimCard>> GetByStatusAsync(SimCardStatus status, CancellationToken cancellationToken = default);
    Task<IEnumerable<SimCard>> GetBySimProviderAsync(string simProviderId, CancellationToken cancellationToken = default);
    Task<IEnumerable<SimCard>> GetBySimTypeAsync(string simTypeId, CancellationToken cancellationToken = default);
    Task<IEnumerable<SimCard>> GetBySimCardPlanAsync(string simCardPlanId, CancellationToken cancellationToken = default);
    Task<IEnumerable<SimCard>> GetActiveSimCardsAsync(CancellationToken cancellationToken = default);
    Task<bool> SimAccountNoExistsAsync(string simAccountNo, CancellationToken cancellationToken = default);
    Task<bool> SimServiceNoExistsAsync(string simServiceNo, CancellationToken cancellationToken = default);
    Task<bool> SimSerialNoExistsAsync(string simSerialNo, CancellationToken cancellationToken = default);
    Task<IEnumerable<SimCard>> SearchSimCardsAsync(string searchTerm, CancellationToken cancellationToken = default);
}
