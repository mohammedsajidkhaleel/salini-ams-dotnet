using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using salini.api.Application.Common.Interfaces;
using salini.api.Application.DTOs;
using salini.api.Application.DTOs.SoftwareLicense;
using salini.api.Application.Features.SoftwareLicenses.Commands.CreateSoftwareLicense;
using salini.api.Application.Features.SoftwareLicenses.Commands.UpdateSoftwareLicense;
using salini.api.Application.Features.SoftwareLicenses.Commands.AssignSoftwareLicense;
using salini.api.Application.Features.SoftwareLicenses.Commands.UnassignSoftwareLicense;
using salini.api.Application.Features.SoftwareLicenses.Queries.GetSoftwareLicenses;
using salini.api.Application.Features.SoftwareLicenses.Queries.GetSoftwareLicenseById;
using salini.api.Application.Features.SoftwareLicenses.Queries.GetSoftwareLicenseAssignments;
using salini.api.Domain.Entities;

namespace salini.api.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SoftwareLicensesController : BaseController
{
    private readonly IMediator _mediator;
    private readonly ILogger<SoftwareLicensesController> _logger;

    public SoftwareLicensesController(IMediator mediator, ILogger<SoftwareLicensesController> logger, UserManager<ApplicationUser> userManager, IApplicationDbContext context)
        : base(userManager, context)
    {
        _mediator = mediator;
        _logger = logger;
    }

    /// <summary>
    /// Get all software licenses with pagination and filtering
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<PaginatedResult<SoftwareLicenseListDto>>> GetSoftwareLicenses(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? searchTerm = null,
        [FromQuery] string? projectId = null,
        [FromQuery] string? vendor = null,
        [FromQuery] int? status = null,
        [FromQuery] string? assignedTo = null,
        [FromQuery] string? sortBy = null,
        [FromQuery] bool sortDescending = false)
    {
        // Get user's project filter
        var userProjectIds = await GetProjectFilterAsync();
        
        // If user has project restrictions and no specific projectId is requested, use user's projects
        if (userProjectIds != null && string.IsNullOrEmpty(projectId))
        {
            // For now, we'll use the first project ID if user has multiple projects
            if (userProjectIds.Count > 0)
            {
                projectId = userProjectIds[0];
            }
            else
            {
                // User has no assigned projects, return empty result
                return Ok(new PaginatedResult<SoftwareLicenseListDto>
                {
                    Items = new List<SoftwareLicenseListDto>(),
                    TotalCount = 0,
                    PageNumber = pageNumber,
                    PageSize = pageSize
                });
            }
        }
        // If user requested a specific projectId, check if they have access to it
        else if (userProjectIds != null && !string.IsNullOrEmpty(projectId) && !userProjectIds.Contains(projectId))
        {
            return Forbid("You don't have access to this project's software licenses.");
        }

        var query = new GetSoftwareLicensesQuery
        {
            PageNumber = pageNumber,
            PageSize = pageSize,
            SearchTerm = searchTerm,
            ProjectId = projectId,
            Vendor = vendor,
            Status = status.HasValue ? (salini.api.Domain.Enums.SoftwareLicenseStatus)status.Value : null,
            AssignedTo = assignedTo,
            SortBy = sortBy,
            SortDescending = sortDescending
        };

        var result = await _mediator.Send(query);
        return Ok(result);
    }

    /// <summary>
    /// Get software license by ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<SoftwareLicenseDto>> GetSoftwareLicense(string id)
    {
        var query = new GetSoftwareLicenseByIdQuery(id);
        var result = await _mediator.Send(query);
        
        if (result == null)
        return NotFound();
            
        return Ok(result);
    }

