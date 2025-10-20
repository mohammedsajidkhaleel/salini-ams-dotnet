using MediatR;
using Microsoft.EntityFrameworkCore;
using salini.api.Application.Common.Interfaces;
using salini.api.Application.DTOs;
using salini.api.Application.DTOs.CostCenter;

namespace salini.api.Application.Features.CostCenters.Queries.GetCostCenters;

public record GetCostCentersQuery : IRequest<PaginatedResult<CostCenterListDto>>
{
    public int PageNumber { get; init; } = 1;
    public int PageSize { get; init; } = 10;
    public string? SearchTerm { get; init; }
    public string? Status { get; init; }
    public string? SortBy { get; init; }
    public bool SortDescending { get; init; } = false;
}

public class GetCostCentersQueryHandler : IRequestHandler<GetCostCentersQuery, PaginatedResult<CostCenterListDto>>
{
    private readonly IApplicationDbContext _context;

    public GetCostCentersQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PaginatedResult<CostCenterListDto>> Handle(GetCostCentersQuery request, CancellationToken cancellationToken)
    {
        var query = _context.CostCenters.AsQueryable();

        // Apply search filter
        if (!string.IsNullOrEmpty(request.SearchTerm))
        {
            var searchTerm = request.SearchTerm.ToLowerInvariant();
            query = query.Where(cc => 
                cc.Code.ToLower().Contains(searchTerm) ||
                cc.Name.ToLower().Contains(searchTerm) ||
                (cc.Description != null && cc.Description.ToLower().Contains(searchTerm)));
        }

        // Apply status filter
        if (!string.IsNullOrEmpty(request.Status))
        {
            if (Enum.TryParse<salini.api.Domain.Enums.Status>(request.Status, true, out var statusEnum))
            {
                query = query.Where(cc => cc.Status == statusEnum);
            }
        }

        // Apply sorting
        query = request.SortBy?.ToLowerInvariant() switch
        {
            "code" => request.SortDescending ? query.OrderByDescending(cc => cc.Code) : query.OrderBy(cc => cc.Code),
            "name" => request.SortDescending ? query.OrderByDescending(cc => cc.Name) : query.OrderBy(cc => cc.Name),
            "status" => request.SortDescending ? query.OrderByDescending(cc => cc.Status) : query.OrderBy(cc => cc.Status),
            "createdat" => request.SortDescending ? query.OrderByDescending(cc => cc.CreatedAt) : query.OrderBy(cc => cc.CreatedAt),
            _ => query.OrderBy(cc => cc.Name)
        };

        // Get total count
        var totalCount = await query.CountAsync(cancellationToken);

        // Apply pagination
        var items = await query
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(cc => new CostCenterListDto
            {
                Id = cc.Id,
                Code = cc.Code,
                Name = cc.Name,
                Description = cc.Description,
                Status = cc.Status.ToString(),
                CreatedAt = cc.CreatedAt,
                CreatedBy = cc.CreatedBy
            })
            .ToListAsync(cancellationToken);

        return new PaginatedResult<CostCenterListDto>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = request.PageNumber,
            PageSize = request.PageSize
        };
    }
}
