using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using salini.api.Application.DTOs;
using salini.api.Application.DTOs.ItemConfiguration;
using salini.api.Application.Features.ItemConfigurations.Commands.CreateItemConfiguration;
using salini.api.Application.Features.ItemConfigurations.Commands.DeleteItemConfiguration;
using salini.api.Application.Features.ItemConfigurations.Commands.UpdateItemConfiguration;
using salini.api.Application.Features.ItemConfigurations.Queries.GetItemConfigurationById;
using salini.api.Application.Features.ItemConfigurations.Queries.GetItemConfigurations;

namespace salini.api.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ItemConfigurationsController : ControllerBase
{
    private readonly IMediator _mediator;

    public ItemConfigurationsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<ActionResult<PaginatedResult<ItemConfigurationListDto>>> GetItemConfigurations(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? searchTerm = null,
        [FromQuery] bool? isActive = null,
        [FromQuery] string? sortBy = null,
        [FromQuery] bool sortDescending = false)
    {
        var query = new GetItemConfigurationsQuery
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
    public async Task<ActionResult<ItemConfigurationDto>> GetItemConfiguration(string id)
    {
        var query = new GetItemConfigurationByIdQuery(id);
        var result = await _mediator.Send(query);

        if (result == null)
            return NotFound();

        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<ItemConfigurationDto>> CreateItemConfiguration([FromBody] ItemConfigurationCreateDto createDto)
    {
        var command = new CreateItemConfigurationCommand
        {
            ItemTypeId = createDto.ItemTypeId,
            Specification = createDto.Specification,
            ProcessorId = createDto.ProcessorId,
            ConfigurationText = createDto.ConfigurationText,
            IsActive = createDto.IsActive
        };

        var result = await _mediator.Send(command);
        return CreatedAtAction(nameof(GetItemConfiguration), new { id = result.Id }, result);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ItemConfigurationDto>> UpdateItemConfiguration(string id, [FromBody] ItemConfigurationUpdateDto updateDto)
    {
        if (id != updateDto.Id)
            return BadRequest("ID mismatch");

        var command = new UpdateItemConfigurationCommand
        {
            Id = updateDto.Id,
            ItemTypeId = updateDto.ItemTypeId,
            Specification = updateDto.Specification,
            ProcessorId = updateDto.ProcessorId,
            ConfigurationText = updateDto.ConfigurationText,
            IsActive = updateDto.IsActive
        };

        var result = await _mediator.Send(command);
        return Ok(result);
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteItemConfiguration(string id)
    {
        var command = new DeleteItemConfigurationCommand(id);
        await _mediator.Send(command);
        return NoContent();
    }
}
