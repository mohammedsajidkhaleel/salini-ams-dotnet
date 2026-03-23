using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using salini.api.Application.Common.Interfaces;
using salini.api.Application.DTOs.User;
using salini.api.Application.DTOs.UserManagement;
using salini.api.Application.Services;
using salini.api.Domain.Entities;
using salini.api.Domain.Enums;

namespace salini.api.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UserManagementController : ControllerBase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IUserPermissionService _userPermissionService;

    public UserManagementController(
        IUnitOfWork unitOfWork, 
        UserManager<ApplicationUser> userManager,
        IUserPermissionService userPermissionService)
    {
        _unitOfWork = unitOfWork;
        _userManager = userManager;
        _userPermissionService = userPermissionService;
    }

    /// <summary>
    /// Get all users
    /// </summary>
    [HttpGet]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<ActionResult<IEnumerable<UserDto>>> GetUsers()
    {
        var users = await _unitOfWork.Users.GetAllAsync();
        var userDtos = users.Select(u => new UserDto
        {
            Id = u.Id,
            UserName = u.UserName,
            Email = u.Email,
            FirstName = u.FirstName,
            LastName = u.LastName,
            Department = u.Department,
            Role = u.Role.ToString(),
            IsActive = u.IsActive,
            LastLoginAt = u.LastLogin
        });

        return Ok(userDtos);
    }

    /// <summary>
    /// Get user by ID
    /// </summary>
    [HttpGet("{id}")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<ActionResult<UserDto>> GetUser(string id)
    {
        var user = await _unitOfWork.Users.GetByIdAsync(id);
        if (user == null)
            return NotFound();

        var userDto = new UserDto
        {
            Id = user.Id,
            UserName = user.UserName,
            Email = user.Email,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Department = user.Department,
            Role = user.Role.ToString(),
            IsActive = user.IsActive,
            LastLoginAt = user.LastLogin
        };

        return Ok(userDto);
    }

    /// <summary>
    /// Create a new user
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<ActionResult<UserDto>> CreateUser([FromBody] UserCreateDto createDto)
    {
        if (!Enum.TryParse<UserRole>(createDto.Role, true, out var role))
        {
            return BadRequest("Invalid role specified");
        }

        var user = new ApplicationUser
        {
            UserName = createDto.UserName,
            Email = createDto.Email,
            FirstName = createDto.FirstName,
            LastName = createDto.LastName,
            Department = createDto.Department,
            Role = role,
            IsActive = createDto.IsActive,
            EmailConfirmed = true
        };

        var result = await _userManager.CreateAsync(user, createDto.Password);
        if (!result.Succeeded)
        {
            return BadRequest(result.Errors);
        }

        var userDto = new UserDto
        {
            Id = user.Id,
            UserName = user.UserName,
            Email = user.Email,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Department = user.Department,
            Role = user.Role.ToString(),
            IsActive = user.IsActive,
            LastLoginAt = user.LastLogin
        };

        return CreatedAtAction(nameof(GetUser), new { id = user.Id }, userDto);
    }

    /// <summary>
    /// Update an existing user
    /// </summary>
    [HttpPut("{id}")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<ActionResult<UserDto>> UpdateUser(string id, [FromBody] UserUpdateDto updateDto)
    {
        if (id != updateDto.Id)
            return BadRequest("ID mismatch");

        var user = await _userManager.FindByIdAsync(id);
        if (user == null)
            return NotFound();

        if (!Enum.TryParse<UserRole>(updateDto.Role, true, out var role))
        {
            return BadRequest("Invalid role specified");
        }

        user.FirstName = updateDto.FirstName;
        user.LastName = updateDto.LastName;
        user.Department = updateDto.Department;
        user.Role = role;
        user.IsActive = updateDto.IsActive;

        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded)
        {
            return BadRequest(result.Errors);
        }

        // Update user permissions if provided
        if (updateDto.Permissions != null)
        {
            await _userPermissionService.SetUserPermissionsAsync(id, updateDto.Permissions);
        }

        // Update user projects if provided
        if (updateDto.ProjectIds != null)
        {
            // Remove existing user projects
            var existingProjects = await _unitOfWork.UserProjects.GetAllAsync();
            var userProjectsToRemove = existingProjects.Where(up => up.UserId == id).ToList();
            
            foreach (var project in userProjectsToRemove)
            {
                _unitOfWork.UserProjects.Remove(project);
            }

            // Add new user projects
            foreach (var projectId in updateDto.ProjectIds)
            {
                var userProject = new UserProject
                {
                    Id = Guid.NewGuid().ToString(),
                    UserId = id,
                    ProjectId = projectId
                };
                await _unitOfWork.UserProjects.AddAsync(userProject);
            }

            await _unitOfWork.SaveChangesAsync();
        }

        var userDto = new UserDto
        {
            Id = user.Id,
            UserName = user.UserName,
            Email = user.Email,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Department = user.Department,
            Role = user.Role.ToString(),
            IsActive = user.IsActive,
            LastLoginAt = user.LastLogin
        };

        return Ok(userDto);
    }

    /// <summary>
    /// Delete a user
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<ActionResult> DeleteUser(string id)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user == null)
            return NotFound();

        var result = await _userManager.DeleteAsync(user);
        if (!result.Succeeded)
        {
            return BadRequest(result.Errors);
        }

        return NoContent();
    }

    /// <summary>
    /// Change user password
    /// </summary>
    [HttpPost("{id}/change-password")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<ActionResult> ChangePassword(string id, [FromBody] ChangePasswordDto changePasswordDto)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user == null)
            return NotFound();

        var result = await _userManager.ChangePasswordAsync(user, changePasswordDto.CurrentPassword, changePasswordDto.NewPassword);
        if (!result.Succeeded)
        {
            return BadRequest(result.Errors);
        }

        return Ok();
    }

    /// <summary>
    /// Reset user password
    /// </summary>
    [HttpPatch("{id}/password")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<ActionResult> ResetPassword(string id, [FromBody] ResetPasswordDto resetPasswordDto)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user == null)
            return NotFound();

        var token = await _userManager.GeneratePasswordResetTokenAsync(user);
        var result = await _userManager.ResetPasswordAsync(user, token, resetPasswordDto.newPassword);
        if (!result.Succeeded)
        {
            return BadRequest(result.Errors);
        }

        return Ok();
    }

    /// <summary>
    /// Get all available permissions
    /// </summary>
    [HttpGet("permissions")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public ActionResult<IEnumerable<string>> GetAvailablePermissions()
    {
        var permissions = new List<string>
        {
            // Master Data Permissions
            UserPermissions.MasterDataRead,
            UserPermissions.MasterDataCreate,
            UserPermissions.MasterDataUpdate,
            UserPermissions.MasterDataDelete,
            
            // Employee Permissions
            UserPermissions.EmployeesRead,
            UserPermissions.EmployeesCreate,
            UserPermissions.EmployeesUpdate,
            UserPermissions.EmployeesDelete,
            UserPermissions.EmployeesImport,
            UserPermissions.EmployeesExport,
            
            // Asset Permissions
            UserPermissions.AssetsRead,
            UserPermissions.AssetsCreate,
            UserPermissions.AssetsUpdate,
            UserPermissions.AssetsDelete,
            UserPermissions.AssetsAssign,
            UserPermissions.AssetsUnassign,
            UserPermissions.AssetsImport,
            UserPermissions.AssetsExport,
            
            // Accessory Permissions
            UserPermissions.AccessoriesRead,
            UserPermissions.AccessoriesCreate,
            UserPermissions.AccessoriesUpdate,
            UserPermissions.AccessoriesDelete,
            UserPermissions.AccessoriesAssign,
            UserPermissions.AccessoriesUnassign,
            
            // SIM Card Permissions
            UserPermissions.SimCardsRead,
            UserPermissions.SimCardsCreate,
            UserPermissions.SimCardsUpdate,
            UserPermissions.SimCardsDelete,
            UserPermissions.SimCardsAssign,
            UserPermissions.SimCardsUnassign,
            UserPermissions.SimCardsImport,
            UserPermissions.SimCardsExport,
            
            // Software License Permissions
            UserPermissions.SoftwareLicensesRead,
            UserPermissions.SoftwareLicensesCreate,
            UserPermissions.SoftwareLicensesUpdate,
            UserPermissions.SoftwareLicensesDelete,
            UserPermissions.SoftwareLicensesAssign,
            UserPermissions.SoftwareLicensesUnassign,
            
            // Purchase Order Permissions
            UserPermissions.PurchaseOrdersRead,
            UserPermissions.PurchaseOrdersCreate,
            UserPermissions.PurchaseOrdersUpdate,
            UserPermissions.PurchaseOrdersDelete,
            UserPermissions.PurchaseOrdersApprove,
            
            // Report Permissions
            UserPermissions.ReportsRead,
            UserPermissions.ReportsGenerate,
            UserPermissions.ReportsExport,
            
            // User Management Permissions
            UserPermissions.UsersRead,
            UserPermissions.UsersCreate,
            UserPermissions.UsersUpdate,
            UserPermissions.UsersDelete,
            UserPermissions.UsersAssignRoles,
            UserPermissions.UsersManagePermissions,
            
            // System Administration
            //UserPermissions.SystemAdmin,
            //UserPermissions.SystemAuditLogs,
            //UserPermissions.SystemBackup,
            //UserPermissions.SystemRestore
        };

        return Ok(permissions);
    }

    /// <summary>
    /// Get user permissions
    /// </summary>
    [HttpGet("{id}/permissions")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<ActionResult<IEnumerable<string>>> GetUserPermissions(string id)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user == null)
            return NotFound();

        // Get actual user permissions using the UserPermissionService
        var permissions = await _userPermissionService.GetUserPermissionsAsync(id);

        return Ok(new { permissions });
    }

    /// <summary>
    /// Get user projects
    /// </summary>
    [HttpGet("{id}/projects")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<ActionResult<IEnumerable<string>>> GetUserProjects(string id)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user == null)
            return NotFound();

        // Get user projects from the database
        var userProjects = await _unitOfWork.UserProjects.GetAllAsync();
        var userProjectIds = userProjects
            .Where(up => up.UserId == id)
            .Select(up => up.ProjectId)
            .ToList();

        return Ok(new { projects = userProjectIds });
    }

    /// <summary>
    /// Update user permissions
    /// </summary>
    [HttpPut("{id}/permissions")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<ActionResult> UpdateUserPermissions(string id, [FromBody] UpdateUserPermissionsDto permissionsDto)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user == null)
            return NotFound();

        // Update the user's role if provided
        if (!string.IsNullOrEmpty(permissionsDto.Role) && Enum.TryParse<UserRole>(permissionsDto.Role, true, out var role))
        {
            user.Role = role;
            var result = await _userManager.UpdateAsync(user);
            if (!result.Succeeded)
            {
                return BadRequest(result.Errors);
            }
        }

        // Update individual user permissions using the UserPermissionService
        if (permissionsDto.Permissions != null)
        {
            await _userPermissionService.SetUserPermissionsAsync(id, permissionsDto.Permissions);
        }

        return Ok();
    }

    /// <summary>
    /// Update user projects
    /// </summary>
    [HttpPut("{id}/projects")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<ActionResult> UpdateUserProjects(string id, [FromBody] UpdateUserProjectsDto projectsDto)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user == null)
            return NotFound();

        // Remove existing user projects
        var existingProjects = await _unitOfWork.UserProjects.GetAllAsync();
        var userProjectsToRemove = existingProjects.Where(up => up.UserId == id).ToList();
        
        foreach (var project in userProjectsToRemove)
        {
            _unitOfWork.UserProjects.Remove(project);
        }

        // Add new user projects
        foreach (var projectId in projectsDto.ProjectIds)
        {
            var userProject = new UserProject
            {
                Id = Guid.NewGuid().ToString(),
                UserId = id,
                ProjectId = projectId
            };
            await _unitOfWork.UserProjects.AddAsync(userProject);
        }

        await _unitOfWork.SaveChangesAsync();

        return Ok();
    }

    /// <summary>
    /// Toggle user active status
    /// </summary>
    [HttpPatch("{id}/status")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<ActionResult<UserDto>> ToggleUserStatus(string id, [FromBody] ToggleUserStatusDto statusDto)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user == null)
            return NotFound();

        user.IsActive = statusDto.IsActive;
        
        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded)
        {
            return BadRequest(result.Errors);
        }

        var userDto = new UserDto
        {
            Id = user.Id,
            UserName = user.UserName,
            Email = user.Email,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Department = user.Department,
            Role = user.Role.ToString(),
            IsActive = user.IsActive,
            LastLoginAt = user.LastLogin
        };

        return Ok(userDto);
    }
}
