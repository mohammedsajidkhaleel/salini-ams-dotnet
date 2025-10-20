using MediatR;
using Microsoft.EntityFrameworkCore;
using salini.api.Application.Common.Interfaces;
using salini.api.Application.DTOs;
using salini.api.Application.DTOs.Accessory;

namespace salini.api.Application.Features.Accessories.Queries.GetAccessories;

public record GetAccessoriesQuery : IRequest<PaginatedResult<AccessoryListDto>>
{
    public int PageNumber { get; init; } = 1;
    public int PageSize { get; init; } = 10;
    public string? SearchTerm { get; init; }
    public string? Status { get; init; }
    public string? AssignedTo { get; init; }
    public string? SortBy { get; init; }
    public bool SortDescending { get; init; } = false;
}

public class GetAccessoriesQueryHandler : IRequestHandler<GetAccessoriesQuery, PaginatedResult<AccessoryListDto>>
{
    private readonly IApplicationDbContext _context;

    public GetAccessoriesQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PaginatedResult<AccessoryListDto>> Handle(GetAccessoriesQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Accessories
            .Include(a => a.EmployeeAccessories)
                .ThenInclude(ea => ea.Employee)
            .AsQueryable();

        // Apply search filter
        if (!string.IsNullOrEmpty(request.SearchTerm))
        {
            var searchTerm = request.SearchTerm.ToLowerInvariant();
            query = query.Where(a => 
                a.Name.ToLower().Contains(searchTerm) ||
                (a.Description != null && a.Description.ToLower().Contains(searchTerm)));
        }

        // Apply status filter
        if (!string.IsNullOrEmpty(request.Status))
        {
            if (Enum.TryParse<salini.api.Domain.Enums.Status>(request.Status, true, out var statusEnum))
            {
                query = query.Where(a => a.Status == statusEnum);
            }
        }

        // Apply assigned to filter
        if (!string.IsNullOrEmpty(request.AssignedTo))
        {
            query = query.Where(a => a.EmployeeAccessories
                .Any(ea => ea.EmployeeId == request.AssignedTo && ea.Status == salini.api.Domain.Enums.AssignmentStatus.Assigned));
        }

        // Apply sorting
        query = request.SortBy?.ToLowerInvariant() switch
        {
            "name" => request.SortDescending ? query.OrderByDescending(a => a.Name) : query.OrderBy(a => a.Name),
            "status" => request.SortDescending ? query.OrderByDescending(a => a.Status) : query.OrderBy(a => a.Status),
            "createdat" => request.SortDescending ? query.OrderByDescending(a => a.CreatedAt) : query.OrderBy(a => a.CreatedAt),
            _ => query.OrderBy(a => a.Name)
        };

        // Get total count
        var totalCount = await query.CountAsync(cancellationToken);

        // Apply pagination
        var items = await query
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(a => new AccessoryListDto
            {
                Id = a.Id,
                Name = a.Name,
                Description = a.Description,
                Status = a.Status.ToString(),
                CreatedAt = a.CreatedAt,
                CreatedBy = a.CreatedBy,
                // Include assignment information when filtering by assignedTo
                Quantity = request.AssignedTo != null ? 
                    a.EmployeeAccessories
                        .Where(ea => ea.EmployeeId == request.AssignedTo && ea.Status == salini.api.Domain.Enums.AssignmentStatus.Assigned)
                        .Sum(ea => ea.Quantity) : 0,
                AssignedEmployeeName = request.AssignedTo != null ?
                    a.EmployeeAccessories
                        .Where(ea => ea.EmployeeId == request.AssignedTo && ea.Status == salini.api.Domain.Enums.AssignmentStatus.Assigned)
                        .Select(ea => ea.Employee != null ? $"{ea.Employee.FirstName} {ea.Employee.LastName}" : null)
                        .FirstOrDefault() : null,
                AssignmentDate = request.AssignedTo != null ?
                    a.EmployeeAccessories
                        .Where(ea => ea.EmployeeId == request.AssignedTo && ea.Status == salini.api.Domain.Enums.AssignmentStatus.Assigned)
                        .Select(ea => ea.AssignedDate)
                        .FirstOrDefault() : null
            })
            .ToListAsync(cancellationToken);

        return new PaginatedResult<AccessoryListDto>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = request.PageNumber,
            PageSize = request.PageSize
        };
    }
}
