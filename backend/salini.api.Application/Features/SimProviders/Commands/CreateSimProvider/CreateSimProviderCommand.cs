using MediatR;
using Microsoft.EntityFrameworkCore;
using salini.api.Application.Common.Interfaces;
using salini.api.Application.DTOs.SimProvider;
using salini.api.Domain.Entities;

namespace salini.api.Application.Features.SimProviders.Commands.CreateSimProvider;

public record CreateSimProviderCommand : IRequest<SimProviderDto>
{
    public string Name { get; init; } = string.Empty;
    public string? Description { get; init; }
    public string? ContactInfo { get; init; }
    public bool IsActive { get; init; } = true;
}

public class CreateSimProviderCommandHandler : IRequestHandler<CreateSimProviderCommand, SimProviderDto>
{
    private readonly IApplicationDbContext _context;

    public CreateSimProviderCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<SimProviderDto> Handle(CreateSimProviderCommand request, CancellationToken cancellationToken)
    {
        var simProvider = new SimProvider
        {
            Id = Guid.NewGuid().ToString(),
            Name = request.Name,
            Description = request.Description,
            ContactInfo = request.ContactInfo,
            IsActive = request.IsActive,
            CreatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc),
            CreatedBy = "System"
        };

        _context.SimProviders.Add(simProvider);
        await _context.SaveChangesAsync(cancellationToken);

        return new SimProviderDto
        {
            Id = simProvider.Id,
            Name = simProvider.Name,
            Description = simProvider.Description,
            ContactInfo = simProvider.ContactInfo,
            IsActive = simProvider.IsActive,
            CreatedAt = simProvider.CreatedAt,
            CreatedBy = simProvider.CreatedBy
        };
    }
}
