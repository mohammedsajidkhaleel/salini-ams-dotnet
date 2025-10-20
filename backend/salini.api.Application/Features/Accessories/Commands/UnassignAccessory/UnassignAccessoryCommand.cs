using salini.api.Application.Common.Interfaces;
using salini.api.Domain.Entities;
using salini.api.Domain.Enums;
using salini.api.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace salini.api.Application.Features.Accessories.Commands.UnassignAccessory;

public record UnassignAccessoryCommand : ICommand<bool>
{
    public string AccessoryId { get; init; } = string.Empty;
    public string EmployeeId { get; init; } = string.Empty;
    public int? Quantity { get; init; } // If null, unassign all
    public string? Notes { get; init; }
}

public class UnassignAccessoryCommandHandler : IRequestHandler<UnassignAccessoryCommand, bool>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public UnassignAccessoryCommandHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<bool> Handle(UnassignAccessoryCommand request, CancellationToken cancellationToken)
    {
        // Find the assignment
        var assignment = await _context.EmployeeAccessories
            .FirstOrDefaultAsync(ea => ea.AccessoryId == request.AccessoryId && 
                                     ea.EmployeeId == request.EmployeeId && 
                                     ea.Status == AssignmentStatus.Assigned, cancellationToken);

        if (assignment == null)
        {
            throw new NotFoundException($"No active assignment found for accessory '{request.AccessoryId}' and employee '{request.EmployeeId}'.");
        }

        // If no quantity specified, unassign all
        if (request.Quantity == null || request.Quantity >= assignment.Quantity)
        {
            // Mark as returned
            assignment.Status = AssignmentStatus.Returned;
            assignment.ReturnedDate = DateTime.UtcNow;
            assignment.UpdatedAt = DateTime.UtcNow;
            assignment.UpdatedBy = _currentUserService.UserId;
            
            if (!string.IsNullOrEmpty(request.Notes))
            {
                assignment.Notes = string.IsNullOrEmpty(assignment.Notes) 
                    ? request.Notes 
                    : $"{assignment.Notes}\nReturned: {request.Notes}";
            }
        }
        else
        {
            // Partial return - reduce quantity
            if (request.Quantity > assignment.Quantity)
            {
                throw new ValidationException($"Cannot return {request.Quantity} items. Only {assignment.Quantity} items are assigned.");
            }

            assignment.Quantity -= request.Quantity.Value;
            assignment.UpdatedAt = DateTime.UtcNow;
            assignment.UpdatedBy = _currentUserService.UserId;
            
            if (!string.IsNullOrEmpty(request.Notes))
            {
                assignment.Notes = string.IsNullOrEmpty(assignment.Notes) 
                    ? $"Partial return: {request.Notes}" 
                    : $"{assignment.Notes}\nPartial return: {request.Notes}";
            }
        }

        await _context.SaveChangesAsync(cancellationToken);

        return true;
    }
}
