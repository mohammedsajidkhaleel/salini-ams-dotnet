using MediatR;
using Microsoft.EntityFrameworkCore;
using salini.api.Application.Common.Interfaces;
using salini.api.Application.DTOs;
using salini.api.Application.DTOs.SubDepartment;

namespace salini.api.Application.Features.SubDepartments.Queries.GetSubDepartments;

public record GetSubDepartmentsQuery : IRequest<PaginatedResult<SubDepartmentListDto>>
{
    public int PageNumber { get; init; } = 1;
    public int PageSize { get; init; } = 10;
    public string? SearchTerm { get; init; }
    public string? Status { get; init; }
    public string? DepartmentId { get; init; }
    public string? SortBy { get; init; }
    public bool SortDescending { get; init; } = false;
}

public class GetSubDepartmentsQueryHandler : IRequestHandler<GetSubDepartmentsQuery, PaginatedResult<SubDepartmentListDto>>
{
    private readonly IApplicationDbContext _context;

    public GetSubDepartmentsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PaginatedResult<SubDepartmentListDto>> Handle(GetSubDepartmentsQuery request, CancellationToken cancellationToken)
    {
        var query = _context.SubDepartments
            .Include(sd => sd.Department)
            .AsQueryable();

        // Apply search filter
        if (!string.IsNullOrEmpty(request.SearchTerm))
        {
            var searchTerm = request.SearchTerm.ToLowerInvariant();
            query = query.Where(sd => 
                sd.Name.ToLower().Contains(searchTerm) ||
                (sd.Description != null && sd.Description.ToLower().Contains(searchTerm)) ||
                sd.Department.Name.ToLower().Contains(searchTerm));
        }

        // Apply status filter
        if (!string.IsNullOrEmpty(request.Status))
        {
            if (Enum.TryParse<salini.api.Domain.Enums.Status>(request.Status, true, out var statusEnum))
            {
                query = query.Where(sd => sd.Status == statusEnum);
            }
        }

        // Apply department filter
        if (!string.IsNullOrEmpty(request.DepartmentId))
        {
            query = query.Where(sd => sd.DepartmentId == request.DepartmentId);
        }

        // Apply sorting
        query = request.SortBy?.ToLowerInvariant() switch
        {
            "name" => request.SortDescending ? query.OrderByDescending(sd => sd.Name) : query.OrderBy(sd => sd.Name),
            "status" => request.SortDescending ? query.OrderByDescending(sd => sd.Status) : query.OrderBy(sd => sd.Status),
            "department" => request.SortDescending ? query.OrderByDescending(sd => sd.Department.Name) : query.OrderBy(sd => sd.Department.Name),
            "createdat" => request.SortDescending ? query.OrderByDescending(sd => sd.CreatedAt) : query.OrderBy(sd => sd.CreatedAt),
            _ => query.OrderBy(sd => sd.Name)
        };

        // Get total count
        var totalCount = await query.CountAsync(cancellationToken);

        // Apply pagination
        var items = await query
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(sd => new SubDepartmentListDto
            {
                Id = sd.Id,
                Name = sd.Name,
                Description = sd.Description,
                Status = sd.Status.ToString(),
                DepartmentId = sd.DepartmentId,
                DepartmentName = sd.Department.Name,
                CreatedAt = sd.CreatedAt,
                CreatedBy = sd.CreatedBy
            })
            .ToListAsync(cancellationToken);

        return new PaginatedResult<SubDepartmentListDto>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = request.PageNumber,
            PageSize = request.PageSize
        };
    }
}
