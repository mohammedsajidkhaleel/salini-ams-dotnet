using MediatR;
using Microsoft.EntityFrameworkCore;
using salini.api.Application.Common.Interfaces;
using salini.api.Application.DTOs.Item;
using salini.api.Domain.Entities;

namespace salini.api.Application.Features.Items.Commands.CreateItem;

public record CreateItemCommand : IRequest<ItemDto>
{
    public string Name { get; init; } = string.Empty;
    public string? Description { get; init; }
    public salini.api.Domain.Enums.Status Status { get; init; } = salini.api.Domain.Enums.Status.Active;
    public string ItemCategoryId { get; init; } = string.Empty;
}

public class CreateItemCommandHandler : IRequestHandler<CreateItemCommand, ItemDto>
{
    private readonly IApplicationDbContext _context;

    public CreateItemCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ItemDto> Handle(CreateItemCommand request, CancellationToken cancellationToken)
    {
        // Verify that the ItemCategory exists
        var itemCategory = await _context.ItemCategories
            .FirstOrDefaultAsync(ic => ic.Id == request.ItemCategoryId, cancellationToken);

        if (itemCategory == null)
        {
            throw new KeyNotFoundException($"Item category with ID {request.ItemCategoryId} not found.");
        }

        var item = new Item
        {
            Id = Guid.NewGuid().ToString(),
            Name = request.Name,
            Description = request.Description,
            Status = request.Status,
            ItemCategoryId = request.ItemCategoryId,
            CreatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc),
            CreatedBy = "System" // TODO: Get from current user context
        };

        _context.Items.Add(item);
        await _context.SaveChangesAsync(cancellationToken);

        return new ItemDto
        {
            Id = item.Id,
            Name = item.Name,
            Description = item.Description,
            Status = item.Status.ToString(),
            ItemCategoryId = item.ItemCategoryId,
            ItemCategoryName = itemCategory.Name,
            CreatedAt = item.CreatedAt,
            CreatedBy = item.CreatedBy
        };
    }
}
