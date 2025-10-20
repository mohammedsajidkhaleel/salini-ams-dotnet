using MediatR;
using Microsoft.EntityFrameworkCore;
using salini.api.Application.Common.Interfaces;
using salini.api.Application.DTOs.CostCenter;
using salini.api.Domain.Entities;

namespace salini.api.Application.Features.CostCenters.Commands.UpdateCostCenter;

public record UpdateCostCenterCommand : IRequest<CostCenterDto>
{
    public string Id { get; init; } = string.Empty;
    public string Code { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    public string? Description { get; init; }
    public salini.api.Domain.Enums.Status Status { get; init; } = salini.api.Domain.Enums.Status.Active;
}

public class UpdateCostCenterCommandHandler : IRequestHandler<UpdateCostCenterCommand, CostCenterDto>
{
    private readonly IApplicationDbContext _context;

    public UpdateCostCenterCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<CostCenterDto> Handle(UpdateCostCenterCommand request, CancellationToken cancellationToken)
    {
        var costCenter = await _context.CostCenters
            .FirstOrDefaultAsync(cc => cc.Id == request.Id, cancellationToken);

        if (costCenter == null)
        {
            throw new KeyNotFoundException($"Cost center with ID {request.Id} not found.");
        }

        costCenter.Code = request.Code;
        costCenter.Name = request.Name;
        costCenter.Description = request.Description;
        costCenter.Status = request.Status;
        costCenter.UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc);
        costCenter.UpdatedBy = "System"; // TODO: Get from current user context

        await _context.SaveChangesAsync(cancellationToken);

        return new CostCenterDto
        {
            Id = costCenter.Id,
            Code = costCenter.Code,
            Name = costCenter.Name,
            Description = costCenter.Description,
            Status = costCenter.Status.ToString(),
            CreatedAt = costCenter.CreatedAt,
            CreatedBy = costCenter.CreatedBy,
            UpdatedAt = costCenter.UpdatedAt,
            UpdatedBy = costCenter.UpdatedBy
        };
    }
}
