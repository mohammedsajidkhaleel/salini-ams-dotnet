using MediatR;
using Microsoft.EntityFrameworkCore;
using salini.api.Application.Common.Interfaces;
using salini.api.Application.DTOs.Accessory;
using salini.api.Domain.Entities;

namespace salini.api.Application.Features.Accessories.Commands.CreateAccessory;

public record CreateAccessoryCommand : IRequest<AccessoryDto>
{
    public string Name { get; init; } = string.Empty;
    public string? Description { get; init; }
    public salini.api.Domain.Enums.Status Status { get; init; } = salini.api.Domain.Enums.Status.Active;
}

public class CreateAccessoryCommandHandler : IRequestHandler<CreateAccessoryCommand, AccessoryDto>
{
    private readonly IApplicationDbContext _context;

    public CreateAccessoryCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<AccessoryDto> Handle(CreateAccessoryCommand request, CancellationToken cancellationToken)
    {
        var accessory = new Accessory
        {
            Id = Guid.NewGuid().ToString(),
            Name = request.Name,
            Description = request.Description,
            Status = request.Status,
            CreatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc),
            CreatedBy = "System"
        };

        _context.Accessories.Add(accessory);
        await _context.SaveChangesAsync(cancellationToken);

        return new AccessoryDto
        {
            Id = accessory.Id,
            Name = accessory.Name,
            Description = accessory.Description,
            Status = accessory.Status.ToString(),
            CreatedAt = accessory.CreatedAt,
            CreatedBy = accessory.CreatedBy
        };
    }
}
