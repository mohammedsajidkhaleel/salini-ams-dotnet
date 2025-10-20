using MediatR;
using Microsoft.EntityFrameworkCore;
using salini.api.Application.Common.Interfaces;
using salini.api.Domain.Entities;

namespace salini.api.Application.Features.SimTypes.Commands.DeleteSimType;

public record DeleteSimTypeCommand(string Id) : IRequest;

public class DeleteSimTypeCommandHandler : IRequestHandler<DeleteSimTypeCommand>
{
    private readonly IApplicationDbContext _context;

    public DeleteSimTypeCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task Handle(DeleteSimTypeCommand request, CancellationToken cancellationToken)
    {
        var simType = await _context.SimTypes
            .FirstOrDefaultAsync(st => st.Id == request.Id, cancellationToken);

        if (simType == null)
        {
            throw new KeyNotFoundException($"SIM type with ID {request.Id} not found.");
        }

        _context.SimTypes.Remove(simType);
        await _context.SaveChangesAsync(cancellationToken);
    }
}
