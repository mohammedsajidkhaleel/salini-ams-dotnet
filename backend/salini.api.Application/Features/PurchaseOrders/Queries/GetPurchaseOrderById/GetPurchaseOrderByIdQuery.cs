using MediatR;
using Microsoft.EntityFrameworkCore;
using salini.api.Application.Common.Interfaces;
using salini.api.Application.DTOs.PurchaseOrder;

namespace salini.api.Application.Features.PurchaseOrders.Queries.GetPurchaseOrderById;

public record GetPurchaseOrderByIdQuery : IRequest<PurchaseOrderDto>
{
    public string Id { get; init; } = string.Empty;
}

public class GetPurchaseOrderByIdQueryHandler : IRequestHandler<GetPurchaseOrderByIdQuery, PurchaseOrderDto>
{
    private readonly IApplicationDbContext _context;

    public GetPurchaseOrderByIdQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PurchaseOrderDto> Handle(GetPurchaseOrderByIdQuery request, CancellationToken cancellationToken)
    {
        var purchaseOrder = await _context.PurchaseOrders
            .Include(po => po.Supplier)
            .Include(po => po.Project)
            .Include(po => po.RequestedBy)
            .Include(po => po.Items)
                .ThenInclude(item => item.Item)
            .FirstOrDefaultAsync(po => po.Id == request.Id, cancellationToken);

        if (purchaseOrder == null)
        {
            throw new KeyNotFoundException($"Purchase order with ID {request.Id} not found.");
        }

        return new PurchaseOrderDto
        {
            Id = purchaseOrder.Id,
            PoNumber = purchaseOrder.PoNumber,
            PoDate = purchaseOrder.PoDate,
            ExpectedDeliveryDate = purchaseOrder.ExpectedDeliveryDate,
            ActualDeliveryDate = purchaseOrder.ActualDeliveryDate,
            Status = purchaseOrder.Status,
            TotalAmount = purchaseOrder.Items?.Sum(i => i.Quantity * i.UnitPrice),
            Notes = purchaseOrder.Notes,
            RequestedById = purchaseOrder.RequestedById,
            RequestedByName = purchaseOrder.RequestedBy != null ? $"{purchaseOrder.RequestedBy.FirstName} {purchaseOrder.RequestedBy.LastName}" : null,
            SupplierId = purchaseOrder.SupplierId,
            SupplierName = purchaseOrder.Supplier?.Name ?? "",
            ProjectId = purchaseOrder.ProjectId,
            ProjectName = purchaseOrder.Project?.Name ?? "",
            Items = purchaseOrder.Items?.Select(i => new PurchaseOrderItemDto
            {
                Id = i.Id,
                PurchaseOrderId = i.PurchaseOrderId,
                ItemId = i.ItemId,
                ItemName = i.Item?.Name ?? "",
                Quantity = i.Quantity,
                UnitPrice = i.UnitPrice,
                TotalPrice = i.Quantity * i.UnitPrice,
                Notes = i.Notes
            }).ToList() ?? new List<PurchaseOrderItemDto>(),
            CreatedAt = purchaseOrder.CreatedAt,
            UpdatedAt = purchaseOrder.UpdatedAt,
            CreatedBy = purchaseOrder.CreatedBy,
            UpdatedBy = purchaseOrder.UpdatedBy
        };
    }
}
