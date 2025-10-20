using MediatR;
using Microsoft.EntityFrameworkCore;
using salini.api.Application.Common.Interfaces;
using salini.api.Application.DTOs.SimProvider;
using salini.api.Domain.Entities;

namespace salini.api.Application.Features.SimProviders.Commands.UpdateSimProvider;

public record UpdateSimProviderCommand : IRequest<SimProviderDto>
{
    public string Id { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    public string? Description { get; init; }
    public string? ContactInfo { get; init; }
    public bool IsActive { get; init; } = true;
}

public class UpdateSimProviderCommandHandler : IRequestHandler<UpdateSimProviderCommand, SimProviderDto>
{
    private readonly IApplicationDbContext _context;

    public UpdateSimProviderCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<SimProviderDto> Handle(UpdateSimProviderCommand request, CancellationToken cancellationToken)
    {
        var simProvider = await _context.SimProviders
            .FirstOrDefaultAsync(sp => sp.Id == request.Id, cancellationToken);

        if (simProvider == null)
        {
            throw new KeyNotFoundException($"SIM provider with ID {request.Id} not found.");
        }

        simProvider.Name = request.Name;
        simProvider.Description = request.Description;
        simProvider.ContactInfo = request.ContactInfo;
        simProvider.IsActive = request.IsActive;
        simProvider.UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc);
        simProvider.UpdatedBy = "System";

        await _context.SaveChangesAsync(cancellationToken);

        return new SimProviderDto
        {
            Id = simProvider.Id,
            Name = simProvider.Name,
            Description = simProvider.Description,
            ContactInfo = simProvider.ContactInfo,
            IsActive = simProvider.IsActive,
            CreatedAt = simProvider.CreatedAt,
            CreatedBy = simProvider.CreatedBy,
            UpdatedAt = simProvider.UpdatedAt,
            UpdatedBy = simProvider.UpdatedBy
        };
    }
}
