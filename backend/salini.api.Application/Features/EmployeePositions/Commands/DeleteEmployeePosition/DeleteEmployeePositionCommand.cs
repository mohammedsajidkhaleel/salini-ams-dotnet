using MediatR;
using Microsoft.EntityFrameworkCore;
using salini.api.Application.Common.Interfaces;
using salini.api.Domain.Entities;

namespace salini.api.Application.Features.EmployeePositions.Commands.DeleteEmployeePosition;

public record DeleteEmployeePositionCommand(string Id) : IRequest;

public class DeleteEmployeePositionCommandHandler : IRequestHandler<DeleteEmployeePositionCommand>
{
    private readonly IApplicationDbContext _context;

    public DeleteEmployeePositionCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task Handle(DeleteEmployeePositionCommand request, CancellationToken cancellationToken)
    {
        var employeePosition = await _context.EmployeePositions
            .FirstOrDefaultAsync(ep => ep.Id == request.Id, cancellationToken);

        if (employeePosition == null)
        {
            throw new KeyNotFoundException($"Employee position with ID {request.Id} not found.");
        }

        _context.EmployeePositions.Remove(employeePosition);
        await _context.SaveChangesAsync(cancellationToken);
    }
}
