using MediatR;
using salini.api.Application.Common.Interfaces;
using salini.api.Domain.Entities;
using salini.api.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace salini.api.Application.Features.SimCards.Commands.AssignSimCard;

public record AssignSimCardCommand : IRequest
{
    public string SimCardId { get; init; } = string.Empty;
    public string EmployeeId { get; init; } = string.Empty;
    public string? Notes { get; init; }
}

public class AssignSimCardCommandHandler : IRequestHandler<AssignSimCardCommand>
{
    private readonly IApplicationDbContext _context;

    public AssignSimCardCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task Handle(AssignSimCardCommand request, CancellationToken cancellationToken)
    {
        var simCard = await _context.SimCards
            .FirstOrDefaultAsync(s => s.Id == request.SimCardId, cancellationToken);

        if (simCard == null)
        {
            throw new KeyNotFoundException($"SIM card with ID {request.SimCardId} not found.");
        }

        var employee = await _context.Employees
            .FirstOrDefaultAsync(e => e.Id == request.EmployeeId, cancellationToken);

        if (employee == null)
        {
            throw new KeyNotFoundException($"Employee with ID {request.EmployeeId} not found.");
        }

        // Check if SIM card is already assigned
        if (!string.IsNullOrEmpty(simCard.AssignedTo))
        {
            throw new InvalidOperationException($"SIM card {simCard.SimAccountNo} is already assigned to another employee.");
        }

        // Update SIM card assignment
        simCard.AssignedTo = request.EmployeeId;
        simCard.UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc);
        simCard.UpdatedBy = "System"; // TODO: Get from current user context

        // Create assignment record
        var assignment = new EmployeeSimCard
        {
            Id = Guid.NewGuid().ToString(),
            EmployeeId = request.EmployeeId,
            SimCardId = request.SimCardId,
            AssignedDate = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc),
            Status = AssignmentStatus.Assigned,
            Notes = request.Notes,
            CreatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc),
            CreatedBy = "System" // TODO: Get from current user context
        };

        _context.EmployeeSimCards.Add(assignment);
        await _context.SaveChangesAsync(cancellationToken);
    }
}
