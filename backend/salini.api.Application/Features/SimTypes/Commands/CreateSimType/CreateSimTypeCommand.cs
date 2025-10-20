using MediatR;
using Microsoft.EntityFrameworkCore;
using salini.api.Application.Common.Interfaces;
using salini.api.Application.DTOs.SimType;
using salini.api.Domain.Entities;

namespace salini.api.Application.Features.SimTypes.Commands.CreateSimType;

public record CreateSimTypeCommand : IRequest<SimTypeDto>
{
    public string Name { get; init; } = string.Empty;
    public string? Description { get; init; }
    public bool IsActive { get; init; } = true;
}

public class CreateSimTypeCommandHandler : IRequestHandler<CreateSimTypeCommand, SimTypeDto>
{
    private readonly IApplicationDbContext _context;

    public CreateSimTypeCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<SimTypeDto> Handle(CreateSimTypeCommand request, CancellationToken cancellationToken)
    {
        var simType = new SimType
        {
            Id = Guid.NewGuid().ToString(),
            Name = request.Name,
            Description = request.Description,
            IsActive = request.IsActive,
            CreatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc),
            CreatedBy = "System"
        };

        _context.SimTypes.Add(simType);
        await _context.SaveChangesAsync(cancellationToken);

        return new SimTypeDto
        {
            Id = simType.Id,
            Name = simType.Name,
            Description = simType.Description,
            IsActive = simType.IsActive,
            CreatedAt = simType.CreatedAt,
            CreatedBy = simType.CreatedBy
        };
    }
}
