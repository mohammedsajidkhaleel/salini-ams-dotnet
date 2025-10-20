using MediatR;
using Microsoft.EntityFrameworkCore;
using salini.api.Application.Common.Interfaces;
using salini.api.Application.DTOs.SimType;
using salini.api.Domain.Entities;

namespace salini.api.Application.Features.SimTypes.Commands.UpdateSimType;

public record UpdateSimTypeCommand : IRequest<SimTypeDto>
{
    public string Id { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    public string? Description { get; init; }
    public bool IsActive { get; init; } = true;
}

public class UpdateSimTypeCommandHandler : IRequestHandler<UpdateSimTypeCommand, SimTypeDto>
{
    private readonly IApplicationDbContext _context;

    public UpdateSimTypeCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<SimTypeDto> Handle(UpdateSimTypeCommand request, CancellationToken cancellationToken)
    {
        var simType = await _context.SimTypes
            .FirstOrDefaultAsync(st => st.Id == request.Id, cancellationToken);

        if (simType == null)
        {
            throw new KeyNotFoundException($"SIM type with ID {request.Id} not found.");
        }

        simType.Name = request.Name;
        simType.Description = request.Description;
        simType.IsActive = request.IsActive;
        simType.UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc);
        simType.UpdatedBy = "System";

        await _context.SaveChangesAsync(cancellationToken);

        return new SimTypeDto
        {
            Id = simType.Id,
            Name = simType.Name,
            Description = simType.Description,
            IsActive = simType.IsActive,
            CreatedAt = simType.CreatedAt,
            CreatedBy = simType.CreatedBy,
            UpdatedAt = simType.UpdatedAt,
            UpdatedBy = simType.UpdatedBy
        };
    }
}
