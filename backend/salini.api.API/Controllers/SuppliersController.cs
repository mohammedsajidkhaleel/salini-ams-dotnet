using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using salini.api.Application.DTOs;
using salini.api.Application.DTOs.Supplier;
using salini.api.Application.Features.Suppliers.Commands.CreateSupplier;
using salini.api.Application.Features.Suppliers.Commands.DeleteSupplier;
using salini.api.Application.Features.Suppliers.Commands.UpdateSupplier;
using salini.api.Application.Features.Suppliers.Queries.GetSuppliers;
using salini.api.Application.Features.Suppliers.Queries.GetSupplierById;

namespace salini.api.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SuppliersController : ControllerBase
{
    private readonly IMediator _mediator;

    public SuppliersController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<ActionResult<PaginatedResult<SupplierListDto>>> GetSuppliers(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? searchTerm = null,
        [FromQuery] string? status = null,
        [FromQuery] string? sortBy = null,
        [FromQuery] bool sortDescending = false)
    {
        var query = new GetSuppliersQuery
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
    public async Task<ActionResult<SupplierDto>> GetSupplier(string id)
    {
        var query = new GetSupplierByIdQuery(id);
        var result = await _mediator.Send(query);

        if (result == null)
            return NotFound();

        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<SupplierDto>> CreateSupplier([FromBody] SupplierCreateDto createDto)
    {
        var command = new CreateSupplierCommand
        {
            Name = createDto.Name,
            ContactPerson = createDto.ContactPerson,
            Email = createDto.Email,
            Phone = createDto.Phone,
            Address = createDto.Address,
            Status = Enum.Parse<salini.api.Domain.Enums.Status>(createDto.Status, true)
        };

        var result = await _mediator.Send(command);
        return CreatedAtAction(nameof(GetSupplier), new { id = result.Id }, result);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<SupplierDto>> UpdateSupplier(string id, [FromBody] SupplierUpdateDto updateDto)
    {
        if (id != updateDto.Id)
            return BadRequest("ID mismatch");

        var command = new UpdateSupplierCommand
        {
            Id = updateDto.Id,
            Name = updateDto.Name,
            ContactPerson = updateDto.ContactPerson,
            Email = updateDto.Email,
            Phone = updateDto.Phone,
            Address = updateDto.Address,
            Status = Enum.Parse<salini.api.Domain.Enums.Status>(updateDto.Status, true)
        };

        var result = await _mediator.Send(command);
        return Ok(result);
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteSupplier(string id)
    {
        var command = new DeleteSupplierCommand(id);
        await _mediator.Send(command);
        return NoContent();
    }
}