    /// <summary>
    /// Create a new software license
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<SoftwareLicenseDto>> CreateSoftwareLicense([FromBody] SoftwareLicenseCreateDto createDto)
    {
        try
        {
            _logger.LogInformation("CreateSoftwareLicense called with SoftwareName: {SoftwareName}, ProjectId: {ProjectId}", 
                createDto?.SoftwareName, createDto?.ProjectId);

            if (createDto == null)
            {
                _logger.LogWarning("CreateSoftwareLicense: Request body is null");
                return BadRequest("Request body is required");
            }

            if (!ModelState.IsValid)
            {
                _logger.LogWarning("CreateSoftwareLicense: Model validation failed. Errors: {Errors}", 
                    string.Join(", ", ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage)));
                return BadRequest(ModelState);
            }

            var command = new CreateSoftwareLicenseCommand
            {
                SoftwareName = createDto.SoftwareName,
                LicenseKey = createDto.LicenseKey,
                LicenseType = createDto.LicenseType,
                Seats = createDto.Seats,
                Vendor = createDto.Vendor,
                PurchaseDate = createDto.PurchaseDate,
                ExpiryDate = createDto.ExpiryDate,
                Cost = createDto.Cost,
                Status = createDto.Status,
                Notes = createDto.Notes,
                PoNumber = createDto.PoNumber,
                ProjectId = createDto.ProjectId
            };

            var result = await _mediator.Send(command);
            _logger.LogInformation("CreateSoftwareLicense successful. Created license with ID: {Id}", result.Id);
            return CreatedAtAction(nameof(GetSoftwareLicense), new { id = result.Id }, result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "CreateSoftwareLicense failed with exception");
            return BadRequest($"Failed to create software license: {ex.Message}");
        }
    }

    /// <summary>
    /// Update an existing software license
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<SoftwareLicenseDto>> UpdateSoftwareLicense(string id, [FromBody] SoftwareLicenseUpdateDto updateDto)
    {
        try
        {
            _logger.LogInformation("UpdateSoftwareLicense called with ID: {Id}, SoftwareName: {SoftwareName}", 
                id, updateDto?.SoftwareName);

            if (updateDto == null)
            {
                _logger.LogWarning("UpdateSoftwareLicense: Request body is null");
                return BadRequest("Request body is required");
            }

            if (id != updateDto.Id)
            {
                _logger.LogWarning("UpdateSoftwareLicense: ID mismatch. Path: {PathId}, Body: {BodyId}", id, updateDto.Id);
                return BadRequest("ID mismatch between URL and request body");
            }

            if (!ModelState.IsValid)
            {
                _logger.LogWarning("UpdateSoftwareLicense: Model validation failed. Errors: {Errors}", 
                    string.Join(", ", ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage)));
                return BadRequest(ModelState);
            }

            var command = new UpdateSoftwareLicenseCommand
            {
                Id = updateDto.Id,
                SoftwareName = updateDto.SoftwareName,
                LicenseKey = updateDto.LicenseKey,
                LicenseType = updateDto.LicenseType,
                Seats = updateDto.Seats,
                Vendor = updateDto.Vendor,
                PurchaseDate = updateDto.PurchaseDate,
                ExpiryDate = updateDto.ExpiryDate,
                Cost = updateDto.Cost,
                Status = updateDto.Status,
                Notes = updateDto.Notes,
                PoNumber = updateDto.PoNumber,
                ProjectId = updateDto.ProjectId
            };

            var result = await _mediator.Send(command);
            _logger.LogInformation("UpdateSoftwareLicense successful. Updated license with ID: {Id}", result.Id);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            _logger.LogWarning("UpdateSoftwareLicense: Software license not found. ID: {Id}", id);
            return NotFound(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "UpdateSoftwareLicense failed with exception");
            return BadRequest($"Failed to update software license: {ex.Message}");
        }
    }

    /// <summary>
    /// Delete a software license
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteSoftwareLicense(string id)
    {
        // TODO: Implement when SoftwareLicense commands and queries are available
        return BadRequest("SoftwareLicense commands not yet implemented");
    }

    /// <summary>
    /// Assign a software license to an employee
    /// </summary>
    [HttpPost("{id}/assign")]
    public async Task<ActionResult> AssignSoftwareLicense(string id, [FromBody] SoftwareLicenseAssignmentDto assignmentDto)
    {
        var command = new AssignSoftwareLicenseCommand
        {
            SoftwareLicenseId = id,
            EmployeeId = assignmentDto.EmployeeId,
            Notes = assignmentDto.Notes
        };
        
        await _mediator.Send(command);
        return Ok();
    }

    /// <summary>
    /// Unassign a software license from an employee
    /// </summary>
    [HttpPost("assignments/{assignmentId}/unassign")]
    public async Task<ActionResult> UnassignSoftwareLicense(string assignmentId, [FromQuery] string? notes = null)
    {
        var command = new UnassignSoftwareLicenseCommand
        {
            AssignmentId = assignmentId,
            Notes = notes
        };
        
        await _mediator.Send(command);
        return Ok();
    }

    /// <summary>
    /// Get license assignments for a specific license
    /// </summary>
    [HttpGet("{id}/assignments")]
    public async Task<ActionResult<IEnumerable<SoftwareLicenseAssignmentListDto>>> GetLicenseAssignments(string id)
    {
        var query = new GetSoftwareLicenseAssignmentsQuery(id);
        var result = await _mediator.Send(query);
        return Ok(result);
    }
}