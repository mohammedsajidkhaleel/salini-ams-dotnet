using MediatR;
using Microsoft.EntityFrameworkCore;
using salini.api.Application.Common.Interfaces;
using salini.api.Application.DTOs;
using salini.api.Application.DTOs.Nationality;

namespace salini.api.Application.Features.Nationalities.Queries.GetNationalities;

public record GetNationalitiesQuery : IRequest<PaginatedResult<NationalityListDto>>
{
    public int PageNumber { get; init; } = 1;
    public int PageSize { get; init; } = 10;
    public string? SearchTerm { get; init; }
    public string? Status { get; init; }
    public string? SortBy { get; init; }
    public bool SortDescending { get; init; } = false;
}

public class GetNationalitiesQueryHandler : IRequestHandler<GetNationalitiesQuery, PaginatedResult<NationalityListDto>>
{
    private readonly IApplicationDbContext _context;

    public GetNationalitiesQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PaginatedResult<NationalityListDto>> Handle(GetNationalitiesQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Nationalities.AsQueryable();

        if (!string.IsNullOrEmpty(request.SearchTerm))
        {
            var searchTerm = request.SearchTerm.ToLowerInvariant();
            query = query.Where(n => 
                n.Name.ToLower().Contains(searchTerm) ||
                (n.Description != null && n.Description.ToLower().Contains(searchTerm)));
        }

        if (!string.IsNullOrEmpty(request.Status))
        {
            if (Enum.TryParse<salini.api.Domain.Enums.Status>(request.Status, true, out var statusEnum))
            {
                query = query.Where(n => n.Status == statusEnum);
            }
        }

        query = request.SortBy?.ToLowerInvariant() switch
        {
            "name" => request.SortDescending ? query.OrderByDescending(n => n.Name) : query.OrderBy(n => n.Name),
            "status" => request.SortDescending ? query.OrderByDescending(n => n.Status) : query.OrderBy(n => n.Status),
            "createdat" => request.SortDescending ? query.OrderByDescending(n => n.CreatedAt) : query.OrderBy(n => n.CreatedAt),
            _ => query.OrderBy(n => n.Name)
        };

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(n => new NationalityListDto
            {
                Id = n.Id,
                Name = n.Name,
                Description = n.Description,
                Status = n.Status.ToString(),
                CreatedAt = n.CreatedAt,
                CreatedBy = n.CreatedBy
            })
            .ToListAsync(cancellationToken);

        return new PaginatedResult<NationalityListDto>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = request.PageNumber,
            PageSize = request.PageSize
        };
    }
}