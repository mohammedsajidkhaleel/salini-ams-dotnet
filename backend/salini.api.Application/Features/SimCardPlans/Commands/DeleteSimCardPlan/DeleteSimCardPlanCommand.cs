using MediatR;
using Microsoft.EntityFrameworkCore;
using salini.api.Application.Common.Interfaces;
using salini.api.Domain.Entities;

namespace salini.api.Application.Features.SimCardPlans.Commands.DeleteSimCardPlan;

public record DeleteSimCardPlanCommand(string Id) : IRequest;

public class DeleteSimCardPlanCommandHandler : IRequestHandler<DeleteSimCardPlanCommand>
{
    private readonly IApplicationDbContext _context;

    public DeleteSimCardPlanCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task Handle(DeleteSimCardPlanCommand request, CancellationToken cancellationToken)
    {
        var simCardPlan = await _context.SimCardPlans
            .FirstOrDefaultAsync(scp => scp.Id == request.Id, cancellationToken);

        if (simCardPlan == null)
        {
            throw new KeyNotFoundException($"SIM card plan with ID {request.Id} not found.");
        }

        _context.SimCardPlans.Remove(simCardPlan);
        await _context.SaveChangesAsync(cancellationToken);
    }
}
