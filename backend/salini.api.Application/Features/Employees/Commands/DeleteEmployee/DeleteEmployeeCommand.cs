using salini.api.Application.Common.Interfaces;
using salini.api.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace salini.api.Application.Features.Employees.Commands.DeleteEmployee;

public record DeleteEmployeeCommand(string Id) : ICommand<bool>;

public class DeleteEmployeeCommandHandler : IRequestHandler<DeleteEmployeeCommand, bool>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public DeleteEmployeeCommandHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<bool> Handle(DeleteEmployeeCommand request, CancellationToken cancellationToken)
    {
        var employee = await _context.Employees
            .FirstOrDefaultAsync(e => e.Id == request.Id, cancellationToken);

        if (employee == null)
        {
            throw new NotFoundException($"Employee with ID '{request.Id}' not found.");
        }

        // Check if employee has any assigned assets, SIM cards, or software licenses
        var hasAssignedAssets = await _context.EmployeeAssets
            .AnyAsync(ea => ea.EmployeeId == request.Id, cancellationToken);
            
        var hasAssignedSimCards = await _context.EmployeeSimCards
            .AnyAsync(esc => esc.EmployeeId == request.Id, cancellationToken);
            
        var hasAssignedSoftwareLicenses = await _context.EmployeeSoftwareLicenses
            .AnyAsync(esl => esl.EmployeeId == request.Id, cancellationToken);

        if (hasAssignedAssets || hasAssignedSimCards || hasAssignedSoftwareLicenses)
        {
            throw new ValidationException("Cannot delete employee with assigned assets, SIM cards, or software licenses. Please unassign all items first.");
        }

        _context.Employees.Remove(employee);
        await _context.SaveChangesAsync(cancellationToken);

        return true;
    }
}
