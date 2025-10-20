using MediatR;
using salini.api.Application.Common.Interfaces;
using salini.api.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace salini.api.Application.Features.SimCards.Commands.UnassignSimCard;

public record UnassignSimCardCommand : IRequest
{
    public string SimCardId { get; init; } = string.Empty;
    public string? Notes { get; init; }
}

public class UnassignSimCardCommandHandler : IRequestHandler<UnassignSimCardCommand>
{
    private readonly IApplicationDbContext _context;

    public UnassignSimCardCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task Handle(UnassignSimCardCommand request, CancellationToken cancellationToken)
    {
        var simCard = await _context.SimCards
            .FirstOrDefaultAsync(s => s.Id == request.SimCardId, cancellationToken);

        if (simCard == null)
        {
            throw new KeyNotFoundException($"SIM card with ID {request.SimCardId} not found.");
        }

        // Check if SIM card is assigned
        if (string.IsNullOrEmpty(simCard.AssignedTo))
        {
            throw new InvalidOperationException($"SIM card {simCard.SimAccountNo} is not currently assigned.");
        }

        // Update current assignment to returned
        var currentAssignment = await _context.EmployeeSimCards
            .Where(es => es.SimCardId == request.SimCardId && es.Status == AssignmentStatus.Assigned)
            .FirstOrDefaultAsync(cancellationToken);

        if (currentAssignment != null)
        {
            currentAssignment.Status = AssignmentStatus.Returned;
            currentAssignment.ReturnedDate = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc);
            currentAssignment.Notes = request.Notes;
            currentAssignment.UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc);
            currentAssignment.UpdatedBy = "System"; // TODO: Get from current user context
        }

        // Clear assignment from SIM card
        simCard.AssignedTo = null;
        simCard.UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc);
        simCard.UpdatedBy = "System"; // TODO: Get from current user context

        await _context.SaveChangesAsync(cancellationToken);
    }
}
