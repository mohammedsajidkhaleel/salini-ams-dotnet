using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using salini.api.Application.Common.Interfaces;
using salini.api.Application.DTOs;
using salini.api.Application.DTOs.Asset;
using salini.api.Application.Features.Assets.Commands.AssignAsset;
using salini.api.Application.Features.Assets.Commands.CreateAsset;
using salini.api.Application.Features.Assets.Commands.DeleteAsset;
using salini.api.Application.Features.Assets.Commands.ImportAssets;
using salini.api.Application.Features.Assets.Commands.UnassignAsset;
using salini.api.Application.Features.Assets.Commands.UpdateAsset;
using salini.api.Application.Features.Assets.Queries.GetAssetById;
using salini.api.Application.Features.Assets.Queries.GetAssets;
using salini.api.Domain.Entities;

namespace salini.api.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AssetsController : BaseController
{
    private readonly IMediator _mediator;
    private readonly ILogger<AssetsController> _logger;

    public AssetsController(IMediator mediator, ILogger<AssetsController> logger, UserManager<ApplicationUser> userManager, IApplicationDbContext context)
        : base(userManager, context)
    {
        _mediator = mediator;
        _logger = logger;
    }

    /// <summary>
    /// Get all assets with pagination and filtering
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<PaginatedResult<AssetListDto>>> GetAssets(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? searchTerm = null,
        [FromQuery] string? projectId = null,
        [FromQuery] string? itemId = null,
        [FromQuery] int? status = null,
        [FromQuery] string? assignedTo = null,
        [FromQuery] bool? assigned = null,
        [FromQuery] string? sortBy = null,
        [FromQuery] bool sortDescending = false)
    {
        // Get user's project filter
        var userProjectIds = await GetProjectFilterAsync();
        
        // If user has project restrictions and no specific projectId is requested, use user's projects
        if (userProjectIds != null && string.IsNullOrEmpty(projectId))
        {
            // For now, we'll use the first project ID if user has multiple projects
            // In the future, we might want to modify the query to support multiple project IDs
            if (userProjectIds.Count > 0)
            {
                projectId = userProjectIds[0];
            }
            else
            {
                // User has no assigned projects, return empty result
                return Ok(new PaginatedResult<AssetListDto>
                {
                    Items = new List<AssetListDto>(),
                    TotalCount = 0,
                    PageNumber = pageNumber,
                    PageSize = pageSize
                });
            }
        }
        // If user requested a specific projectId, check if they have access to it
        else if (userProjectIds != null && !string.IsNullOrEmpty(projectId) && !userProjectIds.Contains(projectId))
        {
            return Forbid("You don't have access to this project's assets.");
        }

        var query = new GetAssetsQuery
        {
            PageNumber = pageNumber,
            PageSize = pageSize,
            SearchTerm = searchTerm,
            ProjectId = projectId,
            ItemId = itemId,
            Status = status.HasValue ? (salini.api.Domain.Enums.AssetStatus)status.Value : null,
            AssignedTo = assignedTo,
            Assigned = assigned,
            SortBy = sortBy,
            SortDescending = sortDescending
        };

        var result = await _mediator.Send(query);
        return Ok(result);
    }

    /// <summary>
    /// Get asset by ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<AssetDto>> GetAsset(string id)
    {
        var query = new GetAssetByIdQuery(id);
        var result = await _mediator.Send(query);
        
        if (result == null)
            return NotFound();
            
        return Ok(result);
    }

    /// <summary>
    /// Create a new asset
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<AssetDto>> CreateAsset([FromBody] AssetCreateDto createDto)
    {
        var command = new CreateAssetCommand
        {
            AssetTag = createDto.AssetTag,
            Name = createDto.Name,
            Description = createDto.Description,
            SerialNumber = createDto.SerialNumber,
            Status = createDto.Status,
            Condition = createDto.Condition,
            PoNumber = createDto.PoNumber,
            Location = createDto.Location,
            ItemId = createDto.ItemId,
            ProjectId = createDto.ProjectId,
            Notes = createDto.Notes
        };

        var result = await _mediator.Send(command);
        return CreatedAtAction(nameof(GetAsset), new { id = result.Id }, result);
    }

