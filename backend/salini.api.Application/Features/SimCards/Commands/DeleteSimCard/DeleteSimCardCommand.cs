using MediatR;
using salini.api.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace salini.api.Application.Features.SimCards.Commands.DeleteSimCard;

public record DeleteSimCardCommand(string Id) : IRequest;

public class DeleteSimCardCommandHandler : IRequestHandler<DeleteSimCardCommand>
{
    private readonly IApplicationDbContext _context;

    public DeleteSimCardCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task Handle(DeleteSimCardCommand request, CancellationToken cancellationToken)
    {
        var simCard = await _context.SimCards
            .FirstOrDefaultAsync(s => s.Id == request.Id, cancellationToken);

        if (simCard == null)
        {
            throw new KeyNotFoundException($"SIM card with ID {request.Id} not found.");
        }

        _context.SimCards.Remove(simCard);
        await _context.SaveChangesAsync(cancellationToken);
    }
}
