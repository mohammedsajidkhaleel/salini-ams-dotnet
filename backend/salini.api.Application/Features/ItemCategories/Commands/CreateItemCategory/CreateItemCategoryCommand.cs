using MediatR;
using Microsoft.EntityFrameworkCore;
using salini.api.Application.Common.Interfaces;
using salini.api.Application.DTOs.ItemCategory;
using salini.api.Domain.Entities;

namespace salini.api.Application.Features.ItemCategories.Commands.CreateItemCategory;

public record CreateItemCategoryCommand : IRequest<ItemCategoryDto>
{
    public string Name { get; init; } = string.Empty;
    public string? Description { get; init; }
    public salini.api.Domain.Enums.Status Status { get; init; } = salini.api.Domain.Enums.Status.Active;
}

public class CreateItemCategoryCommandHandler : IRequestHandler<CreateItemCategoryCommand, ItemCategoryDto>
{
    private readonly IApplicationDbContext _context;

    public CreateItemCategoryCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ItemCategoryDto> Handle(CreateItemCategoryCommand request, CancellationToken cancellationToken)
    {
        var itemCategory = new ItemCategory
        {
            Id = Guid.NewGuid().ToString(),
            Name = request.Name,
            Description = request.Description,
            Status = request.Status,
            CreatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc),
            CreatedBy = "System"
        };

        _context.ItemCategories.Add(itemCategory);
        await _context.SaveChangesAsync(cancellationToken);

        return new ItemCategoryDto
        {
            Id = itemCategory.Id,
            Name = itemCategory.Name,
            Description = itemCategory.Description,
            Status = itemCategory.Status.ToString(),
            CreatedAt = itemCategory.CreatedAt,
            CreatedBy = itemCategory.CreatedBy
        };
    }
}