    /// <summary>
    /// Update an existing asset
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<AssetDto>> UpdateAsset(string id, [FromBody] AssetUpdateDto updateDto)
    {
        if (id != updateDto.Id)
            return BadRequest("ID mismatch");

        var command = new UpdateAssetCommand
        {
            Id = updateDto.Id,
            AssetTag = updateDto.AssetTag,
            Name = updateDto.Name,
            Description = updateDto.Description,
            SerialNumber = updateDto.SerialNumber,
            Status = updateDto.Status,
            Condition = updateDto.Condition,
            PoNumber = updateDto.PoNumber,
            Location = updateDto.Location,
            ItemId = updateDto.ItemId,
            ProjectId = updateDto.ProjectId,
            Notes = updateDto.Notes
        };

        var result = await _mediator.Send(command);
        return Ok(result);
    }

    /// <summary>
    /// Delete an asset
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteAsset(string id)
    {
        var command = new DeleteAssetCommand(id);
        await _mediator.Send(command);
        return NoContent();
    }

    /// <summary>
    /// Assign an asset to an employee
    /// </summary>
    [HttpPost("{id}/assign")]
    public async Task<ActionResult> AssignAsset(string id, [FromBody] AssetAssignmentDto assignmentDto)
    {
        if (id != assignmentDto.AssetId)
            return BadRequest("Asset ID mismatch");

        var command = new AssignAssetCommand
        {
            AssetId = assignmentDto.AssetId,
            EmployeeId = assignmentDto.EmployeeId,
            Notes = assignmentDto.Notes
        };

        await _mediator.Send(command);
        return Ok();
    }

    /// <summary>
    /// Unassign an asset from an employee
    /// </summary>
    [HttpPost("{id}/unassign")]
    public async Task<ActionResult> UnassignAsset(string id, [FromBody] AssetUnassignmentDto unassignmentDto)
    {
        if (id != unassignmentDto.AssetId)
            return BadRequest("Asset ID mismatch");

        var command = new UnassignAssetCommand
        {
            AssetId = unassignmentDto.AssetId,
            Notes = unassignmentDto.Notes
        };

        await _mediator.Send(command);
        return Ok();
    }

    /// <summary>
    /// Import assets from CSV data
    /// </summary>
    [HttpPost("import")]
    public async Task<ActionResult<ImportAssetsResult>> ImportAssets([FromBody] ImportAssetsRequest request)
    {
        try
        {
            // Log the incoming request for debugging
            _logger.LogInformation("ImportAssets called with {AssetCount} assets, ProjectId: {ProjectId}", 
                request?.Assets?.Count ?? 0, request?.ProjectId ?? "null");

            if (request == null)
            {
                _logger.LogWarning("ImportAssets: Request body is null");
                return BadRequest("Request body is required");
            }

            if (request.Assets == null || request.Assets.Count == 0)
            {
                _logger.LogWarning("ImportAssets: Assets list is null or empty");
                return BadRequest("Assets list is required and cannot be empty");
            }

            // Log first asset for debugging
            if (request.Assets.Count > 0)
            {
                var firstAsset = request.Assets[0];
                _logger.LogInformation("First asset: AssetTag={AssetTag}, AssetName={AssetName}, SerialNo={SerialNo}", 
                    firstAsset.AssetTag, firstAsset.AssetName, firstAsset.SerialNo ?? "null");
            }

            var command = new ImportAssetsCommand
            {
                Assets = request.Assets,
                ProjectId = request.ProjectId
            };

            var result = await _mediator.Send(command);
            
            if (result.Success)
                return Ok(result);
            else
                return BadRequest(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "ImportAssets failed with exception");
            return BadRequest($"Import failed: {ex.Message}");
        }
    }
}
