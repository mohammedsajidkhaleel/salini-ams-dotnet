using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using salini.api.Application.DTOs;
using salini.api.Application.DTOs.SimType;
using salini.api.Application.Features.SimTypes.Commands.CreateSimType;
using salini.api.Application.Features.SimTypes.Commands.DeleteSimType;
using salini.api.Application.Features.SimTypes.Commands.UpdateSimType;
using salini.api.Application.Features.SimTypes.Queries.GetSimTypes;
using salini.api.Application.Features.SimTypes.Queries.GetSimTypeById;

namespace salini.api.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SimTypesController : ControllerBase
{
    private readonly IMediator _mediator;

    public SimTypesController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<ActionResult<PaginatedResult<SimTypeListDto>>> GetSimTypes(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? searchTerm = null,
        [FromQuery] bool? isActive = null,
        [FromQuery] string? sortBy = null,
        [FromQuery] bool sortDescending = false)
    {
        var query = new GetSimTypesQuery
        {
            PageNumber = pageNumber,
            PageSize = pageSize,
            SearchTerm = searchTerm,
            IsActive = isActive,
            SortBy = sortBy,
            SortDescending = sortDescending
        };

        var result = await _mediator.Send(query);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<SimTypeDto>> GetSimType(string id)
    {
        var query = new GetSimTypeByIdQuery(id);
        var result = await _mediator.Send(query);

        if (result == null)
            return NotFound();

        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<SimTypeDto>> CreateSimType([FromBody] SimTypeCreateDto createDto)
    {
        var command = new CreateSimTypeCommand
        {
            Name = createDto.Name,
            Description = createDto.Description,
            IsActive = createDto.IsActive
        };

        var result = await _mediator.Send(command);
        return CreatedAtAction(nameof(GetSimType), new { id = result.Id }, result);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<SimTypeDto>> UpdateSimType(string id, [FromBody] SimTypeUpdateDto updateDto)
    {
        if (id != updateDto.Id)
            return BadRequest("ID mismatch");

        var command = new UpdateSimTypeCommand
        {
            Id = updateDto.Id,
            Name = updateDto.Name,
            Description = updateDto.Description,
            IsActive = updateDto.IsActive
        };

        var result = await _mediator.Send(command);
        return Ok(result);
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteSimType(string id)
    {
        var command = new DeleteSimTypeCommand(id);
        await _mediator.Send(command);
        return NoContent();
    }
}
