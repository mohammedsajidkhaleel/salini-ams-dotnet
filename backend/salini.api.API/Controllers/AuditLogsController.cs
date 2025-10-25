using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using salini.api.Application.Common.Interfaces;
using salini.api.Application.DTOs;
using salini.api.Domain.Entities;

namespace salini.api.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AuditLogsController : BaseController
{
    private readonly ILogger<AuditLogsController> _logger;

    public AuditLogsController(
        UserManager<ApplicationUser> userManager, 
        IApplicationDbContext context,
        ILogger<AuditLogsController> logger)
        : base(userManager, context)
    {
        _logger = logger;
    }

    /// <summary>
    /// Get audit logs with pagination and filtering
    /// </summary>
    [HttpGet]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<ActionResult<PaginatedResult<AuditLogDto>>> GetAuditLogs(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 50,
        [FromQuery] string? tableName = null,
        [FromQuery] string? recordId = null,
        [FromQuery] string? action = null,
        [FromQuery] string? userId = null,
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null,
        [FromQuery] string? sortBy = "CreatedAt",
        [FromQuery] bool sortDescending = true)
    {
        try
        {
            var query = _context.AuditLogs
                .Include(a => a.User)
                .AsQueryable();

            // Apply filters
            if (!string.IsNullOrEmpty(tableName))
            {
                query = query.Where(a => a.TableName == tableName);
            }

            if (!string.IsNullOrEmpty(recordId))
            {
                query = query.Where(a => a.RecordId == recordId);
            }

            if (!string.IsNullOrEmpty(action))
            {
                query = query.Where(a => a.Action == action);
            }

            if (!string.IsNullOrEmpty(userId))
            {
                query = query.Where(a => a.UserId == userId);
            }

            if (fromDate.HasValue)
            {
                query = query.Where(a => a.CreatedAt >= fromDate.Value);
            }

            if (toDate.HasValue)
            {
                query = query.Where(a => a.CreatedAt <= toDate.Value);
            }

            // Get total count
            var totalCount = await query.CountAsync();

            // Apply sorting
            query = sortBy?.ToLower() switch
            {
                "tablename" => sortDescending ? query.OrderByDescending(a => a.TableName) : query.OrderBy(a => a.TableName),
                "action" => sortDescending ? query.OrderByDescending(a => a.Action) : query.OrderBy(a => a.Action),
                _ => sortDescending ? query.OrderByDescending(a => a.CreatedAt) : query.OrderBy(a => a.CreatedAt)
            };

            // Apply pagination
            var items = await query
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .Select(a => new AuditLogDto
                {
                    Id = a.Id,
                    TableName = a.TableName,
                    RecordId = a.RecordId,
                    Action = a.Action,
                    OldValues = a.OldValues,
                    NewValues = a.NewValues,
                    UserId = a.UserId,
                    UserName = a.User != null ? $"{a.User.FirstName} {a.User.LastName}" : null,
                    CreatedAt = a.CreatedAt
                })
                .ToListAsync();

            return Ok(new PaginatedResult<AuditLogDto>
            {
                Items = items,
                TotalCount = totalCount,
                PageNumber = pageNumber,
                PageSize = pageSize
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving audit logs");
            return StatusCode(500, new { message = "An error occurred while retrieving audit logs" });
        }
    }

    /// <summary>
    /// Get audit logs for a specific record
    /// </summary>
    [HttpGet("record/{tableName}/{recordId}")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<ActionResult<List<AuditLogDto>>> GetAuditLogsForRecord(
        string tableName, 
        string recordId)
    {
        try
        {
            var auditLogs = await _context.AuditLogs
                .Include(a => a.User)
                .Where(a => a.TableName == tableName && a.RecordId == recordId)
                .OrderByDescending(a => a.CreatedAt)
                .Select(a => new AuditLogDto
                {
                    Id = a.Id,
                    TableName = a.TableName,
                    RecordId = a.RecordId,
                    Action = a.Action,
                    OldValues = a.OldValues,
                    NewValues = a.NewValues,
                    UserId = a.UserId,
                    UserName = a.User != null ? $"{a.User.FirstName} {a.User.LastName}" : null,
                    CreatedAt = a.CreatedAt
                })
                .ToListAsync();

            return Ok(auditLogs);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving audit logs for record {TableName}/{RecordId}", tableName, recordId);
            return StatusCode(500, new { message = "An error occurred while retrieving audit logs" });
        }
    }

    /// <summary>
    /// Get audit log statistics
    /// </summary>
    [HttpGet("stats")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<ActionResult<AuditLogStatsDto>> GetAuditLogStats()
    {
        try
        {
            var stats = new AuditLogStatsDto
            {
                TotalLogs = await _context.AuditLogs.CountAsync(),
                TotalInserts = await _context.AuditLogs.CountAsync(a => a.Action == "INSERT"),
                TotalUpdates = await _context.AuditLogs.CountAsync(a => a.Action == "UPDATE"),
                TotalDeletes = await _context.AuditLogs.CountAsync(a => a.Action == "DELETE"),
                LogsByTable = await _context.AuditLogs
                    .GroupBy(a => a.TableName)
                    .Select(g => new { TableName = g.Key, Count = g.Count() })
                    .OrderByDescending(x => x.Count)
                    .Take(10)
                    .ToDictionaryAsync(x => x.TableName, x => x.Count),
                RecentActivity = await _context.AuditLogs
                    .OrderByDescending(a => a.CreatedAt)
                    .Take(10)
                    .Select(a => new AuditLogDto
                    {
                        Id = a.Id,
                        TableName = a.TableName,
                        RecordId = a.RecordId,
                        Action = a.Action,
                        UserId = a.UserId,
                        UserName = a.User != null ? $"{a.User.FirstName} {a.User.LastName}" : null,
                        CreatedAt = a.CreatedAt
                    })
                    .ToListAsync()
            };

            return Ok(stats);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving audit log statistics");
            return StatusCode(500, new { message = "An error occurred while retrieving statistics" });
        }
    }
}

/// <summary>
/// Audit Log DTO
/// </summary>
public class AuditLogDto
{
    public string Id { get; set; } = string.Empty;
    public string TableName { get; set; } = string.Empty;
    public string RecordId { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string? OldValues { get; set; }
    public string? NewValues { get; set; }
    public string? UserId { get; set; }
    public string? UserName { get; set; }
    public DateTime CreatedAt { get; set; }
}

/// <summary>
/// Audit Log Statistics DTO
/// </summary>
public class AuditLogStatsDto
{
    public int TotalLogs { get; set; }
    public int TotalInserts { get; set; }
    public int TotalUpdates { get; set; }
    public int TotalDeletes { get; set; }
    public Dictionary<string, int> LogsByTable { get; set; } = new();
    public List<AuditLogDto> RecentActivity { get; set; } = new();
}

