using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using salini.api.Application.DTOs;
using salini.api.Application.DTOs.SubDepartment;
using salini.api.Application.Features.SubDepartments.Commands.CreateSubDepartment;
using salini.api.Application.Features.SubDepartments.Commands.DeleteSubDepartment;
using salini.api.Application.Features.SubDepartments.Commands.UpdateSubDepartment;
using salini.api.Application.Features.SubDepartments.Queries.GetSubDepartments;
using salini.api.Application.Features.SubDepartments.Queries.GetSubDepartmentById;

namespace salini.api.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SubDepartmentsController : ControllerBase
{
    private readonly IMediator _mediator;

    public SubDepartmentsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>
    /// Get all sub-departments with pagination and filtering
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<PaginatedResult<SubDepartmentListDto>>> GetSubDepartments(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? searchTerm = null,
        [FromQuery] string? status = null,
        [FromQuery] string? departmentId = null,
        [FromQuery] string? sortBy = null,
        [FromQuery] bool sortDescending = false)
    {
        var query = new GetSubDepartmentsQuery
        {
            PageNumber = pageNumber,
            PageSize = pageSize,
            SearchTerm = searchTerm,
            Status = status,
            DepartmentId = departmentId,
            SortBy = sortBy,
            SortDescending = sortDescending
        };

        var result = await _mediator.Send(query);
        return Ok(result);
    }

    /// <summary>
    /// Get a sub-department by ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<SubDepartmentDto>> GetSubDepartment(string id)
    {
        var query = new GetSubDepartmentByIdQuery(id);
        var result = await _mediator.Send(query);

        if (result == null)
            return NotFound();

        return Ok(result);
    }

    /// <summary>
    /// Create a new sub-department
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<SubDepartmentDto>> CreateSubDepartment([FromBody] SubDepartmentCreateDto createDto)
    {
        var command = new CreateSubDepartmentCommand
        {
            Name = createDto.Name,
            Description = createDto.Description,
            Status = Enum.Parse<salini.api.Domain.Enums.Status>(createDto.Status, true),
            DepartmentId = createDto.DepartmentId
        };

        var result = await _mediator.Send(command);
        return CreatedAtAction(nameof(GetSubDepartment), new { id = result.Id }, result);
    }

    /// <summary>
    /// Update an existing sub-department
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<SubDepartmentDto>> UpdateSubDepartment(string id, [FromBody] SubDepartmentUpdateDto updateDto)
    {
        if (id != updateDto.Id)
            return BadRequest("ID mismatch");

        var command = new UpdateSubDepartmentCommand
        {
            Id = updateDto.Id,
            Name = updateDto.Name,
            Description = updateDto.Description,
            Status = Enum.Parse<salini.api.Domain.Enums.Status>(updateDto.Status, true),
            DepartmentId = updateDto.DepartmentId
        };

        var result = await _mediator.Send(command);
        return Ok(result);
    }

    /// <summary>
    /// Delete a sub-department
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteSubDepartment(string id)
    {
        var command = new DeleteSubDepartmentCommand(id);
        await _mediator.Send(command);
        return NoContent();
    }
}
