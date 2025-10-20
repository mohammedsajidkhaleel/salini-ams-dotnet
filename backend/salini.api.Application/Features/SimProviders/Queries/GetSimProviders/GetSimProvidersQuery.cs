using MediatR;
using Microsoft.EntityFrameworkCore;
using salini.api.Application.Common.Interfaces;
using salini.api.Application.DTOs;
using salini.api.Application.DTOs.SimProvider;

namespace salini.api.Application.Features.SimProviders.Queries.GetSimProviders;

public record GetSimProvidersQuery : IRequest<PaginatedResult<SimProviderListDto>>
{
    public int PageNumber { get; init; } = 1;
    public int PageSize { get; init; } = 10;
    public string? SearchTerm { get; init; }
    public bool? IsActive { get; init; }
    public string? SortBy { get; init; }
    public bool SortDescending { get; init; } = false;
}

public class GetSimProvidersQueryHandler : IRequestHandler<GetSimProvidersQuery, PaginatedResult<SimProviderListDto>>
{
    private readonly IApplicationDbContext _context;

    public GetSimProvidersQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PaginatedResult<SimProviderListDto>> Handle(GetSimProvidersQuery request, CancellationToken cancellationToken)
    {
        var query = _context.SimProviders.AsQueryable();

        if (!string.IsNullOrEmpty(request.SearchTerm))
        {
            var searchTerm = request.SearchTerm.ToLowerInvariant();
            query = query.Where(sp => 
                sp.Name.ToLower().Contains(searchTerm) ||
                (sp.Description != null && sp.Description.ToLower().Contains(searchTerm)) ||
                (sp.ContactInfo != null && sp.ContactInfo.ToLower().Contains(searchTerm)));
        }

        if (request.IsActive.HasValue)
        {
            query = query.Where(sp => sp.IsActive == request.IsActive.Value);
        }

        query = request.SortBy?.ToLowerInvariant() switch
        {
            "name" => request.SortDescending ? query.OrderByDescending(sp => sp.Name) : query.OrderBy(sp => sp.Name),
            "isactive" => request.SortDescending ? query.OrderByDescending(sp => sp.IsActive) : query.OrderBy(sp => sp.IsActive),
            "createdat" => request.SortDescending ? query.OrderByDescending(sp => sp.CreatedAt) : query.OrderBy(sp => sp.CreatedAt),
            _ => query.OrderBy(sp => sp.Name)
        };

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(sp => new SimProviderListDto
            {
                Id = sp.Id,
                Name = sp.Name,
                Description = sp.Description,
                ContactInfo = sp.ContactInfo,
                IsActive = sp.IsActive,
                CreatedAt = sp.CreatedAt,
                CreatedBy = sp.CreatedBy
            })
            .ToListAsync(cancellationToken);

        return new PaginatedResult<SimProviderListDto>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = request.PageNumber,
            PageSize = request.PageSize
        };
    }
}
