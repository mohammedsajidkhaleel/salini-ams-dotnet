using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using salini.api.Application.Services;
using salini.api.Domain.Entities;

namespace salini.api.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UserPermissionsController : ControllerBase
{
    private readonly IUserPermissionService _userPermissionService;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ILogger<UserPermissionsController> _logger;

    public UserPermissionsController(
        IUserPermissionService userPermissionService,
        UserManager<ApplicationUser> userManager,
        ILogger<UserPermissionsController> logger)
    {
        _userPermissionService = userPermissionService;
        _userManager = userManager;
        _logger = logger;
    }

    /// <summary>
    /// Get permissions for a specific user
    /// </summary>
    [HttpGet("{userId}")]
    public async Task<ActionResult<List<string>>> GetUserPermissions(string userId)
    {
        try
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
            {
                return NotFound(new { message = "User not found" });
            }

            var permissions = await _userPermissionService.GetUserPermissionsAsync(userId);
            return Ok(permissions);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting permissions for user {UserId}", userId);
            return StatusCode(500, new { message = "An error occurred while getting user permissions" });
        }
    }

    /// <summary>
    /// Check if a user has a specific permission
    /// </summary>
    [HttpGet("{userId}/has-permission/{permission}")]
    public async Task<ActionResult<bool>> HasPermission(string userId, string permission)
    {
        try
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
            {
                return NotFound(new { message = "User not found" });
            }

            var hasPermission = await _userPermissionService.HasPermissionAsync(userId, permission);
            return Ok(hasPermission);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking permission {Permission} for user {UserId}", permission, userId);
            return StatusCode(500, new { message = "An error occurred while checking permission" });
        }
    }

    /// <summary>
    /// Grant a permission to a user
    /// </summary>
    [HttpPost("{userId}/grant/{permission}")]
    public async Task<ActionResult> GrantPermission(string userId, string permission)
    {
        try
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
            {
                return NotFound(new { message = "User not found" });
            }

            await _userPermissionService.GrantPermissionAsync(userId, permission);
            _logger.LogInformation("Permission {Permission} granted to user {UserId}", permission, userId);
            
            return Ok(new { message = "Permission granted successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error granting permission {Permission} to user {UserId}", permission, userId);
            return StatusCode(500, new { message = "An error occurred while granting permission" });
        }
    }

    /// <summary>
    /// Revoke a permission from a user
    /// </summary>
    [HttpPost("{userId}/revoke/{permission}")]
    public async Task<ActionResult> RevokePermission(string userId, string permission)
    {
        try
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
            {
                return NotFound(new { message = "User not found" });
            }

            await _userPermissionService.RevokePermissionAsync(userId, permission);
            _logger.LogInformation("Permission {Permission} revoked from user {UserId}", permission, userId);
            
            return Ok(new { message = "Permission revoked successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error revoking permission {Permission} from user {UserId}", permission, userId);
            return StatusCode(500, new { message = "An error occurred while revoking permission" });
        }
    }

    /// <summary>
    /// Set all permissions for a user (replaces existing permissions)
    /// </summary>
    [HttpPut("{userId}")]
    public async Task<ActionResult> SetUserPermissions(string userId, [FromBody] SetUserPermissionsRequest request)
    {
        try
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
            {
                return NotFound(new { message = "User not found" });
            }

            await _userPermissionService.SetUserPermissionsAsync(userId, request.Permissions);
            _logger.LogInformation("Permissions set for user {UserId}: {Permissions}", userId, string.Join(", ", request.Permissions));
            
            return Ok(new { message = "User permissions updated successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error setting permissions for user {UserId}", userId);
            return StatusCode(500, new { message = "An error occurred while setting user permissions" });
        }
    }

    /// <summary>
    /// Get default permissions for a role
    /// </summary>
    [HttpGet("default-permissions/{role}")]
    public async Task<ActionResult<List<string>>> GetDefaultPermissionsForRole(int role)
    {
        try
        {
            if (!Enum.IsDefined(typeof(Domain.Enums.UserRole), role))
            {
                return BadRequest(new { message = "Invalid role" });
            }

            var userRole = (Domain.Enums.UserRole)role;
            var permissions = await _userPermissionService.GetDefaultPermissionsForRoleAsync(userRole);
            return Ok(permissions);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting default permissions for role {Role}", role);
            return StatusCode(500, new { message = "An error occurred while getting default permissions" });
        }
    }
}

public class SetUserPermissionsRequest
{
    public List<string> Permissions { get; set; } = new();
}
