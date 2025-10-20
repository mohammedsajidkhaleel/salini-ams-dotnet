using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using salini.api.Application.Common.Interfaces;
using salini.api.Domain.Entities;

namespace salini.api.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DashboardController : BaseController
{
    public DashboardController(UserManager<ApplicationUser> userManager, IApplicationDbContext context)
        : base(userManager, context)
    {
    }

    /// <summary>
    /// Get dashboard statistics filtered by user's project permissions
    /// </summary>
    [HttpGet("stats")]
    public async Task<ActionResult<DashboardStatsDto>> GetDashboardStats()
    {
        try
        {
            // Get user's project filter
            var userProjectIds = await GetProjectFilterAsync();
            var canSeeAllData = await CanSeeAllDataAsync();

            var stats = new DashboardStatsDto();

            // If user has no assigned projects (empty list), return all zeros
            if (userProjectIds != null && userProjectIds.Count == 0)
            {
                stats.TotalAssets = 0;
                stats.TotalEmployees = 0;
                stats.TotalProjects = 0;
                stats.SimCards = 0;
                return Ok(stats);
            }

            // Get assets count
            var assetsQuery = _context.Assets.AsQueryable();
            if (userProjectIds != null && userProjectIds.Count > 0)
            {
                assetsQuery = assetsQuery.Where(a => userProjectIds.Contains(a.ProjectId));
            }
            stats.TotalAssets = await assetsQuery.CountAsync();

            // Get employees count
            var employeesQuery = _context.Employees.AsQueryable();
            if (userProjectIds != null && userProjectIds.Count > 0)
            {
                employeesQuery = employeesQuery.Where(e => userProjectIds.Contains(e.ProjectId));
            }
            stats.TotalEmployees = await employeesQuery.CountAsync();

            // Get projects count
            var projectsQuery = _context.Projects.AsQueryable();
            if (userProjectIds != null && userProjectIds.Count > 0)
            {
                projectsQuery = projectsQuery.Where(p => userProjectIds.Contains(p.Id));
            }
            stats.TotalProjects = await projectsQuery.CountAsync();

            // Get SIM cards count
            var simCardsQuery = _context.SimCards.AsQueryable();
            if (userProjectIds != null && userProjectIds.Count > 0)
            {
                simCardsQuery = simCardsQuery.Where(s => userProjectIds.Contains(s.ProjectId));
            }
            stats.SimCards = await simCardsQuery.CountAsync();

            return Ok(stats);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred while fetching dashboard stats", error = ex.Message });
        }
    }
}

public class DashboardStatsDto
{
    public int TotalAssets { get; set; }
    public int TotalEmployees { get; set; }
    public int TotalProjects { get; set; }
    public int SimCards { get; set; }
}
