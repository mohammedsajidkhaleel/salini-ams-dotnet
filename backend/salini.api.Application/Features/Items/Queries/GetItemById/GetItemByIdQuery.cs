using MediatR;
using Microsoft.EntityFrameworkCore;
using salini.api.Application.Common.Interfaces;
using salini.api.Application.DTOs.Item;
using salini.api.Domain.Entities;

namespace salini.api.Application.Features.Items.Queries.GetItemById;

public record GetItemByIdQuery(string Id) : IRequest<ItemDto?>;

public class GetItemByIdQueryHandler : IRequestHandler<GetItemByIdQuery, ItemDto?>
{
    private readonly IApplicationDbContext _context;

    public GetItemByIdQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ItemDto?> Handle(GetItemByIdQuery request, CancellationToken cancellationToken)
    {
        var item = await _context.Items
            .Include(i => i.ItemCategory)
            .FirstOrDefaultAsync(i => i.Id == request.Id, cancellationToken);

        if (item == null)
        {
            return null;
        }

        return new ItemDto
        {
            Id = item.Id,
            Name = item.Name,
            Description = item.Description,
            Status = item.Status.ToString(),
            ItemCategoryId = item.ItemCategoryId,
            ItemCategoryName = item.ItemCategory.Name,
            CreatedAt = item.CreatedAt,
            CreatedBy = item.CreatedBy,
            UpdatedAt = item.UpdatedAt,
            UpdatedBy = item.UpdatedBy
        };
    }
}
