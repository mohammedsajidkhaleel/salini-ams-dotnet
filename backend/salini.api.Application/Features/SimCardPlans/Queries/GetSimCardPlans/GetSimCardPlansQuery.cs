using MediatR;
using Microsoft.EntityFrameworkCore;
using salini.api.Application.Common.Interfaces;
using salini.api.Application.DTOs;
using salini.api.Application.DTOs.SimCardPlan;

namespace salini.api.Application.Features.SimCardPlans.Queries.GetSimCardPlans;

public record GetSimCardPlansQuery : IRequest<PaginatedResult<SimCardPlanListDto>>
{
    public int PageNumber { get; init; } = 1;
    public int PageSize { get; init; } = 10;
    public string? SearchTerm { get; init; }
    public bool? IsActive { get; init; }
    public string? ProviderId { get; init; }
    public string? SortBy { get; init; }
    public bool SortDescending { get; init; } = false;
}

public class GetSimCardPlansQueryHandler : IRequestHandler<GetSimCardPlansQuery, PaginatedResult<SimCardPlanListDto>>
{
    private readonly IApplicationDbContext _context;

    public GetSimCardPlansQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PaginatedResult<SimCardPlanListDto>> Handle(GetSimCardPlansQuery request, CancellationToken cancellationToken)
    {
        var query = _context.SimCardPlans
            .Include(scp => scp.Provider)
            .AsQueryable();

        if (!string.IsNullOrEmpty(request.SearchTerm))
        {
            var searchTerm = request.SearchTerm.ToLowerInvariant();
            query = query.Where(scp => 
                scp.Name.ToLower().Contains(searchTerm) ||
                (scp.Description != null && scp.Description.ToLower().Contains(searchTerm)) ||
                (scp.Provider != null && scp.Provider.Name.ToLower().Contains(searchTerm)));
        }

        if (request.IsActive.HasValue)
        {
            query = query.Where(scp => scp.IsActive == request.IsActive.Value);
        }

        if (!string.IsNullOrEmpty(request.ProviderId))
        {
            query = query.Where(scp => scp.ProviderId == request.ProviderId);
        }

        query = request.SortBy?.ToLowerInvariant() switch
        {
            "name" => request.SortDescending ? query.OrderByDescending(scp => scp.Name) : query.OrderBy(scp => scp.Name),
            "monthlyfee" => request.SortDescending ? query.OrderByDescending(scp => scp.MonthlyFee) : query.OrderBy(scp => scp.MonthlyFee),
            "provider" => request.SortDescending ? query.OrderByDescending(scp => scp.Provider!.Name) : query.OrderBy(scp => scp.Provider!.Name),
            "isactive" => request.SortDescending ? query.OrderByDescending(scp => scp.IsActive) : query.OrderBy(scp => scp.IsActive),
            "createdat" => request.SortDescending ? query.OrderByDescending(scp => scp.CreatedAt) : query.OrderBy(scp => scp.CreatedAt),
            _ => query.OrderBy(scp => scp.Name)
        };

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(scp => new SimCardPlanListDto
            {
                Id = scp.Id,
                Name = scp.Name,
                Description = scp.Description,
                DataLimit = scp.DataLimit,
                MonthlyFee = scp.MonthlyFee,
                IsActive = scp.IsActive,
                ProviderId = scp.ProviderId,
                ProviderName = scp.Provider!.Name,
                CreatedAt = scp.CreatedAt,
                CreatedBy = scp.CreatedBy
            })
            .ToListAsync(cancellationToken);

        return new PaginatedResult<SimCardPlanListDto>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = request.PageNumber,
            PageSize = request.PageSize
        };
    }
}
