using MediatR;
using Microsoft.EntityFrameworkCore;
using salini.api.Application.Common.Interfaces;
using salini.api.Application.DTOs.SimCardPlan;
using salini.api.Domain.Entities;

namespace salini.api.Application.Features.SimCardPlans.Queries.GetSimCardPlanById;

public record GetSimCardPlanByIdQuery(string Id) : IRequest<SimCardPlanDto?>;

public class GetSimCardPlanByIdQueryHandler : IRequestHandler<GetSimCardPlanByIdQuery, SimCardPlanDto?>
{
    private readonly IApplicationDbContext _context;

    public GetSimCardPlanByIdQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<SimCardPlanDto?> Handle(GetSimCardPlanByIdQuery request, CancellationToken cancellationToken)
    {
        var simCardPlan = await _context.SimCardPlans
            .Include(scp => scp.Provider)
            .FirstOrDefaultAsync(scp => scp.Id == request.Id, cancellationToken);

        if (simCardPlan == null)
        {
            return null;
        }

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
