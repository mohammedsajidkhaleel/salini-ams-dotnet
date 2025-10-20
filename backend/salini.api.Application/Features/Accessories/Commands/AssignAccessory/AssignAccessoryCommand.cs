using salini.api.Application.Common.Interfaces;
using salini.api.Domain.Entities;
using salini.api.Domain.Enums;
using salini.api.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace salini.api.Application.Features.Accessories.Commands.AssignAccessory;

public record AssignAccessoryCommand : ICommand<bool>
{
    public string AccessoryId { get; init; } = string.Empty;
    public string EmployeeId { get; init; } = string.Empty;
    public int Quantity { get; init; } = 1;
    public string? Notes { get; init; }
}

public class AssignAccessoryCommandHandler : IRequestHandler<AssignAccessoryCommand, bool>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public AssignAccessoryCommandHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<bool> Handle(AssignAccessoryCommand request, CancellationToken cancellationToken)
    {
        // Verify accessory exists and is available
        var accessory = await _context.Accessories
            .FirstOrDefaultAsync(a => a.Id == request.AccessoryId, cancellationToken);

        if (accessory == null)
        {
            throw new NotFoundException($"Accessory with ID '{request.AccessoryId}' not found.");
        }

        if (accessory.Status != Status.Active)
        {
            throw new ValidationException($"Accessory '{accessory.Name}' is not available for assignment. Current status: {accessory.Status}");
        }

        // Verify employee exists and is active
        var employee = await _context.Employees
            .FirstOrDefaultAsync(e => e.Id == request.EmployeeId, cancellationToken);

        if (employee == null)
        {
            throw new NotFoundException($"Employee with ID '{request.EmployeeId}' not found.");
        }

        if (employee.Status != Status.Active)
        {
            throw new ValidationException($"Employee '{employee.EmployeeId}' is not active. Current status: {employee.Status}");
        }

        // Validate quantity
        if (request.Quantity <= 0)
        {
            throw new ValidationException("Quantity must be greater than 0.");
        }

        // Check if accessory is already assigned to this employee
        var existingAssignment = await _context.EmployeeAccessories
            .FirstOrDefaultAsync(ea => ea.AccessoryId == request.AccessoryId && 
                                     ea.EmployeeId == request.EmployeeId && 
                                     ea.Status == AssignmentStatus.Assigned, cancellationToken);

        if (existingAssignment != null)
        {
            // Update existing assignment quantity
            existingAssignment.Quantity += request.Quantity;
            existingAssignment.UpdatedAt = DateTime.UtcNow;
            existingAssignment.UpdatedBy = _currentUserService.UserId;
        }
        else
        {
            // Create new assignment
            var assignment = new EmployeeAccessory
            {
                Id = Guid.NewGuid().ToString(),
                EmployeeId = request.EmployeeId,
                AccessoryId = request.AccessoryId,
                Status = AssignmentStatus.Assigned,
                Quantity = request.Quantity,
                AssignedDate = DateTime.UtcNow,
                Notes = request.Notes,
                CreatedAt = DateTime.UtcNow,
                CreatedBy = _currentUserService.UserId
            };

            _context.EmployeeAccessories.Add(assignment);
        }

        await _context.SaveChangesAsync(cancellationToken);

        return true;
    }
}
