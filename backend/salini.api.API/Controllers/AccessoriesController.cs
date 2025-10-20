using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using salini.api.Application.DTOs;
using salini.api.Application.DTOs.Accessory;
using salini.api.Application.Features.Accessories.Commands.AssignAccessory;
using salini.api.Application.Features.Accessories.Commands.CreateAccessory;
using salini.api.Application.Features.Accessories.Commands.DeleteAccessory;
using salini.api.Application.Features.Accessories.Commands.UnassignAccessory;
using salini.api.Application.Features.Accessories.Commands.UpdateAccessory;
using salini.api.Application.Features.Accessories.Queries.GetAccessories;
using salini.api.Application.Features.Accessories.Queries.GetAccessoryById;

namespace salini.api.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AccessoriesController : ControllerBase
{
    private readonly IMediator _mediator;

    public AccessoriesController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>
    /// Get all accessories with pagination and filtering
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<PaginatedResult<AccessoryListDto>>> GetAccessories(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? searchTerm = null,
        [FromQuery] string? status = null,
        [FromQuery] string? assignedTo = null,
        [FromQuery] string? sortBy = null,
        [FromQuery] bool sortDescending = false)
    {
        var query = new GetAccessoriesQuery
        {
            PageNumber = pageNumber,
            PageSize = pageSize,
            SearchTerm = searchTerm,
            Status = status,
            AssignedTo = assignedTo,
            SortBy = sortBy,
            SortDescending = sortDescending
        };

        var result = await _mediator.Send(query);
        return Ok(result);
    }

    /// <summary>
    /// Get an accessory by ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<AccessoryDto>> GetAccessory(string id)
    {
        var query = new GetAccessoryByIdQuery(id);
        var result = await _mediator.Send(query);

        if (result == null)
            return NotFound();

        return Ok(result);
    }

    /// <summary>
    /// Create a new accessory
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<AccessoryDto>> CreateAccessory([FromBody] AccessoryCreateDto createDto)
    {
        var command = new CreateAccessoryCommand
        {
            Name = createDto.Name,
            Description = createDto.Description,
            Status = Enum.Parse<salini.api.Domain.Enums.Status>(createDto.Status, true)
        };

        var result = await _mediator.Send(command);
        return CreatedAtAction(nameof(GetAccessory), new { id = result.Id }, result);
    }

    /// <summary>
    /// Update an existing accessory
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<AccessoryDto>> UpdateAccessory(string id, [FromBody] AccessoryUpdateDto updateDto)
    {
        if (id != updateDto.Id)
            return BadRequest("ID mismatch");

        var command = new UpdateAccessoryCommand
        {
            Id = updateDto.Id,
            Name = updateDto.Name,
            Description = updateDto.Description,
            Status = Enum.Parse<salini.api.Domain.Enums.Status>(updateDto.Status, true)
        };

        var result = await _mediator.Send(command);
        return Ok(result);
    }

    /// <summary>
    /// Delete an accessory
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteAccessory(string id)
    {
        var command = new DeleteAccessoryCommand(id);
        await _mediator.Send(command);
        return NoContent();
    }

    /// <summary>
    /// Assign an accessory to an employee
    /// </summary>
    [HttpPost("{id}/assign")]
    public async Task<ActionResult> AssignAccessory(string id, [FromBody] AccessoryAssignmentDto assignmentDto)
    {
        var command = new AssignAccessoryCommand
        {
            AccessoryId = id,
            EmployeeId = assignmentDto.EmployeeId,
            Quantity = assignmentDto.Quantity ?? 1,
            Notes = assignmentDto.Notes
        };

        await _mediator.Send(command);
        return Ok();
    }

    /// <summary>
    /// Unassign an accessory from an employee
    /// </summary>
    [HttpPost("{id}/unassign")]
    public async Task<ActionResult> UnassignAccessory(string id, [FromBody] AccessoryUnassignmentDto unassignmentDto)
    {
        var command = new UnassignAccessoryCommand
        {
            AccessoryId = id,
            EmployeeId = unassignmentDto.EmployeeId,
            Quantity = unassignmentDto.Quantity,
            Notes = unassignmentDto.Notes
        };

        await _mediator.Send(command);
        return Ok();
    }
}
