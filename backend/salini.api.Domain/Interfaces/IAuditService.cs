using salini.api.Domain.Entities;

namespace salini.api.Domain.Interfaces;

public interface IAuditService
{
    Task LogCreateAsync<T>(T entity, string userId) where T : class;
    Task LogUpdateAsync<T>(T originalEntity, T updatedEntity, string userId) where T : class;
    Task LogDeleteAsync<T>(T entity, string userId) where T : class;
    Task<IEnumerable<AuditLog>> GetAuditLogsAsync(string tableName, string recordId);
    Task<IEnumerable<AuditLog>> GetAuditLogsByUserAsync(string userId, int pageNumber = 1, int pageSize = 50);
}
