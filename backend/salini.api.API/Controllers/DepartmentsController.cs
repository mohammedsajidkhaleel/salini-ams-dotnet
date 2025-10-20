using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using salini.api.Application.DTOs;
using salini.api.Application.DTOs.Department;
using salini.api.Application.Features.Departments.Commands.CreateDepartment;
using salini.api.Application.Features.Departments.Commands.UpdateDepartment;
using salini.api.Application.Features.Departments.Commands.DeleteDepartment;
using salini.api.Application.Features.Departments.Queries.GetDepartments;
using salini.api.Application.Features.Departments.Queries.GetDepartmentById;

namespace salini.api.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DepartmentsController : ControllerBase
{
    private readonly IMediator _mediator;

    public DepartmentsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>
    /// Get all departments with pagination and filtering
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<PaginatedResult<DepartmentListDto>>> GetDepartments(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? searchTerm = null,
        [FromQuery] string? sortBy = null,
        [FromQuery] bool sortDescending = false)
    {
        var query = new GetDepartmentsQuery
        {
            PageNumber = pageNumber,
            PageSize = pageSize,
            SearchTerm = searchTerm,
            SortBy = sortBy,
            SortDescending = sortDescending
        };

        var result = await _mediator.Send(query);
        return Ok(result);
    }

    /// <summary>
    /// Create a new department
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<DepartmentDto>> CreateDepartment([FromBody] DepartmentCreateDto createDto)
    {
        var command = new CreateDepartmentCommand
        {
            Name = createDto.Name,
            Description = createDto.Description,
            Status = createDto.Status
        };

        var result = await _mediator.Send(command);
        return CreatedAtAction(nameof(GetDepartment), new { id = result.Id }, result);
    }

    /// <summary>
    /// Get a department by ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<DepartmentDto>> GetDepartment(string id)
    {
        var query = new GetDepartmentByIdQuery(id);
        var result = await _mediator.Send(query);

        if (result == null)
            return NotFound();

        return Ok(result);
    }

    /// <summary>
    /// Update an existing department
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<DepartmentDto>> UpdateDepartment(string id, [FromBody] DepartmentUpdateDto updateDto)
    {
        if (id != updateDto.Id)
            return BadRequest("ID mismatch");

        var command = new UpdateDepartmentCommand
        {
            Id = updateDto.Id,
            Name = updateDto.Name,
            Description = updateDto.Description,
            Status = Enum.Parse<salini.api.Domain.Enums.Status>(updateDto.Status, true)
        };

        var result = await _mediator.Send(command);
        return Ok(result);
    }

    /// <summary>
    /// Delete a department
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteDepartment(string id)
    {
        var command = new DeleteDepartmentCommand(id);
        await _mediator.Send(command);
        return NoContent();
    }
}

public class DepartmentCreateDto
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public salini.api.Domain.Enums.Status Status { get; set; } = salini.api.Domain.Enums.Status.Active;
}

public class DepartmentUpdateDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Status { get; set; } = "active";
}
