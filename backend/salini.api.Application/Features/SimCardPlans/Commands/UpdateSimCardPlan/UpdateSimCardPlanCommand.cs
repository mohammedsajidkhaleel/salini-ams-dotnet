using MediatR;
using Microsoft.EntityFrameworkCore;
using salini.api.Application.Common.Interfaces;
using salini.api.Application.DTOs.SimCardPlan;
using salini.api.Domain.Entities;

namespace salini.api.Application.Features.SimCardPlans.Commands.UpdateSimCardPlan;

public record UpdateSimCardPlanCommand : IRequest<SimCardPlanDto>
{
    public string Id { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    public string? Description { get; init; }
    public string? DataLimit { get; init; }
    public decimal? MonthlyFee { get; init; }
    public bool IsActive { get; init; } = true;
    public string? ProviderId { get; init; }
}

public class UpdateSimCardPlanCommandHandler : IRequestHandler<UpdateSimCardPlanCommand, SimCardPlanDto>
{
    private readonly IApplicationDbContext _context;

    public UpdateSimCardPlanCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<SimCardPlanDto> Handle(UpdateSimCardPlanCommand request, CancellationToken cancellationToken)
    {
        var simCardPlan = await _context.SimCardPlans
            .Include(scp => scp.Provider)
            .FirstOrDefaultAsync(scp => scp.Id == request.Id, cancellationToken);

        if (simCardPlan == null)
        {
            throw new KeyNotFoundException($"SIM card plan with ID {request.Id} not found.");
        }

        simCardPlan.Name = request.Name;
        simCardPlan.Description = request.Description;
        simCardPlan.DataLimit = request.DataLimit;
        simCardPlan.MonthlyFee = request.MonthlyFee;
        simCardPlan.IsActive = request.IsActive;
        simCardPlan.ProviderId = request.ProviderId;
        simCardPlan.UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc);
        simCardPlan.UpdatedBy = "System";

        await _context.SaveChangesAsync(cancellationToken);

        return new SimCardPlanDto
        {
            Id = simCardPlan.Id,
            Name = simCardPlan.Name,
            Description = simCardPlan.Description,
            DataLimit = simCardPlan.DataLimit,
            MonthlyFee = simCardPlan.MonthlyFee,
            IsActive = simCardPlan.IsActive,
            ProviderId = simCardPlan.ProviderId,
            ProviderName = simCardPlan.Provider?.Name,
            CreatedAt = simCardPlan.CreatedAt,
            CreatedBy = simCardPlan.CreatedBy,
            UpdatedAt = simCardPlan.UpdatedAt,
            UpdatedBy = simCardPlan.UpdatedBy
        };
    }
}
