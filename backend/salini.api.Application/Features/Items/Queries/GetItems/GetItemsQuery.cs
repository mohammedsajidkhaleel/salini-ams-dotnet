using MediatR;
using Microsoft.EntityFrameworkCore;
using salini.api.Application.Common.Interfaces;
using salini.api.Application.DTOs;
using salini.api.Application.DTOs.Item;

namespace salini.api.Application.Features.Items.Queries.GetItems;

public record GetItemsQuery : IRequest<PaginatedResult<ItemListDto>>
{
    public int PageNumber { get; init; } = 1;
    public int PageSize { get; init; } = 10;
    public string? SearchTerm { get; init; }
    public string? Status { get; init; }
    public string? ItemCategoryId { get; init; }
    public string? SortBy { get; init; }
    public bool SortDescending { get; init; } = false;
}

public class GetItemsQueryHandler : IRequestHandler<GetItemsQuery, PaginatedResult<ItemListDto>>
{
    private readonly IApplicationDbContext _context;

    public GetItemsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PaginatedResult<ItemListDto>> Handle(GetItemsQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Items
            .Include(i => i.ItemCategory)
            .AsQueryable();

        // Apply search filter
        if (!string.IsNullOrEmpty(request.SearchTerm))
        {
            var searchTerm = request.SearchTerm.ToLowerInvariant();
            query = query.Where(i => 
                i.Name.ToLower().Contains(searchTerm) ||
                (i.Description != null && i.Description.ToLower().Contains(searchTerm)) ||
                i.ItemCategory.Name.ToLower().Contains(searchTerm));
        }

        // Apply status filter
        if (!string.IsNullOrEmpty(request.Status))
        {
            if (Enum.TryParse<salini.api.Domain.Enums.Status>(request.Status, true, out var statusEnum))
            {
                query = query.Where(i => i.Status == statusEnum);
            }
        }

        // Apply item category filter
        if (!string.IsNullOrEmpty(request.ItemCategoryId))
        {
            query = query.Where(i => i.ItemCategoryId == request.ItemCategoryId);
        }

        // Apply sorting
        query = request.SortBy?.ToLowerInvariant() switch
        {
            "name" => request.SortDescending ? query.OrderByDescending(i => i.Name) : query.OrderBy(i => i.Name),
            "status" => request.SortDescending ? query.OrderByDescending(i => i.Status) : query.OrderBy(i => i.Status),
            "itemcategory" => request.SortDescending ? query.OrderByDescending(i => i.ItemCategory.Name) : query.OrderBy(i => i.ItemCategory.Name),
            "createdat" => request.SortDescending ? query.OrderByDescending(i => i.CreatedAt) : query.OrderBy(i => i.CreatedAt),
            _ => query.OrderBy(i => i.Name)
        };

        // Get total count
        var totalCount = await query.CountAsync(cancellationToken);

        // Apply pagination
        var items = await query
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(i => new ItemListDto
            {
                Id = i.Id,
                Name = i.Name,
                Description = i.Description,
                Status = i.Status.ToString(),
                ItemCategoryId = i.ItemCategoryId,
                ItemCategoryName = i.ItemCategory.Name,
                CreatedAt = i.CreatedAt,
                CreatedBy = i.CreatedBy
            })
            .ToListAsync(cancellationToken);

        return new PaginatedResult<ItemListDto>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = request.PageNumber,
            PageSize = request.PageSize
        };
    }
}
