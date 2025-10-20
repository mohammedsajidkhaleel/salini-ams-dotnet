using MediatR;
using Microsoft.EntityFrameworkCore;
using salini.api.Application.Common.Interfaces;

namespace salini.api.Application.Features.PurchaseOrders.Commands.DeletePurchaseOrder;

public record DeletePurchaseOrderCommand : IRequest
{
    public string Id { get; init; } = string.Empty;
}

public class DeletePurchaseOrderCommandHandler : IRequestHandler<DeletePurchaseOrderCommand>
{
    private readonly IApplicationDbContext _context;

    public DeletePurchaseOrderCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task Handle(DeletePurchaseOrderCommand request, CancellationToken cancellationToken)
    {
        var purchaseOrder = await _context.PurchaseOrders.FindAsync(request.Id);
        
        if (purchaseOrder == null)
        {
            throw new KeyNotFoundException($"Purchase order with ID {request.Id} not found.");
        }

        try
        {
            // Delete associated items first (due to foreign key constraint)
            var items = await _context.PurchaseOrderItems
                .Where(i => i.PurchaseOrderId == request.Id)
                .ToListAsync(cancellationToken);
            
            if (items.Any())
            {
                _context.PurchaseOrderItems.RemoveRange(items);
            }

            // Delete the purchase order
            _context.PurchaseOrders.Remove(purchaseOrder);

            await _context.SaveChangesAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException($"Error deleting purchase order {request.Id}: {ex.Message}", ex);
        }
    }
}
