using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using salini.api.Application.Common.Helpers;
using salini.api.Application.Common.Interfaces;
using salini.api.Application.DTOs;
using salini.api.Application.DTOs.Employee;
using salini.api.Application.Features.Employees.Commands.CreateEmployee;
using salini.api.Application.Features.Employees.Commands.DeleteEmployee;
using salini.api.Application.Features.Employees.Commands.UpdateEmployee;
using salini.api.Application.Features.Employees.Commands.ImportEmployees;
using salini.api.Application.Features.Employees.Queries.GetEmployees;
using salini.api.Application.Features.Employees.Queries.GetEmployeeById;
using salini.api.Application.Features.Employees.Queries.GetEmployeeReport;
using salini.api.Application.Features.Employees.Queries.ExportEmployees;
using salini.api.Application.Services;
using salini.api.Domain.Entities;
using salini.api.Domain.Enums;
using System.Security.Claims;

namespace salini.api.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class EmployeesController : BaseController
{
    private readonly IMediator _mediator;
    private readonly IUserPermissionService _userPermissionService;

    public EmployeesController(IMediator mediator, UserManager<ApplicationUser> userManager, IApplicationDbContext context, IUserPermissionService userPermissionService)
        : base(userManager, context)
    {
        _mediator = mediator;
        _userPermissionService = userPermissionService;
    }

    /// <summary>
    /// Get all employees with pagination and filtering
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<PaginatedResult<EmployeeListDto>>> GetEmployees(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? searchTerm = null,
        [FromQuery] string? departmentId = null,
        [FromQuery] string? projectId = null,
        [FromQuery] string? companyId = null,
        [FromQuery] int? status = null,
        [FromQuery] string? sortBy = null,
        [FromQuery] bool sortDescending = false)
    {
        // Get user's project filter
        var userProjectIds = await GetProjectFilterAsync();

        // If user has project restrictions and no specific projectId is requested, use user's projects
        if (userProjectIds != null && string.IsNullOrEmpty(projectId))
        {
            // For now, we'll use the first project ID if user has multiple projects
            if (userProjectIds.Count > 0)
            {
                projectId = userProjectIds[0];
            }
            else
            {
                // User has no assigned projects, return empty result
                return Ok(new PaginatedResult<EmployeeListDto>
                {
                    Items = new List<EmployeeListDto>(),
                    TotalCount = 0,
                    PageNumber = pageNumber,
                    PageSize = pageSize
                });
            }
        }
        // If user requested a specific projectId, check if they have access to it
        else if (userProjectIds != null && !string.IsNullOrEmpty(projectId) && !userProjectIds.Contains(projectId))
        {
            return Forbid("You don't have access to this project's employees.");
        }

        var query = new GetEmployeesQuery
        {
            PageNumber = pageNumber,
            PageSize = pageSize,
            SearchTerm = searchTerm,
            DepartmentId = departmentId,
            ProjectId = projectId,
            CompanyId = companyId,
            Status = status.HasValue ? (salini.api.Domain.Enums.Status)status.Value : null,
            SortBy = sortBy,
            SortDescending = sortDescending
        };

        var result = await _mediator.Send(query);
        return Ok(result);
    }

    /// <summary>
    /// Get employee by ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<EmployeeDto>> GetEmployee(string id)
    {
        var query = new GetEmployeeByIdQuery(id);
        var result = await _mediator.Send(query);

        if (result == null)
            return NotFound();

        return Ok(result);
    }

    /// <summary>
    /// Get comprehensive employee report data including all assigned items
    /// </summary>
    [HttpGet("{id}/report")]
    public async Task<ActionResult<EmployeeReportDto>> GetEmployeeReport(string id)
    {
        var query = new GetEmployeeReportQuery(id);
        var result = await _mediator.Send(query);

        return Ok(result);
    }

    /// <summary>
    /// Create a new employee
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<EmployeeDto>> CreateEmployee([FromBody] EmployeeCreateDto createDto)
    {
        var command = new CreateEmployeeCommand
        {
            EmployeeId = createDto.EmployeeId,
            FirstName = createDto.FirstName,
            LastName = createDto.LastName,
            Email = createDto.Email,
            Phone = createDto.Phone,
            Status = createDto.Status,
            NationalityId = createDto.NationalityId,
            EmployeeCategoryId = createDto.EmployeeCategoryId,
            EmployeePositionId = createDto.EmployeePositionId,
            DepartmentId = createDto.DepartmentId,
            SubDepartmentId = createDto.SubDepartmentId,
            ProjectId = createDto.ProjectId,
            CompanyId = createDto.CompanyId,
            CostCenterId = createDto.CostCenterId
        };

        var result = await _mediator.Send(command);
        return CreatedAtAction(nameof(GetEmployee), new { id = result.Id }, result);
    }

