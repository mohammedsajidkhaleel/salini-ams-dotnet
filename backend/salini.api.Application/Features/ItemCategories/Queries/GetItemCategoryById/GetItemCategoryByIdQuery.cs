using MediatR;
using Microsoft.EntityFrameworkCore;
using salini.api.Application.Common.Interfaces;
using salini.api.Application.DTOs.ItemCategory;
using salini.api.Domain.Entities;

namespace salini.api.Application.Features.ItemCategories.Queries.GetItemCategoryById;

public record GetItemCategoryByIdQuery(string Id) : IRequest<ItemCategoryDto?>;

public class GetItemCategoryByIdQueryHandler : IRequestHandler<GetItemCategoryByIdQuery, ItemCategoryDto?>
{
    private readonly IApplicationDbContext _context;

    public GetItemCategoryByIdQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ItemCategoryDto?> Handle(GetItemCategoryByIdQuery request, CancellationToken cancellationToken)
    {
        var itemCategory = await _context.ItemCategories
            .FirstOrDefaultAsync(ic => ic.Id == request.Id, cancellationToken);

        if (itemCategory == null)
        {
            return null;
        }

        return new ItemCategoryDto
        {
            Id = itemCategory.Id,
            Name = itemCategory.Name,
            Description = itemCategory.Description,
            Status = itemCategory.Status.ToString(),
            CreatedAt = itemCategory.CreatedAt,
            CreatedBy = itemCategory.CreatedBy,
            UpdatedAt = itemCategory.UpdatedAt,
            UpdatedBy = itemCategory.UpdatedBy
        };
    }
}