using MediatR;
using Microsoft.EntityFrameworkCore;
using salini.api.Application.Common.Interfaces;
using salini.api.Domain.Entities;

namespace salini.api.Application.Features.ItemCategories.Commands.DeleteItemCategory;

public record DeleteItemCategoryCommand(string Id) : IRequest;

public class DeleteItemCategoryCommandHandler : IRequestHandler<DeleteItemCategoryCommand>
{
    private readonly IApplicationDbContext _context;

    public DeleteItemCategoryCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task Handle(DeleteItemCategoryCommand request, CancellationToken cancellationToken)
    {
        var itemCategory = await _context.ItemCategories
            .FirstOrDefaultAsync(ic => ic.Id == request.Id, cancellationToken);

        if (itemCategory == null)
        {
            throw new KeyNotFoundException($"Item category with ID {request.Id} not found.");
        }

        _context.ItemCategories.Remove(itemCategory);
        await _context.SaveChangesAsync(cancellationToken);
    }
}