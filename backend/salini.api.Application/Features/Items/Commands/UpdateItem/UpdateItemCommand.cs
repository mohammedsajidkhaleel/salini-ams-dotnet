using MediatR;
using Microsoft.EntityFrameworkCore;
using salini.api.Application.Common.Interfaces;
using salini.api.Application.DTOs.Item;
using salini.api.Domain.Entities;

namespace salini.api.Application.Features.Items.Commands.UpdateItem;

public record UpdateItemCommand : IRequest<ItemDto>
{
    public string Id { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    public string? Description { get; init; }
    public salini.api.Domain.Enums.Status Status { get; init; } = salini.api.Domain.Enums.Status.Active;
    public string ItemCategoryId { get; init; } = string.Empty;
}

public class UpdateItemCommandHandler : IRequestHandler<UpdateItemCommand, ItemDto>
{
    private readonly IApplicationDbContext _context;

    public UpdateItemCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ItemDto> Handle(UpdateItemCommand request, CancellationToken cancellationToken)
    {
        var item = await _context.Items
            .Include(i => i.ItemCategory)
            .FirstOrDefaultAsync(i => i.Id == request.Id, cancellationToken);

        if (item == null)
        {
            throw new KeyNotFoundException($"Item with ID {request.Id} not found.");
        }

        // Verify that the ItemCategory exists
        var itemCategory = await _context.ItemCategories
            .FirstOrDefaultAsync(ic => ic.Id == request.ItemCategoryId, cancellationToken);

        if (itemCategory == null)
        {
            throw new KeyNotFoundException($"Item category with ID {request.ItemCategoryId} not found.");
        }

        item.Name = request.Name;
        item.Description = request.Description;
        item.Status = request.Status;
        item.ItemCategoryId = request.ItemCategoryId;
        item.UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc);
        item.UpdatedBy = "System"; // TODO: Get from current user context

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
            CreatedBy = item.CreatedBy,
            UpdatedAt = item.UpdatedAt,
            UpdatedBy = item.UpdatedBy
        };
    }
}
