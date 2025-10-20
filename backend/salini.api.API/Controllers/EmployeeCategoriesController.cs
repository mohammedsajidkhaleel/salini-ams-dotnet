using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using salini.api.Application.DTOs;
using salini.api.Application.DTOs.EmployeeCategory;
using salini.api.Application.Features.EmployeeCategories.Commands.CreateEmployeeCategory;
using salini.api.Application.Features.EmployeeCategories.Commands.DeleteEmployeeCategory;
using salini.api.Application.Features.EmployeeCategories.Commands.UpdateEmployeeCategory;
using salini.api.Application.Features.EmployeeCategories.Queries.GetEmployeeCategories;
using salini.api.Application.Features.EmployeeCategories.Queries.GetEmployeeCategoryById;

namespace salini.api.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class EmployeeCategoriesController : ControllerBase
{
    private readonly IMediator _mediator;

    public EmployeeCategoriesController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<ActionResult<PaginatedResult<EmployeeCategoryListDto>>> GetEmployeeCategories(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? searchTerm = null,
        [FromQuery] string? status = null,
        [FromQuery] string? sortBy = null,
        [FromQuery] bool sortDescending = false)
    {
        var query = new GetEmployeeCategoriesQuery
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
    public async Task<ActionResult<EmployeeCategoryDto>> GetEmployeeCategory(string id)
    {
        var query = new GetEmployeeCategoryByIdQuery(id);
        var result = await _mediator.Send(query);

        if (result == null)
            return NotFound();

        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<EmployeeCategoryDto>> CreateEmployeeCategory([FromBody] EmployeeCategoryCreateDto createDto)
    {
        var command = new CreateEmployeeCategoryCommand
        {
            Name = createDto.Name,
            Description = createDto.Description,
            Status = Enum.Parse<salini.api.Domain.Enums.Status>(createDto.Status, true)
        };

        var result = await _mediator.Send(command);
        return CreatedAtAction(nameof(GetEmployeeCategory), new { id = result.Id }, result);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<EmployeeCategoryDto>> UpdateEmployeeCategory(string id, [FromBody] EmployeeCategoryUpdateDto updateDto)
    {
        if (id != updateDto.Id)
            return BadRequest("ID mismatch");

        var command = new UpdateEmployeeCategoryCommand
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
    public async Task<ActionResult> DeleteEmployeeCategory(string id)
    {
        var command = new DeleteEmployeeCategoryCommand(id);
        await _mediator.Send(command);
        return NoContent();
    }
}