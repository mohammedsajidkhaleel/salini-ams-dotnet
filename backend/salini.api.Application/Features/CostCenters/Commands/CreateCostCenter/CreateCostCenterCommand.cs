using MediatR;
using Microsoft.EntityFrameworkCore;
using salini.api.Application.Common.Interfaces;
using salini.api.Application.DTOs.CostCenter;
using salini.api.Domain.Entities;

namespace salini.api.Application.Features.CostCenters.Commands.CreateCostCenter;

public record CreateCostCenterCommand : IRequest<CostCenterDto>
{
    public string Code { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    public string? Description { get; init; }
    public salini.api.Domain.Enums.Status Status { get; init; } = salini.api.Domain.Enums.Status.Active;
}

public class CreateCostCenterCommandHandler : IRequestHandler<CreateCostCenterCommand, CostCenterDto>
{
    private readonly IApplicationDbContext _context;

    public CreateCostCenterCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<CostCenterDto> Handle(CreateCostCenterCommand request, CancellationToken cancellationToken)
    {
        var costCenter = new CostCenter
        {
            Id = Guid.NewGuid().ToString(),
            Code = request.Code,
            Name = request.Name,
            Description = request.Description,
            Status = request.Status,
            CreatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc),
            CreatedBy = "System" // TODO: Get from current user context
        };

        _context.CostCenters.Add(costCenter);
        await _context.SaveChangesAsync(cancellationToken);

        return new CostCenterDto
        {
            Id = costCenter.Id,
            Code = costCenter.Code,
            Name = costCenter.Name,
            Description = costCenter.Description,
            Status = costCenter.Status.ToString(),
            CreatedAt = costCenter.CreatedAt,
            CreatedBy = costCenter.CreatedBy
        };
    }
}
