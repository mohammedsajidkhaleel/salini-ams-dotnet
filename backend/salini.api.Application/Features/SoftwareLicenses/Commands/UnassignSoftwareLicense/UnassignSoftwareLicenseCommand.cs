using salini.api.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace salini.api.Application.Features.SoftwareLicenses.Commands.UnassignSoftwareLicense;

public record UnassignSoftwareLicenseCommand : ICommand<bool>
{
    public string AssignmentId { get; init; } = string.Empty;
    public string? Notes { get; init; }
}

public class UnassignSoftwareLicenseCommandHandler : IRequestHandler<UnassignSoftwareLicenseCommand, bool>
{
    private readonly IApplicationDbContext _context;

    public UnassignSoftwareLicenseCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(UnassignSoftwareLicenseCommand request, CancellationToken cancellationToken)
    {
        // Find the assignment
        var assignment = await _context.EmployeeSoftwareLicenses
            .FirstOrDefaultAsync(esl => esl.Id == request.AssignmentId, cancellationToken);

        if (assignment == null)
        {
            throw new salini.api.Domain.Exceptions.NotFoundException($"Assignment with ID '{request.AssignmentId}' not found.");
        }

        if (assignment.Status != salini.api.Domain.Enums.AssignmentStatus.Assigned)
        {
            throw new InvalidOperationException("Assignment is not currently active.");
        }

        // Update assignment status to returned
        assignment.Status = salini.api.Domain.Enums.AssignmentStatus.Returned;
        assignment.ReturnedDate = DateTime.UtcNow;
        assignment.Notes = request.Notes ?? assignment.Notes;
        assignment.UpdatedAt = DateTime.UtcNow;
        assignment.UpdatedBy = "System"; // TODO: Get from current user context

        await _context.SaveChangesAsync(cancellationToken);

        return true;
    }
}
