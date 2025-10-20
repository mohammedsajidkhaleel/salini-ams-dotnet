using MediatR;
using Microsoft.EntityFrameworkCore;
using salini.api.Application.Common.Interfaces;
using salini.api.Application.DTOs;
using salini.api.Application.DTOs.SimType;

namespace salini.api.Application.Features.SimTypes.Queries.GetSimTypes;

public record GetSimTypesQuery : IRequest<PaginatedResult<SimTypeListDto>>
{
    public int PageNumber { get; init; } = 1;
    public int PageSize { get; init; } = 10;
    public string? SearchTerm { get; init; }
    public bool? IsActive { get; init; }
    public string? SortBy { get; init; }
    public bool SortDescending { get; init; } = false;
}

public class GetSimTypesQueryHandler : IRequestHandler<GetSimTypesQuery, PaginatedResult<SimTypeListDto>>
{
    private readonly IApplicationDbContext _context;

    public GetSimTypesQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PaginatedResult<SimTypeListDto>> Handle(GetSimTypesQuery request, CancellationToken cancellationToken)
    {
        var query = _context.SimTypes.AsQueryable();

        if (!string.IsNullOrEmpty(request.SearchTerm))
        {
            var searchTerm = request.SearchTerm.ToLowerInvariant();
            query = query.Where(st => 
                st.Name.ToLower().Contains(searchTerm) ||
                (st.Description != null && st.Description.ToLower().Contains(searchTerm)));
        }

        if (request.IsActive.HasValue)
        {
            query = query.Where(st => st.IsActive == request.IsActive.Value);
        }

        query = request.SortBy?.ToLowerInvariant() switch
        {
            "name" => request.SortDescending ? query.OrderByDescending(st => st.Name) : query.OrderBy(st => st.Name),
            "isactive" => request.SortDescending ? query.OrderByDescending(st => st.IsActive) : query.OrderBy(st => st.IsActive),
            "createdat" => request.SortDescending ? query.OrderByDescending(st => st.CreatedAt) : query.OrderBy(st => st.CreatedAt),
            _ => query.OrderBy(st => st.Name)
        };

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(st => new SimTypeListDto
            {
                Id = st.Id,
                Name = st.Name,
                Description = st.Description,
                IsActive = st.IsActive,
                CreatedAt = st.CreatedAt,
                CreatedBy = st.CreatedBy
            })
            .ToListAsync(cancellationToken);

        return new PaginatedResult<SimTypeListDto>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = request.PageNumber,
            PageSize = request.PageSize
        };
    }
}
