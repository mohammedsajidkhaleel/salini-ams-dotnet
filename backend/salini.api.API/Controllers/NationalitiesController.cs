using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using salini.api.Application.DTOs;
using salini.api.Application.DTOs.Nationality;
using salini.api.Application.Features.Nationalities.Commands.CreateNationality;
using salini.api.Application.Features.Nationalities.Commands.DeleteNationality;
using salini.api.Application.Features.Nationalities.Commands.UpdateNationality;
using salini.api.Application.Features.Nationalities.Queries.GetNationalities;
using salini.api.Application.Features.Nationalities.Queries.GetNationalityById;

namespace salini.api.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NationalitiesController : ControllerBase
{
    private readonly IMediator _mediator;

    public NationalitiesController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<ActionResult<PaginatedResult<NationalityListDto>>> GetNationalities(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? searchTerm = null,
        [FromQuery] string? status = null,
        [FromQuery] string? sortBy = null,
        [FromQuery] bool sortDescending = false)
    {
        var query = new GetNationalitiesQuery
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
    public async Task<ActionResult<NationalityDto>> GetNationality(string id)
    {
        var query = new GetNationalityByIdQuery(id);
        var result = await _mediator.Send(query);

        if (result == null)
            return NotFound();

        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<NationalityDto>> CreateNationality([FromBody] NationalityCreateDto createDto)
    {
        var command = new CreateNationalityCommand
        {
            Name = createDto.Name,
            Description = createDto.Description,
            Status = Enum.Parse<salini.api.Domain.Enums.Status>(createDto.Status, true)
        };

        var result = await _mediator.Send(command);
        return CreatedAtAction(nameof(GetNationality), new { id = result.Id }, result);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<NationalityDto>> UpdateNationality(string id, [FromBody] NationalityUpdateDto updateDto)
    {
        if (id != updateDto.Id)
            return BadRequest("ID mismatch");

        var command = new UpdateNationalityCommand
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
    public async Task<ActionResult> DeleteNationality(string id)
    {
        var command = new DeleteNationalityCommand(id);
        await _mediator.Send(command);
        return NoContent();
    }
}