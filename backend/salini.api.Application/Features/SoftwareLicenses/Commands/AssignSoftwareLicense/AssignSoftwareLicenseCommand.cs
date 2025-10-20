using salini.api.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace salini.api.Application.Features.SoftwareLicenses.Commands.AssignSoftwareLicense;

public record AssignSoftwareLicenseCommand : ICommand<bool>
{
    public string SoftwareLicenseId { get; init; } = string.Empty;
    public string EmployeeId { get; init; } = string.Empty;
    public string? Notes { get; init; }
}

public class AssignSoftwareLicenseCommandHandler : IRequestHandler<AssignSoftwareLicenseCommand, bool>
{
    private readonly IApplicationDbContext _context;

    public AssignSoftwareLicenseCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(AssignSoftwareLicenseCommand request, CancellationToken cancellationToken)
    {
        // Check if software license exists and is active
        var softwareLicense = await _context.SoftwareLicenses
            .FirstOrDefaultAsync(sl => sl.Id == request.SoftwareLicenseId, cancellationToken);

        if (softwareLicense == null)
        {
            throw new salini.api.Domain.Exceptions.NotFoundException($"Software license with ID '{request.SoftwareLicenseId}' not found.");
        }

        if (softwareLicense.Status != salini.api.Domain.Enums.SoftwareLicenseStatus.Active)
        {
            throw new InvalidOperationException("Cannot assign inactive software license.");
        }

        // Check if employee exists and is active
        var employee = await _context.Employees
            .FirstOrDefaultAsync(e => e.Id == request.EmployeeId, cancellationToken);

        if (employee == null)
        {
            throw new salini.api.Domain.Exceptions.NotFoundException($"Employee with ID '{request.EmployeeId}' not found.");
        }

        if (employee.Status != salini.api.Domain.Enums.Status.Active)
        {
            throw new InvalidOperationException("Cannot assign license to inactive employee.");
        }

        // Check if employee is already assigned to this license
        var existingAssignment = await _context.EmployeeSoftwareLicenses
            .FirstOrDefaultAsync(esl => 
                esl.SoftwareLicenseId == request.SoftwareLicenseId && 
                esl.EmployeeId == request.EmployeeId &&
                esl.Status == salini.api.Domain.Enums.AssignmentStatus.Assigned, 
                cancellationToken);

        if (existingAssignment != null)
        {
            throw new InvalidOperationException("Employee is already assigned to this software license.");
        }

        // Check if there are available seats
        var assignedCount = await _context.EmployeeSoftwareLicenses
            .CountAsync(esl => 
                esl.SoftwareLicenseId == request.SoftwareLicenseId && 
                esl.Status == salini.api.Domain.Enums.AssignmentStatus.Assigned, 
                cancellationToken);

        if (softwareLicense.Seats.HasValue && assignedCount >= softwareLicense.Seats.Value)
        {
            throw new InvalidOperationException("No available seats for this software license.");
        }

        // Create new assignment
        var assignment = new salini.api.Domain.Entities.EmployeeSoftwareLicense
        {
            Id = Guid.NewGuid().ToString(),
            SoftwareLicenseId = request.SoftwareLicenseId,
            EmployeeId = request.EmployeeId,
            AssignedDate = DateTime.UtcNow,
            Status = salini.api.Domain.Enums.AssignmentStatus.Assigned,
            Notes = request.Notes,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = "System" // TODO: Get from current user context
        };

        _context.EmployeeSoftwareLicenses.Add(assignment);
        await _context.SaveChangesAsync(cancellationToken);

        return true;
    }
}
