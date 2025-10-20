using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using salini.api.Application.DTOs;
using salini.api.Application.DTOs.SimProvider;
using salini.api.Application.Features.SimProviders.Commands.CreateSimProvider;
using salini.api.Application.Features.SimProviders.Commands.DeleteSimProvider;
using salini.api.Application.Features.SimProviders.Commands.UpdateSimProvider;
using salini.api.Application.Features.SimProviders.Queries.GetSimProviders;
using salini.api.Application.Features.SimProviders.Queries.GetSimProviderById;

namespace salini.api.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SimProvidersController : ControllerBase
{
    private readonly IMediator _mediator;

    public SimProvidersController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<ActionResult<PaginatedResult<SimProviderListDto>>> GetSimProviders(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? searchTerm = null,
        [FromQuery] bool? isActive = null,
        [FromQuery] string? sortBy = null,
        [FromQuery] bool sortDescending = false)
    {
        var query = new GetSimProvidersQuery
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
    public async Task<ActionResult<SimProviderDto>> GetSimProvider(string id)
    {
        var query = new GetSimProviderByIdQuery(id);
        var result = await _mediator.Send(query);

        if (result == null)
            return NotFound();

        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<SimProviderDto>> CreateSimProvider([FromBody] SimProviderCreateDto createDto)
    {
        var command = new CreateSimProviderCommand
        {
            Name = createDto.Name,
            Description = createDto.Description,
            ContactInfo = createDto.ContactInfo,
            IsActive = createDto.IsActive
        };

        var result = await _mediator.Send(command);
        return CreatedAtAction(nameof(GetSimProvider), new { id = result.Id }, result);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<SimProviderDto>> UpdateSimProvider(string id, [FromBody] SimProviderUpdateDto updateDto)
    {
        if (id != updateDto.Id)
            return BadRequest("ID mismatch");

        var command = new UpdateSimProviderCommand
        {
            Id = updateDto.Id,
            Name = updateDto.Name,
            Description = updateDto.Description,
            ContactInfo = updateDto.ContactInfo,
            IsActive = updateDto.IsActive
        };

        var result = await _mediator.Send(command);
        return Ok(result);
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteSimProvider(string id)
    {
        var command = new DeleteSimProviderCommand(id);
        await _mediator.Send(command);
        return NoContent();
    }
}
