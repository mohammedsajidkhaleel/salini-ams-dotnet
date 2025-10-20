using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using salini.api.Application.DTOs;
using salini.api.Application.DTOs.Item;
using salini.api.Application.Features.Items.Commands.CreateItem;
using salini.api.Application.Features.Items.Commands.DeleteItem;
using salini.api.Application.Features.Items.Commands.UpdateItem;
using salini.api.Application.Features.Items.Queries.GetItems;
using salini.api.Application.Features.Items.Queries.GetItemById;

namespace salini.api.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ItemsController : ControllerBase
{
    private readonly IMediator _mediator;

    public ItemsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>
    /// Get all items with pagination and filtering
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<PaginatedResult<ItemListDto>>> GetItems(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? searchTerm = null,
        [FromQuery] string? status = null,
        [FromQuery] string? itemCategoryId = null,
        [FromQuery] string? sortBy = null,
        [FromQuery] bool sortDescending = false)
    {
        var query = new GetItemsQuery
        {
            PageNumber = pageNumber,
            PageSize = pageSize,
            SearchTerm = searchTerm,
            Status = status,
            ItemCategoryId = itemCategoryId,
            SortBy = sortBy,
            SortDescending = sortDescending
        };

        var result = await _mediator.Send(query);
        return Ok(result);
    }

    /// <summary>
    /// Get an item by ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<ItemDto>> GetItem(string id)
    {
        var query = new GetItemByIdQuery(id);
        var result = await _mediator.Send(query);

        if (result == null)
            return NotFound();

        return Ok(result);
    }

    /// <summary>
    /// Create a new item
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<ItemDto>> CreateItem([FromBody] ItemCreateDto createDto)
    {
        var command = new CreateItemCommand
        {
            Name = createDto.Name,
            Description = createDto.Description,
            Status = Enum.Parse<salini.api.Domain.Enums.Status>(createDto.Status, true),
            ItemCategoryId = createDto.ItemCategoryId
        };

        var result = await _mediator.Send(command);
        return CreatedAtAction(nameof(GetItem), new { id = result.Id }, result);
    }

    /// <summary>
    /// Update an existing item
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<ItemDto>> UpdateItem(string id, [FromBody] ItemUpdateDto updateDto)
    {
        if (id != updateDto.Id)
            return BadRequest("ID mismatch");

        var command = new UpdateItemCommand
        {
            Id = updateDto.Id,
            Name = updateDto.Name,
            Description = updateDto.Description,
            Status = Enum.Parse<salini.api.Domain.Enums.Status>(updateDto.Status, true),
            ItemCategoryId = updateDto.ItemCategoryId
        };

        var result = await _mediator.Send(command);
        return Ok(result);
    }

    /// <summary>
    /// Delete an item
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteItem(string id)
    {
        var command = new DeleteItemCommand(id);
        await _mediator.Send(command);
        return NoContent();
    }
}
