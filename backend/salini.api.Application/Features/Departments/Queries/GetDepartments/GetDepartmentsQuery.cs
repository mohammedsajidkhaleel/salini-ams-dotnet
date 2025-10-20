using salini.api.Application.Common.Interfaces;
using salini.api.Application.DTOs;
using salini.api.Application.DTOs.Department;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace salini.api.Application.Features.Departments.Queries.GetDepartments;

public record GetDepartmentsQuery : IQuery<PaginatedResult<DepartmentListDto>>
{
    public int PageNumber { get; init; } = 1;
    public int PageSize { get; init; } = 10;
    public string? SearchTerm { get; init; }
    public string? SortBy { get; init; }
    public bool SortDescending { get; init; } = false;
}

public class GetDepartmentsQueryHandler : IRequestHandler<GetDepartmentsQuery, PaginatedResult<DepartmentListDto>>
{
    private readonly IApplicationDbContext _context;

    public GetDepartmentsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PaginatedResult<DepartmentListDto>> Handle(GetDepartmentsQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Departments.AsQueryable();

        // Apply search filter
        if (!string.IsNullOrWhiteSpace(request.SearchTerm))
        {
            query = query.Where(d => d.Name.Contains(request.SearchTerm) || 
                                   (d.Description != null && d.Description.Contains(request.SearchTerm)));
        }

        // Apply sorting
        query = request.SortBy?.ToLower() switch
        {
            "name" => request.SortDescending ? query.OrderByDescending(d => d.Name) : query.OrderBy(d => d.Name),
            "status" => request.SortDescending ? query.OrderByDescending(d => d.Status) : query.OrderBy(d => d.Status),
            "createdat" => request.SortDescending ? query.OrderByDescending(d => d.CreatedAt) : query.OrderBy(d => d.CreatedAt),
            _ => query.OrderBy(d => d.Name)
        };

        // Get total count
        var totalCount = await query.CountAsync(cancellationToken);

        // Apply pagination
        var departments = await query
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(d => new DepartmentListDto
            {
                Id = d.Id,
                Name = d.Name,
                Description = d.Description,
                Status = d.Status.ToString(),
                EmployeeCount = _context.Employees.Count(e => e.DepartmentId == d.Id),
                SubDepartmentCount = _context.SubDepartments.Count(sd => sd.DepartmentId == d.Id)
            })
            .ToListAsync(cancellationToken);

        return new PaginatedResult<DepartmentListDto>
        {
            Items = departments,
            TotalCount = totalCount,
            PageNumber = request.PageNumber,
            PageSize = request.PageSize
        };
    }
}
