using Microsoft.EntityFrameworkCore;
using salini.api.Application.Common.Interfaces;
using salini.api.Domain.Entities;

namespace salini.api.Application.Services;

public class UserPermissionService : IUserPermissionService
{
    private readonly IApplicationDbContext _context;

    public UserPermissionService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<string>> GetUserPermissionsAsync(string userId)
    {
        // Get user role for default permissions
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null)
            return new List<string>();

        // Get default permissions for the role
        var defaultPermissions = GetDefaultPermissionsForRole(user.Role);

        // Combine user-specific permissions with role-based permissions
        // User-specific permissions override role-based ones
        var allPermissions = new HashSet<string>(defaultPermissions);
        
        // Get user-specific permissions (both granted and denied) - single query
        var userSpecificPermissions = await _context.UserPermissions
            .Where(up => up.UserId == userId)
            .ToListAsync();

        foreach (var permission in userSpecificPermissions)
        {
            if (permission.IsGranted)
            {
                allPermissions.Add(permission.Permission);
            }
            else
            {
                // Explicitly denied permission
                allPermissions.Remove(permission.Permission);
            }
        }

        return allPermissions.ToList();
    }

    public async Task<bool> HasPermissionAsync(string userId, string permission)
    {
        var userPermissions = await GetUserPermissionsAsync(userId);
        return userPermissions.Contains(permission);
    }

    public async Task GrantPermissionAsync(string userId, string permission)
    {
        var existingPermission = await _context.UserPermissions
            .FirstOrDefaultAsync(up => up.UserId == userId && up.Permission == permission);

        if (existingPermission != null)
        {
            existingPermission.IsGranted = true;
            existingPermission.UpdatedAt = DateTime.UtcNow;
        }
        else
        {
            var userPermission = new UserPermission
            {
                Id = Guid.NewGuid().ToString(),
                UserId = userId,
                Permission = permission,
                IsGranted = true,
                CreatedAt = DateTime.UtcNow
            };
            _context.UserPermissions.Add(userPermission);
        }

        await _context.SaveChangesAsync();
    }

    public async Task RevokePermissionAsync(string userId, string permission)
    {
        var existingPermission = await _context.UserPermissions
            .FirstOrDefaultAsync(up => up.UserId == userId && up.Permission == permission);

        if (existingPermission != null)
        {
            existingPermission.IsGranted = false;
            existingPermission.UpdatedAt = DateTime.UtcNow;
        }
        else
        {
            var userPermission = new UserPermission
            {
                Id = Guid.NewGuid().ToString(),
                UserId = userId,
                Permission = permission,
                IsGranted = false,
                CreatedAt = DateTime.UtcNow
            };
            _context.UserPermissions.Add(userPermission);
        }

        await _context.SaveChangesAsync();
    }

    public async Task SetUserPermissionsAsync(string userId, List<string> permissions)
    {
        // Remove all existing user-specific permissions
        var existingPermissions = await _context.UserPermissions
            .Where(up => up.UserId == userId)
            .ToListAsync();

        _context.UserPermissions.RemoveRange(existingPermissions);

        // Add new permissions
        foreach (var permission in permissions)
        {
            var userPermission = new UserPermission
            {
                Id = Guid.NewGuid().ToString(),
                UserId = userId,
                Permission = permission,
                IsGranted = true,
                CreatedAt = DateTime.UtcNow
            };
            _context.UserPermissions.Add(userPermission);
        }

        await _context.SaveChangesAsync();
    }

    public Task<List<string>> GetDefaultPermissionsForRoleAsync(Domain.Enums.UserRole role)
    {
        return Task.FromResult(GetDefaultPermissionsForRole(role));
    }

    private List<string> GetDefaultPermissionsForRole(Domain.Enums.UserRole role)
    {
        return role switch
        {
            Domain.Enums.UserRole.SuperAdmin => new List<string>
            {
                // All permissions
                "master_data:read", "master_data:create", "master_data:update", "master_data:delete",
                "employees:read", "employees:create", "employees:update", "employees:delete", "employees:import", "employees:export",
                "assets:read", "assets:create", "assets:update", "assets:delete", "assets:assign", "assets:unassign",
                "accessories:read", "accessories:create", "accessories:update", "accessories:delete", "accessories:assign", "accessories:unassign",
                "sim_cards:read", "sim_cards:create", "sim_cards:update", "sim_cards:delete", "sim_cards:assign", "sim_cards:unassign",
                "software_licenses:read", "software_licenses:create", "software_licenses:update", "software_licenses:delete", "software_licenses:assign", "software_licenses:unassign",
                "purchase_orders:read", "purchase_orders:create", "purchase_orders:update", "purchase_orders:delete", "purchase_orders:approve",
                "reports:read", "reports:generate", "reports:export",
                "users:read", "users:create", "users:update", "users:delete", "users:assign_roles", "users:manage_permissions",
                "system:admin", "system:audit_logs", "system:backup", "system:restore"
            },
            Domain.Enums.UserRole.Admin => new List<string>
            {
                // Most permissions except system admin
                "master_data:read", "master_data:create", "master_data:update", "master_data:delete",
                "employees:read", "employees:create", "employees:update", "employees:delete", "employees:import", "employees:export",
                "assets:read", "assets:create", "assets:update", "assets:delete", "assets:assign", "assets:unassign",
                "accessories:read", "accessories:create", "accessories:update", "accessories:delete", "accessories:assign", "accessories:unassign",
                "sim_cards:read", "sim_cards:create", "sim_cards:update", "sim_cards:delete", "sim_cards:assign", "sim_cards:unassign",
                "software_licenses:read", "software_licenses:create", "software_licenses:update", "software_licenses:delete", "software_licenses:assign", "software_licenses:unassign",
                "purchase_orders:read", "purchase_orders:create", "purchase_orders:update", "purchase_orders:delete", "purchase_orders:approve",
                "reports:read", "reports:generate", "reports:export",
                "users:read", "users:create", "users:update", "users:delete"
            },
            Domain.Enums.UserRole.Manager => new List<string>
            {
                // Read and limited write permissions
                "master_data:read",
                "employees:read", "employees:create", "employees:update",
                "assets:read", "assets:assign", "assets:unassign",
                "accessories:read", "accessories:assign", "accessories:unassign",
                "sim_cards:read", "sim_cards:assign", "sim_cards:unassign",
                "software_licenses:read", "software_licenses:assign", "software_licenses:unassign",
                "purchase_orders:read", "purchase_orders:create", "purchase_orders:update",
                "reports:read", "reports:generate", "reports:export"
            },
            Domain.Enums.UserRole.User => new List<string>
            {
                // Read-only permissions
                "employees:read",
                "assets:read",
                "accessories:read",
                "sim_cards:read",
                "software_licenses:read",
                "purchase_orders:read",
                "reports:read"
            },
            _ => new List<string>() // No permissions for unknown roles
        };
    }
}
