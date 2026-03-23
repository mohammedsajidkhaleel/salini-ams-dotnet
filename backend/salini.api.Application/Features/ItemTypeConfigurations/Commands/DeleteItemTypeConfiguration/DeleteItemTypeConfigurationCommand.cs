using MediatR;
using Microsoft.EntityFrameworkCore;
using salini.api.Application.Common.Interfaces;

namespace salini.api.Application.Features.ItemConfigurations.Commands.DeleteItemConfiguration;

public record DeleteItemConfigurationCommand(string Id) : IRequest;

public class DeleteItemConfigurationCommandHandler : IRequestHandler<DeleteItemConfigurationCommand>
{
    private readonly IApplicationDbContext _context;

    public DeleteItemConfigurationCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task Handle(DeleteItemConfigurationCommand request, CancellationToken cancellationToken)
    {
        var itemConfiguration = await _context.ItemConfigurations
            .FirstOrDefaultAsync(itc => itc.Id == request.Id, cancellationToken);

        if (itemConfiguration == null)
        {
            throw new KeyNotFoundException($"Item type configuration with ID {request.Id} not found.");
        }

        _context.ItemConfigurations.Remove(itemConfiguration);
        await _context.SaveChangesAsync(cancellationToken);
    }
}
