using MediatR;
using Microsoft.EntityFrameworkCore;
using salini.api.Application.Common.Interfaces;
using salini.api.Application.DTOs;
using salini.api.Application.DTOs.ItemCategory;

namespace salini.api.Application.Features.ItemCategories.Queries.GetItemCategories;

public record GetItemCategoriesQuery : IRequest<PaginatedResult<ItemCategoryListDto>>
{
    public int PageNumber { get; init; } = 1;
    public int PageSize { get; init; } = 10;
    public string? SearchTerm { get; init; }
    public string? Status { get; init; }
    public string? SortBy { get; init; }
    public bool SortDescending { get; init; } = false;
}

public class GetItemCategoriesQueryHandler : IRequestHandler<GetItemCategoriesQuery, PaginatedResult<ItemCategoryListDto>>
{
    private readonly IApplicationDbContext _context;

    public GetItemCategoriesQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PaginatedResult<ItemCategoryListDto>> Handle(GetItemCategoriesQuery request, CancellationToken cancellationToken)
    {
        var query = _context.ItemCategories.AsQueryable();

        if (!string.IsNullOrEmpty(request.SearchTerm))
        {
            var searchTerm = request.SearchTerm.ToLowerInvariant();
            query = query.Where(ic => 
                ic.Name.ToLower().Contains(searchTerm) ||
                (ic.Description != null && ic.Description.ToLower().Contains(searchTerm)));
        }

        if (!string.IsNullOrEmpty(request.Status))
        {
            if (Enum.TryParse<salini.api.Domain.Enums.Status>(request.Status, true, out var statusEnum))
            {
                query = query.Where(ic => ic.Status == statusEnum);
            }
        }

        query = request.SortBy?.ToLowerInvariant() switch
        {
            "name" => request.SortDescending ? query.OrderByDescending(ic => ic.Name) : query.OrderBy(ic => ic.Name),
            "status" => request.SortDescending ? query.OrderByDescending(ic => ic.Status) : query.OrderBy(ic => ic.Status),
            "createdat" => request.SortDescending ? query.OrderByDescending(ic => ic.CreatedAt) : query.OrderBy(ic => ic.CreatedAt),
            _ => query.OrderBy(ic => ic.Name)
        };

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(ic => new ItemCategoryListDto
            {
                Id = ic.Id,
                Name = ic.Name,
                Description = ic.Description,
                Status = ic.Status.ToString(),
                CreatedAt = ic.CreatedAt,
                CreatedBy = ic.CreatedBy
            })
            .ToListAsync(cancellationToken);

        return new PaginatedResult<ItemCategoryListDto>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = request.PageNumber,
            PageSize = request.PageSize
        };
    }
}