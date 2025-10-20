using salini.api.Application.Common.Interfaces;
using salini.api.Application.DTOs;
using salini.api.Application.DTOs.Project;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace salini.api.Application.Features.Projects.Queries.GetProjects;

public record GetProjectsQuery : IQuery<PaginatedResult<ProjectListDto>>
{
    public int PageNumber { get; init; } = 1;
    public int PageSize { get; init; } = 10;
    public string? SearchTerm { get; init; }
    public string? SortBy { get; init; }
    public bool SortDescending { get; init; } = false;
    public string? CompanyId { get; init; }
    public string? Status { get; init; }
    public List<string>? UserProjectIds { get; init; } // User's assigned project IDs for filtering
}

public class GetProjectsQueryHandler : IRequestHandler<GetProjectsQuery, PaginatedResult<ProjectListDto>>
{
    private readonly IApplicationDbContext _context;

    public GetProjectsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PaginatedResult<ProjectListDto>> Handle(GetProjectsQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Projects
            .Include(p => p.Company)
            .Include(p => p.CostCenter)
            .Include(p => p.Nationality)
            .AsQueryable();

        // Apply search filter
        if (!string.IsNullOrWhiteSpace(request.SearchTerm))
        {
            query = query.Where(p => p.Name.Contains(request.SearchTerm) || 
                                   p.Code.Contains(request.SearchTerm) ||
                                   (p.Description != null && p.Description.Contains(request.SearchTerm)));
        }

        // Apply company filter
        if (!string.IsNullOrWhiteSpace(request.CompanyId))
        {
            query = query.Where(p => p.CompanyId == request.CompanyId);
        }

        // Apply status filter
        if (!string.IsNullOrWhiteSpace(request.Status) && Enum.TryParse<salini.api.Domain.Enums.Status>(request.Status, out var status))
        {
            query = query.Where(p => p.Status == status);
        }

        // Apply user project filter
        if (request.UserProjectIds != null)
        {
            Console.WriteLine($"🔍 GetProjectsQuery - UserProjectIds: {string.Join(", ", request.UserProjectIds)}");
            
            if (request.UserProjectIds.Count > 0)
            {
                // User has assigned projects, filter by them
                Console.WriteLine($"🔍 GetProjectsQuery - Filtering by {request.UserProjectIds.Count} assigned projects");
                query = query.Where(p => request.UserProjectIds.Contains(p.Id));
            }
            else
            {
                // User has no assigned projects, return empty result
                Console.WriteLine($"🔍 GetProjectsQuery - User has no assigned projects, returning empty result");
                query = query.Where(p => false); // This will return no results
            }
        }
        else
        {
            Console.WriteLine($"🔍 GetProjectsQuery - UserProjectIds is null (admin user), no filtering applied");
        }

        // Apply sorting
        query = request.SortBy?.ToLower() switch
        {
            "name" => request.SortDescending ? query.OrderByDescending(p => p.Name) : query.OrderBy(p => p.Name),
            "code" => request.SortDescending ? query.OrderByDescending(p => p.Code) : query.OrderBy(p => p.Code),
            "status" => request.SortDescending ? query.OrderByDescending(p => p.Status) : query.OrderBy(p => p.Status),
            "createdat" => request.SortDescending ? query.OrderByDescending(p => p.CreatedAt) : query.OrderBy(p => p.CreatedAt),
            _ => query.OrderBy(p => p.Name)
        };

        // Get total count
        var totalCount = await query.CountAsync(cancellationToken);

        // Apply pagination
        var projects = await query
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(p => new ProjectListDto
            {
                Id = p.Id,
                Code = p.Code,
                Name = p.Name,
                Description = p.Description,
                Status = p.Status,
                CompanyName = p.Company != null ? p.Company.Name : string.Empty,
                CostCenterName = p.CostCenter != null ? p.CostCenter.Name : null,
                NationalityName = p.Nationality != null ? p.Nationality.Name : null,
                EmployeeCount = _context.Employees.Count(e => e.ProjectId == p.Id)
            })
            .ToListAsync(cancellationToken);

        return new PaginatedResult<ProjectListDto>
        {
            Items = projects,
            TotalCount = totalCount,
            PageNumber = request.PageNumber,
            PageSize = request.PageSize
        };
    }
}
