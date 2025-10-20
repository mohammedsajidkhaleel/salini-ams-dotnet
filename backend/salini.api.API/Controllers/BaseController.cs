using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using salini.api.Application.Common.Interfaces;
using salini.api.Domain.Entities;
using System.Security.Claims;

namespace salini.api.API.Controllers
{
    [ApiController]
    [Authorize]
    public abstract class BaseController : ControllerBase
    {
        protected readonly UserManager<ApplicationUser> _userManager;
        protected readonly IApplicationDbContext _context;

        protected BaseController(UserManager<ApplicationUser> userManager, IApplicationDbContext context)
        {
            _userManager = userManager;
            _context = context;
        }

        /// <summary>
        /// Get the current authenticated user
        /// </summary>
        protected async Task<ApplicationUser?> GetCurrentUserAsync()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                return null;

            return await _userManager.FindByIdAsync(userId);
        }

        /// <summary>
        /// Get the current user's assigned project IDs
        /// </summary>
        protected async Task<List<string>> GetUserProjectIdsAsync()
        {
            var user = await GetCurrentUserAsync();
            if (user == null)
                return new List<string>();

            // Get user projects from the UserProjects table
            var userProjectIds = await _context.UserProjects
                .Where(up => up.UserId == user.Id)
                .Select(up => up.ProjectId)
                .ToListAsync();

            return userProjectIds;
        }

        /// <summary>
        /// Check if the current user is a SuperAdmin or Admin (can see all data)
        /// </summary>
        protected async Task<bool> CanSeeAllDataAsync()
        {
            var user = await GetCurrentUserAsync();
            if (user == null)
                return false;

            return user.Role == Domain.Enums.UserRole.SuperAdmin || 
                   user.Role == Domain.Enums.UserRole.Admin;
        }

        /// <summary>
        /// Get project filter for queries - returns null if user can see all data, otherwise returns user's project IDs
        /// </summary>
        protected async Task<List<string>?> GetProjectFilterAsync()
        {
            var canSeeAll = await CanSeeAllDataAsync();
            if (canSeeAll)
                return null; // No filtering for admins

            return await GetUserProjectIdsAsync();
        }
    }
}
