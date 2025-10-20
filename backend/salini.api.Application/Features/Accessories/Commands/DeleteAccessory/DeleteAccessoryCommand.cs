using MediatR;
using Microsoft.EntityFrameworkCore;
using salini.api.Application.Common.Interfaces;

namespace salini.api.Application.Features.Accessories.Commands.DeleteAccessory;

public record DeleteAccessoryCommand(string Id) : IRequest;

public class DeleteAccessoryCommandHandler : IRequestHandler<DeleteAccessoryCommand>
{
    private readonly IApplicationDbContext _context;

    public DeleteAccessoryCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task Handle(DeleteAccessoryCommand request, CancellationToken cancellationToken)
    {
        var accessory = await _context.Accessories
            .FirstOrDefaultAsync(a => a.Id == request.Id, cancellationToken);

        if (accessory == null)
        {
            throw new KeyNotFoundException($"Accessory with ID {request.Id} not found.");
        }

        _context.Accessories.Remove(accessory);
        await _context.SaveChangesAsync(cancellationToken);
    }
}
