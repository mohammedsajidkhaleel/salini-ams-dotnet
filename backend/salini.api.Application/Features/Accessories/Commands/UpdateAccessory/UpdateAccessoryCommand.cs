using MediatR;
using Microsoft.EntityFrameworkCore;
using salini.api.Application.Common.Interfaces;
using salini.api.Application.DTOs.Accessory;
using salini.api.Domain.Entities;

namespace salini.api.Application.Features.Accessories.Commands.UpdateAccessory;

public record UpdateAccessoryCommand : IRequest<AccessoryDto>
{
    public string Id { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    public string? Description { get; init; }
    public salini.api.Domain.Enums.Status Status { get; init; } = salini.api.Domain.Enums.Status.Active;
}

public class UpdateAccessoryCommandHandler : IRequestHandler<UpdateAccessoryCommand, AccessoryDto>
{
    private readonly IApplicationDbContext _context;

    public UpdateAccessoryCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<AccessoryDto> Handle(UpdateAccessoryCommand request, CancellationToken cancellationToken)
    {
        var accessory = await _context.Accessories
            .FirstOrDefaultAsync(a => a.Id == request.Id, cancellationToken);

        if (accessory == null)
        {
            throw new KeyNotFoundException($"Accessory with ID {request.Id} not found.");
        }

        accessory.Name = request.Name;
        accessory.Description = request.Description;
        accessory.Status = request.Status;
        accessory.UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc);
        accessory.UpdatedBy = "System";

        await _context.SaveChangesAsync(cancellationToken);

        return new AccessoryDto
        {
            Id = accessory.Id,
            Name = accessory.Name,
            Description = accessory.Description,
            Status = accessory.Status.ToString(),
            CreatedAt = accessory.CreatedAt,
            CreatedBy = accessory.CreatedBy,
            UpdatedAt = accessory.UpdatedAt,
            UpdatedBy = accessory.UpdatedBy
        };
    }
}
