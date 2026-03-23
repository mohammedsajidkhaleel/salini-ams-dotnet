using MediatR;
using Microsoft.EntityFrameworkCore;
using salini.api.Application.Common.Helpers;
using salini.api.Application.Common.Interfaces;
using salini.api.Domain.Enums;

namespace salini.api.Application.Features.Employees.Queries.ExportEmployees;

public record ExportEmployeesQuery : IRequest<byte[]>
{
    public string? SearchTerm { get; init; }
    public string? DepartmentId { get; init; }
    public string? ProjectId { get; init; }
    public string? CompanyId { get; init; }
    public Status? Status { get; init; }
    public string? SortBy { get; init; }
    public bool SortDescending { get; init; } = false;
    public List<string>? UserProjectIds { get; init; } // User's allowed project IDs for permission filtering
}

public class ExportEmployeesQueryHandler : IRequestHandler<ExportEmployeesQuery, byte[]>
{
    private readonly IApplicationDbContext _context;

    public ExportEmployeesQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<byte[]> Handle(ExportEmployeesQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Employees
            .Include(e => e.Department)
            .Include(e => e.SubDepartment)
            .Include(e => e.Project)
            .Include(e => e.Company)
            .Include(e => e.EmployeePosition)
            .Include(e => e.EmployeeCategory)
            .Include(e => e.Nationality)
            .Include(e => e.CostCenter)
            .AsQueryable();

        // Apply project permission filtering - only include employees from user's allowed projects
        if (request.UserProjectIds != null && request.UserProjectIds.Count > 0)
        {
            // If a specific projectId is provided, it should already be validated in the controller
            // but we still filter to ensure only allowed projects are included
            if (!string.IsNullOrEmpty(request.ProjectId))
            {
                // If specific project is requested, ensure it's in user's allowed projects
                if (request.UserProjectIds.Contains(request.ProjectId))
                {
                    query = query.Where(e => e.ProjectId == request.ProjectId);
                }
                else
                {
                    // User doesn't have access to requested project, return empty result
                    query = query.Where(e => false); // This will return no results
                }
            }
            else
            {
                // No specific project requested, filter by all user's allowed projects
                query = query.Where(e => e.ProjectId != null && request.UserProjectIds.Contains(e.ProjectId));
            }
        }
        else if (request.UserProjectIds != null && request.UserProjectIds.Count == 0)
        {
            // User has no assigned projects, return empty result
            query = query.Where(e => false); // This will return no results
        }

        // Apply filters (same as GetEmployeesQuery)
        if (!string.IsNullOrEmpty(request.SearchTerm))
        {
            var searchTerm = request.SearchTerm.ToLower();
            query = query.Where(e =>
                e.EmployeeId.ToLower().Contains(searchTerm) ||
                e.FirstName.ToLower().Contains(searchTerm) ||
                e.LastName.ToLower().Contains(searchTerm) ||
                (e.Email != null && e.Email.ToLower().Contains(searchTerm)) ||
                (e.Phone != null && e.Phone.ToLower().Contains(searchTerm)));
        }

        if (!string.IsNullOrEmpty(request.DepartmentId))
        {
            query = query.Where(e => e.DepartmentId == request.DepartmentId);
        }

        if (!string.IsNullOrEmpty(request.ProjectId))
        {
            query = query.Where(e => e.ProjectId == request.ProjectId);
        }

        if (!string.IsNullOrEmpty(request.CompanyId))
        {
            query = query.Where(e => e.CompanyId == request.CompanyId);
        }

        if (request.Status.HasValue)
        {
            query = query.Where(e => e.Status == request.Status.Value);
        }

        // Apply sorting
        query = request.SortBy?.ToLower() switch
        {
            "employeeid" => request.SortDescending ? query.OrderByDescending(e => e.EmployeeId) : query.OrderBy(e => e.EmployeeId),
            "firstname" => request.SortDescending ? query.OrderByDescending(e => e.FirstName) : query.OrderBy(e => e.FirstName),
            "lastname" => request.SortDescending ? query.OrderByDescending(e => e.LastName) : query.OrderBy(e => e.LastName),
            "email" => request.SortDescending ? query.OrderByDescending(e => e.Email) : query.OrderBy(e => e.Email),
            "status" => request.SortDescending ? query.OrderByDescending(e => e.Status) : query.OrderBy(e => e.Status),
            _ => query.OrderBy(e => e.EmployeeId)
        };

        var employees = await query.ToListAsync(cancellationToken);

        // Define CSV headers (matching import template exactly - same order as SimpleEmployeeImportModalV2 and EnhancedEmployeeImportModal)
        var headers = new[]
        {
            "code",
            "name",
            "email",
            "mobile_number",
            "department",
            "sub_department",
            "position",
            "category",
            "joining_date",
            "nationality",
            "company",
            "project",
            "cost_center",
            "status"
        };

        // Create CSV rows (matching import template format exactly - same order as headers)
        var rows = employees.Select(e => new[]
        {
            e.EmployeeId ?? string.Empty,                                    // code
            $"{e.FirstName} {e.LastName}".Trim(),                           // name
            e.Email ?? string.Empty,                                        // email
            e.Phone ?? string.Empty,                                         // mobile_number
            e.Department?.Name ?? string.Empty,                             // department
            e.SubDepartment?.Name ?? string.Empty,                          // sub_department
            e.EmployeePosition?.Name ?? string.Empty,                       // position
            e.EmployeeCategory?.Name ?? string.Empty,                        // category
            e.CreatedAt.ToString("yyyy-MM-dd"),                             // joining_date
            e.Nationality?.Name ?? string.Empty,                             // nationality
            e.Company?.Name ?? string.Empty,                                 // company
            e.Project?.Name ?? string.Empty,                                 // project
            e.CostCenter?.Name ?? string.Empty,                               // cost_center
            e.Status == Status.Active ? "active" : "inactive"                // status
        });

        return CsvExportHelper.CreateCsvFile(headers, rows);
    }
}

