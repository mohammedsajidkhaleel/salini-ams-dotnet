using MediatR;
using Microsoft.EntityFrameworkCore;
using salini.api.Application.Common.Interfaces;
using salini.api.Application.DTOs.SimCardPlan;
using salini.api.Domain.Entities;

namespace salini.api.Application.Features.SimCardPlans.Commands.CreateSimCardPlan;

public record CreateSimCardPlanCommand : IRequest<SimCardPlanDto>
{
    public string Name { get; init; } = string.Empty;
    public string? Description { get; init; }
    public string? DataLimit { get; init; }
    public decimal? MonthlyFee { get; init; }
    public bool IsActive { get; init; } = true;
    public string? ProviderId { get; init; }
}

public class CreateSimCardPlanCommandHandler : IRequestHandler<CreateSimCardPlanCommand, SimCardPlanDto>
{
    private readonly IApplicationDbContext _context;

    public CreateSimCardPlanCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<SimCardPlanDto> Handle(CreateSimCardPlanCommand request, CancellationToken cancellationToken)
    {
        SimProvider? provider = null;
        if (!string.IsNullOrEmpty(request.ProviderId))
        {
            provider = await _context.SimProviders
                .FirstOrDefaultAsync(sp => sp.Id == request.ProviderId, cancellationToken);
        }

        var simCardPlan = new SimCardPlan
        {
            Id = Guid.NewGuid().ToString(),
            Name = request.Name,
            Description = request.Description,
            DataLimit = request.DataLimit,
            MonthlyFee = request.MonthlyFee,
            IsActive = request.IsActive,
            ProviderId = request.ProviderId,
            CreatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc),
            CreatedBy = "System"
        };

        _context.SimCardPlans.Add(simCardPlan);
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
            ProviderName = provider?.Name,
            CreatedAt = simCardPlan.CreatedAt,
            CreatedBy = simCardPlan.CreatedBy
        };
    }
}