    /// <summary>
    /// Update an existing employee
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<EmployeeDto>> UpdateEmployee(string id, [FromBody] EmployeeUpdateDto updateDto)
    {
        var command = new UpdateEmployeeCommand
        {
            Id = id,
            EmployeeId = updateDto.EmployeeId,
            FirstName = updateDto.FirstName,
            LastName = updateDto.LastName,
            Email = updateDto.Email,
            Phone = updateDto.Phone,
            Status = updateDto.Status,
            NationalityId = updateDto.NationalityId,
            EmployeeCategoryId = updateDto.EmployeeCategoryId,
            EmployeePositionId = updateDto.EmployeePositionId,
            DepartmentId = updateDto.DepartmentId,
            SubDepartmentId = updateDto.SubDepartmentId,
            ProjectId = updateDto.ProjectId,
            CompanyId = updateDto.CompanyId,
            CostCenterId = updateDto.CostCenterId
        };

        var result = await _mediator.Send(command);
        return Ok(result);
    }

    /// <summary>
    /// Delete an employee
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteEmployee(string id)
    {
        var command = new DeleteEmployeeCommand(id);
        await _mediator.Send(command);
        return NoContent();
    }

    /// <summary>
    /// Import employees from CSV data
    /// </summary>
    [HttpPost("import")]
    public async Task<ActionResult<ImportEmployeesResult>> ImportEmployees([FromBody] List<EmployeeImportDto> employees)
    {
        // Check if user has import permission
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized("User not authenticated");
        }

        var hasPermission = await _userPermissionService.HasPermissionAsync(userId, UserPermissions.EmployeesImport);
        if (!hasPermission)
        {
            return Forbid("You do not have permission to import employees.");
        }

        var command = new ImportEmployeesCommand
        {
            Employees = employees
        };

        var result = await _mediator.Send(command);

        if (result.Success)
            return Ok(result);
        else
            return BadRequest(result);
    }

    /// <summary>
    /// Export employees to CSV
    /// </summary>
    [HttpGet("export")]
    public async Task<IActionResult> ExportEmployees(
        [FromQuery] string? searchTerm = null,
        [FromQuery] string? departmentId = null,
        [FromQuery] string? projectId = null,
        [FromQuery] string? companyId = null,
        [FromQuery] int? status = null,
        [FromQuery] string? sortBy = null,
        [FromQuery] bool sortDescending = false)
    {
        // Get user's project filter
        var userProjectIds = await GetProjectFilterAsync();
        var fileName = $"employees-{DateTime.UtcNow:yyyy-MM-dd}.csv";
        // If user has project restrictions and no specific projectId is requested, filter by user's projects
        if (userProjectIds != null && string.IsNullOrEmpty(projectId))
        {
            // User has project restrictions - will be filtered in the handler
            if (userProjectIds.Count == 0)
            {
                // User has no assigned projects, return empty CSV
                var emptyHeaders = new[] { "code", "name", "email", "mobile_number", "department", "sub_department", "position", "category", "joining_date", "nationality", "company", "project", "cost_center", "status" };
                var emptyCsv = CsvExportHelper.CreateCsvFile(emptyHeaders, new List<string[]>());
                return File(emptyCsv, "text/csv", fileName);
            }
        }
        // If user requested a specific projectId, check if they have access to it
        else if (userProjectIds != null && !string.IsNullOrEmpty(projectId) && !userProjectIds.Contains(projectId))
        {
            return Forbid("You don't have access to this project's employees.");
        }

        var query = new ExportEmployeesQuery
        {
            SearchTerm = searchTerm,
            DepartmentId = departmentId,
            ProjectId = projectId,
            CompanyId = companyId,
            Status = status.HasValue ? (salini.api.Domain.Enums.Status)status.Value : null,
            SortBy = sortBy,
            SortDescending = sortDescending,
            UserProjectIds = userProjectIds // Pass user's project filter to the query
        };

        var csvBytes = await _mediator.Send(query);
        return File(csvBytes, "text/csv", fileName);
    }
}
