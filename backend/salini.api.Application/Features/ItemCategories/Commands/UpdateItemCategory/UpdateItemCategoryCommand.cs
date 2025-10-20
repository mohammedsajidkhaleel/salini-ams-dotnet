using MediatR;
using Microsoft.EntityFrameworkCore;
using salini.api.Application.Common.Interfaces;
using salini.api.Application.DTOs.ItemCategory;
using salini.api.Domain.Entities;

namespace salini.api.Application.Features.ItemCategories.Commands.UpdateItemCategory;

public record UpdateItemCategoryCommand : IRequest<ItemCategoryDto>
{
    public string Id { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    public string? Description { get; init; }
    public salini.api.Domain.Enums.Status Status { get; init; } = salini.api.Domain.Enums.Status.Active;
}

public class UpdateItemCategoryCommandHandler : IRequestHandler<UpdateItemCategoryCommand, ItemCategoryDto>
{
    private readonly IApplicationDbContext _context;

    public UpdateItemCategoryCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ItemCategoryDto> Handle(UpdateItemCategoryCommand request, CancellationToken cancellationToken)
    {
        var itemCategory = await _context.ItemCategories
            .FirstOrDefaultAsync(ic => ic.Id == request.Id, cancellationToken);

        if (itemCategory == null)
        {
            throw new KeyNotFoundException($"Item category with ID {request.Id} not found.");
        }

        itemCategory.Name = request.Name;
        itemCategory.Description = request.Description;
        itemCategory.Status = request.Status;
        itemCategory.UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc);
        itemCategory.UpdatedBy = "System";

        await _context.SaveChangesAsync(cancellationToken);

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