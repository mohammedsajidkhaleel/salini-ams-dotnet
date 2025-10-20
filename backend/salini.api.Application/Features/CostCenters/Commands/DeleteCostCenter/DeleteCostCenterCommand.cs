using MediatR;
using Microsoft.EntityFrameworkCore;
using salini.api.Application.Common.Interfaces;
using salini.api.Domain.Entities;

namespace salini.api.Application.Features.CostCenters.Commands.DeleteCostCenter;

public record DeleteCostCenterCommand(string Id) : IRequest;

public class DeleteCostCenterCommandHandler : IRequestHandler<DeleteCostCenterCommand>
{
    private readonly IApplicationDbContext _context;

    public DeleteCostCenterCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task Handle(DeleteCostCenterCommand request, CancellationToken cancellationToken)
    {
        var costCenter = await _context.CostCenters
            .FirstOrDefaultAsync(cc => cc.Id == request.Id, cancellationToken);

        if (costCenter == null)
        {
            throw new KeyNotFoundException($"Cost center with ID {request.Id} not found.");
        }

        _context.CostCenters.Remove(costCenter);
        await _context.SaveChangesAsync(cancellationToken);
    }
}
