using MediatR;
using Microsoft.EntityFrameworkCore;
using salini.api.Application.Common.Interfaces;
using salini.api.Application.DTOs;
using salini.api.Application.DTOs.EmployeePosition;

namespace salini.api.Application.Features.EmployeePositions.Queries.GetEmployeePositions;

public record GetEmployeePositionsQuery : IRequest<PaginatedResult<EmployeePositionListDto>>
{
    public int PageNumber { get; init; } = 1;
    public int PageSize { get; init; } = 10;
    public string? SearchTerm { get; init; }
    public string? Status { get; init; }
    public string? SortBy { get; init; }
    public bool SortDescending { get; init; } = false;
}

public class GetEmployeePositionsQueryHandler : IRequestHandler<GetEmployeePositionsQuery, PaginatedResult<EmployeePositionListDto>>
{
    private readonly IApplicationDbContext _context;

    public GetEmployeePositionsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PaginatedResult<EmployeePositionListDto>> Handle(GetEmployeePositionsQuery request, CancellationToken cancellationToken)
    {
        var query = _context.EmployeePositions.AsQueryable();

        if (!string.IsNullOrEmpty(request.SearchTerm))
        {
            var searchTerm = request.SearchTerm.ToLowerInvariant();
            query = query.Where(ep => 
                ep.Name.ToLower().Contains(searchTerm) ||
                (ep.Description != null && ep.Description.ToLower().Contains(searchTerm)));
        }

        if (!string.IsNullOrEmpty(request.Status))
        {
            if (Enum.TryParse<salini.api.Domain.Enums.Status>(request.Status, true, out var statusEnum))
            {
                query = query.Where(ep => ep.Status == statusEnum);
            }
        }

        query = request.SortBy?.ToLowerInvariant() switch
        {
            "name" => request.SortDescending ? query.OrderByDescending(ep => ep.Name) : query.OrderBy(ep => ep.Name),
            "status" => request.SortDescending ? query.OrderByDescending(ep => ep.Status) : query.OrderBy(ep => ep.Status),
            "createdat" => request.SortDescending ? query.OrderByDescending(ep => ep.CreatedAt) : query.OrderBy(ep => ep.CreatedAt),
            _ => query.OrderBy(ep => ep.Name)
        };

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(ep => new EmployeePositionListDto
            {
                Id = ep.Id,
                Name = ep.Name,
                Description = ep.Description,
                Status = ep.Status.ToString(),
                CreatedAt = ep.CreatedAt,
                CreatedBy = ep.CreatedBy
            })
            .ToListAsync(cancellationToken);

        return new PaginatedResult<EmployeePositionListDto>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = request.PageNumber,
            PageSize = request.PageSize
        };
    }
}
