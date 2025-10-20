using MediatR;
using Microsoft.EntityFrameworkCore;
using salini.api.Application.Common.Interfaces;
using salini.api.Domain.Entities;

namespace salini.api.Application.Features.Items.Commands.DeleteItem;

public record DeleteItemCommand(string Id) : IRequest;

public class DeleteItemCommandHandler : IRequestHandler<DeleteItemCommand>
{
    private readonly IApplicationDbContext _context;

    public DeleteItemCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task Handle(DeleteItemCommand request, CancellationToken cancellationToken)
    {
        var item = await _context.Items
            .FirstOrDefaultAsync(i => i.Id == request.Id, cancellationToken);

        if (item == null)
        {
            throw new KeyNotFoundException($"Item with ID {request.Id} not found.");
        }

        _context.Items.Remove(item);
        await _context.SaveChangesAsync(cancellationToken);
    }
}
