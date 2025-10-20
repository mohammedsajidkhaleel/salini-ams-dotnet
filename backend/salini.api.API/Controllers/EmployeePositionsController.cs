using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using salini.api.Application.DTOs;
using salini.api.Application.DTOs.EmployeePosition;
using salini.api.Application.Features.EmployeePositions.Commands.CreateEmployeePosition;
using salini.api.Application.Features.EmployeePositions.Commands.DeleteEmployeePosition;
using salini.api.Application.Features.EmployeePositions.Commands.UpdateEmployeePosition;
using salini.api.Application.Features.EmployeePositions.Queries.GetEmployeePositions;
using salini.api.Application.Features.EmployeePositions.Queries.GetEmployeePositionById;

namespace salini.api.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class EmployeePositionsController : ControllerBase
{
    private readonly IMediator _mediator;

    public EmployeePositionsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<ActionResult<PaginatedResult<EmployeePositionListDto>>> GetEmployeePositions(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? searchTerm = null,
        [FromQuery] string? status = null,
        [FromQuery] string? sortBy = null,
        [FromQuery] bool sortDescending = false)
    {
        var query = new GetEmployeePositionsQuery
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

    [HttpGet("{id}")]
    public async Task<ActionResult<EmployeePositionDto>> GetEmployeePosition(string id)
    {
        var query = new GetEmployeePositionByIdQuery(id);
        var result = await _mediator.Send(query);

        if (result == null)
            return NotFound();

        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<EmployeePositionDto>> CreateEmployeePosition([FromBody] EmployeePositionCreateDto createDto)
    {
        var command = new CreateEmployeePositionCommand
        {
            Name = createDto.Name,
            Description = createDto.Description,
            Status = Enum.Parse<salini.api.Domain.Enums.Status>(createDto.Status, true)
        };

        var result = await _mediator.Send(command);
        return CreatedAtAction(nameof(GetEmployeePosition), new { id = result.Id }, result);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<EmployeePositionDto>> UpdateEmployeePosition(string id, [FromBody] EmployeePositionUpdateDto updateDto)
    {
        if (id != updateDto.Id)
            return BadRequest("ID mismatch");

        var command = new UpdateEmployeePositionCommand
        {
            Id = updateDto.Id,
            Name = updateDto.Name,
            Description = updateDto.Description,
            Status = Enum.Parse<salini.api.Domain.Enums.Status>(updateDto.Status, true)
        };

        var result = await _mediator.Send(command);
        return Ok(result);
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteEmployeePosition(string id)
    {
        var command = new DeleteEmployeePositionCommand(id);
        await _mediator.Send(command);
        return NoContent();
    }
}
