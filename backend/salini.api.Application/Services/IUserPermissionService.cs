using salini.api.Domain.Entities;

namespace salini.api.Application.Services;

public interface IUserPermissionService
{
    Task<List<string>> GetUserPermissionsAsync(string userId);
    Task<bool> HasPermissionAsync(string userId, string permission);
    Task GrantPermissionAsync(string userId, string permission);
    Task RevokePermissionAsync(string userId, string permission);
    Task SetUserPermissionsAsync(string userId, List<string> permissions);
    Task<List<string>> GetDefaultPermissionsForRoleAsync(Domain.Enums.UserRole role);
}
