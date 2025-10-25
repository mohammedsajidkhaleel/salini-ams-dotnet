using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using salini.api.Application.Common.Interfaces;
using salini.api.Application.DTOs;
using salini.api.Application.DTOs.Project;
using salini.api.Application.Features.Projects.Commands.CreateProject;
using salini.api.Application.Features.Projects.Commands.UpdateProject;
using salini.api.Application.Features.Projects.Commands.DeleteProject;
using salini.api.Application.Features.Projects.Queries.GetProjects;
using salini.api.Domain.Entities;

namespace salini.api.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProjectsController : BaseController
{
    private readonly IMediator _mediator;

    public ProjectsController(IMediator mediator, UserManager<ApplicationUser> userManager, IApplicationDbContext context)
        : base(userManager, context)
    {
        _mediator = mediator;
    }

    /// <summary>
    /// Get all projects with pagination and filtering
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<PaginatedResult<ProjectListDto>>> GetProjects(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? searchTerm = null,
        [FromQuery] string? sortBy = null,
        [FromQuery] bool sortDescending = false,
        [FromQuery] string? companyId = null,
        [FromQuery] string? status = null)
    {
        // Get user's project filter
        var userProjectIds = await GetProjectFilterAsync();
        
        Console.WriteLine($"🔍 ProjectsController - GetProjectFilterAsync returned: {(userProjectIds == null ? "null" : $"List with {userProjectIds.Count} items: {string.Join(", ", userProjectIds)}")}");
        
        var query = new GetProjectsQuery
        {
            PageNumber = pageNumber,
            PageSize = pageSize,
            SearchTerm = searchTerm,
            SortBy = sortBy,
            SortDescending = sortDescending,
            CompanyId = companyId,
            Status = status,
            UserProjectIds = userProjectIds // Pass user's project filter to the query
        };

        var result = await _mediator.Send(query);
        return Ok(result);
    }

    /// <summary>
    /// Create a new project
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<ProjectDto>> CreateProject([FromBody] ProjectCreateDto createDto)
    {
        var command = new CreateProjectCommand
        {
            Code = createDto.Code,
            Name = createDto.Name,
            Description = createDto.Description,
            Status = createDto.Status,
            CompanyId = createDto.CompanyId,
            CostCenterId = createDto.CostCenterId,
            NationalityId = createDto.NationalityId
        };

        var result = await _mediator.Send(command);
        return CreatedAtAction(nameof(GetProjects), new { id = result.Id }, result);
    }

    /// <summary>
    /// Update an existing project
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<ProjectDto>> UpdateProject(string id, [FromBody] ProjectUpdateDto updateDto)
    {
        if (id != updateDto.Id)
        {
            return BadRequest("ID mismatch between URL and request body");
        }

        var command = new UpdateProjectCommand
        {
            Id = updateDto.Id,
            Code = updateDto.Code,
            Name = updateDto.Name,
            Description = updateDto.Description,
            Status = updateDto.Status,
            CompanyId = updateDto.CompanyId,
            CostCenterId = updateDto.CostCenterId,
            NationalityId = updateDto.NationalityId
        };

        var result = await _mediator.Send(command);
        return Ok(result);
    }

    /// <summary>
    /// Delete a project
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteProject(string id)
    {
        var command = new DeleteProjectCommand(id);
        await _mediator.Send(command);
        return NoContent();
    }
}

public class ProjectCreateDto
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public salini.api.Domain.Enums.Status Status { get; set; } = salini.api.Domain.Enums.Status.Active;
    public string CompanyId { get; set; } = string.Empty;
    public string? CostCenterId { get; set; }
    public string? NationalityId { get; set; }
}

public class ProjectUpdateDto
{
    public string Id { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public salini.api.Domain.Enums.Status Status { get; set; } = salini.api.Domain.Enums.Status.Active;
    public string CompanyId { get; set; } = string.Empty;
    public string? CostCenterId { get; set; }
    public string? NationalityId { get; set; }
}
