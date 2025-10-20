using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using salini.api.Application.DTOs;
using salini.api.Application.DTOs.ItemCategory;
using salini.api.Application.Features.ItemCategories.Commands.CreateItemCategory;
using salini.api.Application.Features.ItemCategories.Commands.DeleteItemCategory;
using salini.api.Application.Features.ItemCategories.Commands.UpdateItemCategory;
using salini.api.Application.Features.ItemCategories.Queries.GetItemCategories;
using salini.api.Application.Features.ItemCategories.Queries.GetItemCategoryById;

namespace salini.api.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ItemCategoriesController : ControllerBase
{
    private readonly IMediator _mediator;

    public ItemCategoriesController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<ActionResult<PaginatedResult<ItemCategoryListDto>>> GetItemCategories(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? searchTerm = null,
        [FromQuery] string? status = null,
        [FromQuery] string? sortBy = null,
        [FromQuery] bool sortDescending = false)
    {
        var query = new GetItemCategoriesQuery
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
    public async Task<ActionResult<ItemCategoryDto>> GetItemCategory(string id)
    {
        var query = new GetItemCategoryByIdQuery(id);
        var result = await _mediator.Send(query);

        if (result == null)
            return NotFound();

        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<ItemCategoryDto>> CreateItemCategory([FromBody] ItemCategoryCreateDto createDto)
    {
        var command = new CreateItemCategoryCommand
        {
            Name = createDto.Name,
            Description = createDto.Description,
            Status = Enum.Parse<salini.api.Domain.Enums.Status>(createDto.Status, true)
        };

        var result = await _mediator.Send(command);
        return CreatedAtAction(nameof(GetItemCategory), new { id = result.Id }, result);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ItemCategoryDto>> UpdateItemCategory(string id, [FromBody] ItemCategoryUpdateDto updateDto)
    {
        if (id != updateDto.Id)
            return BadRequest("ID mismatch");

        var command = new UpdateItemCategoryCommand
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
    public async Task<ActionResult> DeleteItemCategory(string id)
    {
        var command = new DeleteItemCategoryCommand(id);
        await _mediator.Send(command);
        return NoContent();
    }
}