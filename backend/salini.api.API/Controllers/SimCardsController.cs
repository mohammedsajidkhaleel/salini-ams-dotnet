using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using salini.api.Application.Common.Interfaces;
using salini.api.Application.DTOs;
using salini.api.Application.DTOs.SimCard;
using salini.api.Application.Features.SimCards.Commands.AssignSimCard;
using salini.api.Application.Features.SimCards.Commands.CreateSimCard;
using salini.api.Application.Features.SimCards.Commands.DeleteSimCard;
using salini.api.Application.Features.SimCards.Commands.ImportSimCards;
using salini.api.Application.Features.SimCards.Commands.UnassignSimCard;
using salini.api.Application.Features.SimCards.Commands.UpdateSimCard;
using salini.api.Application.Features.SimCards.Queries.GetSimCardById;
using salini.api.Application.Features.SimCards.Queries.GetSimCards;
using salini.api.Domain.Entities;
using salini.api.Domain.Enums;

namespace salini.api.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SimCardsController : BaseController
{
    private readonly IMediator _mediator;

    public SimCardsController(IMediator mediator, UserManager<ApplicationUser> userManager, IApplicationDbContext context)
        : base(userManager, context)
    {
        _mediator = mediator;
    }

    /// <summary>
    /// Get all SIM cards with pagination and filtering
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<PaginatedResult<SimCardListDto>>> GetSimCards(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? searchTerm = null,
        [FromQuery] string? projectId = null,
        [FromQuery] string? simProviderId = null,
        [FromQuery] string? simTypeId = null,
        [FromQuery] string? simCardPlanId = null,
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
                return Ok(new PaginatedResult<SimCardListDto>
                {
                    Items = new List<SimCardListDto>(),
                    TotalCount = 0,
                    PageNumber = pageNumber,
                    PageSize = pageSize
                });
            }
        }
        // If user requested a specific projectId, check if they have access to it
        else if (userProjectIds != null && !string.IsNullOrEmpty(projectId) && !userProjectIds.Contains(projectId))
        {
            return Forbid("You don't have access to this project's SIM cards.");
        }

        var query = new GetSimCardsQuery
        {
            PageNumber = pageNumber,
            PageSize = pageSize,
            SearchTerm = searchTerm,
            ProjectId = projectId,
            SimProviderId = simProviderId,
            SimTypeId = simTypeId,
            SimCardPlanId = simCardPlanId,
            Status = status.HasValue ? (salini.api.Domain.Enums.SimCardStatus)status.Value : null,
            AssignedTo = assignedTo,
            SortBy = sortBy,
            SortDescending = sortDescending
        };

        var result = await _mediator.Send(query);
        return Ok(result);
    }

    /// <summary>
    /// Get SIM card by ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<SimCardDto>> GetSimCard(string id)
    {
        var query = new GetSimCardByIdQuery(id);
        var result = await _mediator.Send(query);
        return Ok(result);
    }

    /// <summary>
    /// Create a new SIM card
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<SimCardDto>> CreateSimCard([FromBody] SimCardCreateDto createDto)
    {
        var command = new CreateSimCardCommand
        {
            SimAccountNo = createDto.SimAccountNo,
            SimServiceNo = createDto.SimServiceNo,
            SimStartDate = createDto.SimStartDate,
            SimTypeId = createDto.SimTypeId,
            SimCardPlanId = createDto.SimCardPlanId,
            SimProviderId = createDto.SimProviderId,
            SimStatus = (SimCardStatus)createDto.SimStatus,
            SimSerialNo = createDto.SimSerialNo,
            AssignedTo = createDto.AssignedTo,
            ProjectId = createDto.ProjectId
        };

        var result = await _mediator.Send(command);
        return CreatedAtAction(nameof(GetSimCard), new { id = result.Id }, result);
    }

    /// <summary>
    /// Update an existing SIM card
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<SimCardDto>> UpdateSimCard(string id, [FromBody] SimCardUpdateDto updateDto)
    {
        var command = new UpdateSimCardCommand
        {
            Id = id,
            SimAccountNo = updateDto.SimAccountNo,
            SimServiceNo = updateDto.SimServiceNo,
            SimStartDate = updateDto.SimStartDate,
            SimTypeId = updateDto.SimTypeId,
            SimCardPlanId = updateDto.SimCardPlanId,
            SimProviderId = updateDto.SimProviderId,
            SimStatus = updateDto.SimStatus,
            SimSerialNo = updateDto.SimSerialNo,
            AssignedTo = updateDto.AssignedTo,
            ProjectId = updateDto.ProjectId
        };

        var result = await _mediator.Send(command);
        return Ok(result);
    }

    /// <summary>
    /// Delete a SIM card
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteSimCard(string id)
    {
        var command = new DeleteSimCardCommand(id);
        await _mediator.Send(command);
        return NoContent();
    }

    /// <summary>
    /// Assign a SIM card to an employee
    /// </summary>
    [HttpPost("{id}/assign")]
    public async Task<ActionResult> AssignSimCard(string id, [FromBody] SimCardAssignmentDto assignmentDto)
    {
        if (id != assignmentDto.SimCardId)
            return BadRequest("SIM card ID mismatch");

        var command = new AssignSimCardCommand
        {
            SimCardId = assignmentDto.SimCardId,
            EmployeeId = assignmentDto.EmployeeId,
            Notes = assignmentDto.Notes
        };

        await _mediator.Send(command);
        return Ok();
    }

    /// <summary>
    /// Unassign a SIM card from an employee
    /// </summary>
    [HttpPost("{id}/unassign")]
    public async Task<ActionResult> UnassignSimCard(string id, [FromBody] SimCardUnassignmentDto unassignmentDto)
    {
        if (id != unassignmentDto.SimCardId)
            return BadRequest("SIM card ID mismatch");

        var command = new UnassignSimCardCommand
        {
            SimCardId = unassignmentDto.SimCardId,
            Notes = unassignmentDto.Notes
        };

        await _mediator.Send(command);
        return Ok();
    }

    /// <summary>
    /// Import SIM cards from CSV data
    /// </summary>
    [HttpPost("import")]
    public async Task<ActionResult<ImportSimCardsResult>> ImportSimCards([FromBody] ImportSimCardsRequest request)
    {
        try
        {
            if (request == null)
            {
                return BadRequest("Request body is required");
            }

            if (request.SimCards == null || request.SimCards.Count == 0)
            {
                return BadRequest("SIM cards list is required and cannot be empty");
            }

            var command = new ImportSimCardsCommand
            {
                SimCards = request.SimCards,
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
            return BadRequest($"Import failed: {ex.Message}");
        }
    }
}