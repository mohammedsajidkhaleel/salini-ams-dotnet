using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using salini.api.Application.DTOs;
using salini.api.Application.DTOs.CostCenter;
using salini.api.Application.Features.CostCenters.Commands.CreateCostCenter;
using salini.api.Application.Features.CostCenters.Commands.DeleteCostCenter;
using salini.api.Application.Features.CostCenters.Commands.UpdateCostCenter;
using salini.api.Application.Features.CostCenters.Queries.GetCostCenters;
using salini.api.Application.Features.CostCenters.Queries.GetCostCenterById;

namespace salini.api.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CostCentersController : ControllerBase
{
    private readonly IMediator _mediator;

    public CostCentersController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>
    /// Get all cost centers with pagination and filtering
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<PaginatedResult<CostCenterListDto>>> GetCostCenters(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? searchTerm = null,
        [FromQuery] string? status = null,
        [FromQuery] string? sortBy = null,
        [FromQuery] bool sortDescending = false)
    {
        var query = new GetCostCentersQuery
        {
            PageNumber = pageNumber,
            PageSize = pageSize,
            SearchTerm = searchTerm,
            Status = status,
            SortBy = sortBy,
            SortDescending = sortDescending
        };

        var result = await _mediator.Send(query);
        return Ok(result);
    }

    /// <summary>
    /// Get a cost center by ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<CostCenterDto>> GetCostCenter(string id)
    {
        var query = new GetCostCenterByIdQuery(id);
        var result = await _mediator.Send(query);

        if (result == null)
            return NotFound();

        return Ok(result);
    }

    /// <summary>
    /// Create a new cost center
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<CostCenterDto>> CreateCostCenter([FromBody] CostCenterCreateDto createDto)
    {
        var command = new CreateCostCenterCommand
        {
            Code = createDto.Code,
            Name = createDto.Name,
            Description = createDto.Description,
            Status = Enum.Parse<salini.api.Domain.Enums.Status>(createDto.Status, true)
        };

        var result = await _mediator.Send(command);
        return CreatedAtAction(nameof(GetCostCenter), new { id = result.Id }, result);
    }

    /// <summary>
    /// Update an existing cost center
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<CostCenterDto>> UpdateCostCenter(string id, [FromBody] CostCenterUpdateDto updateDto)
    {
        if (id != updateDto.Id)
            return BadRequest("ID mismatch");

        var command = new UpdateCostCenterCommand
        {
            Id = updateDto.Id,
            Code = updateDto.Code,
            Name = updateDto.Name,
            Description = updateDto.Description,
            Status = Enum.Parse<salini.api.Domain.Enums.Status>(updateDto.Status, true)
        };

        var result = await _mediator.Send(command);
        return Ok(result);
    }

    /// <summary>
    /// Delete a cost center
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteCostCenter(string id)
    {
        var command = new DeleteCostCenterCommand(id);
        await _mediator.Send(command);
        return NoContent();
    }
}
