using MediatR;
using Microsoft.EntityFrameworkCore;
using salini.api.Application.Common.Interfaces;
using salini.api.Domain.Entities;

namespace salini.api.Application.Features.SimProviders.Commands.DeleteSimProvider;

public record DeleteSimProviderCommand(string Id) : IRequest;

public class DeleteSimProviderCommandHandler : IRequestHandler<DeleteSimProviderCommand>
{
    private readonly IApplicationDbContext _context;

    public DeleteSimProviderCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task Handle(DeleteSimProviderCommand request, CancellationToken cancellationToken)
    {
        var simProvider = await _context.SimProviders
            .FirstOrDefaultAsync(sp => sp.Id == request.Id, cancellationToken);

        if (simProvider == null)
        {
            throw new KeyNotFoundException($"SIM provider with ID {request.Id} not found.");
        }

        _context.SimProviders.Remove(simProvider);
        await _context.SaveChangesAsync(cancellationToken);
    }
}
