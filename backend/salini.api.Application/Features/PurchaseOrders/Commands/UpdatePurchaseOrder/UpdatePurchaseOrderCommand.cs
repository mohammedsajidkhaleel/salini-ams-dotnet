using MediatR;
using salini.api.Application.Common.Interfaces;
using salini.api.Application.DTOs.PurchaseOrder;
using salini.api.Domain.Enums;

namespace salini.api.Application.Features.PurchaseOrders.Commands.UpdatePurchaseOrder;

public record UpdatePurchaseOrderCommand : IRequest<PurchaseOrderDto>
{
    public string Id { get; init; } = string.Empty;
    public string PoNumber { get; init; } = string.Empty;
    public DateTime PoDate { get; init; }
    public DateTime? ExpectedDeliveryDate { get; init; }
    public DateTime? ActualDeliveryDate { get; init; }
    public PurchaseOrderStatus Status { get; init; }
    public string? Notes { get; init; }
    public string? RequestedById { get; init; }
    public string SupplierId { get; init; } = string.Empty;
    public string ProjectId { get; init; } = string.Empty;
}

public class UpdatePurchaseOrderCommandHandler : IRequestHandler<UpdatePurchaseOrderCommand, PurchaseOrderDto>
{
    private readonly IApplicationDbContext _context;

    public UpdatePurchaseOrderCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PurchaseOrderDto> Handle(UpdatePurchaseOrderCommand request, CancellationToken cancellationToken)
    {
        var purchaseOrder = await _context.PurchaseOrders.FindAsync(request.Id);
        
        if (purchaseOrder == null)
        {
            throw new KeyNotFoundException($"Purchase order with ID {request.Id} not found.");
        }

        purchaseOrder.PoNumber = request.PoNumber;
        purchaseOrder.PoDate = DateTime.SpecifyKind(request.PoDate, DateTimeKind.Utc);
        purchaseOrder.ExpectedDeliveryDate = request.ExpectedDeliveryDate.HasValue 
            ? DateTime.SpecifyKind(request.ExpectedDeliveryDate.Value, DateTimeKind.Utc) 
            : null;
        purchaseOrder.ActualDeliveryDate = request.ActualDeliveryDate.HasValue 
            ? DateTime.SpecifyKind(request.ActualDeliveryDate.Value, DateTimeKind.Utc) 
            : null;
        purchaseOrder.Status = request.Status;
        purchaseOrder.Notes = request.Notes;
        purchaseOrder.RequestedById = request.RequestedById;
        purchaseOrder.SupplierId = request.SupplierId;
        purchaseOrder.ProjectId = request.ProjectId;
        purchaseOrder.UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc);
        purchaseOrder.UpdatedBy = "System"; // TODO: Get from current user context

        await _context.SaveChangesAsync(cancellationToken);

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
            SupplierId = purchaseOrder.SupplierId,
            SupplierName = "", // TODO: Load from navigation property
            ProjectId = purchaseOrder.ProjectId,
            ProjectName = "", // TODO: Load from navigation property
            Items = purchaseOrder.Items?.Select(i => new PurchaseOrderItemDto
            {
                Id = i.Id,
                PurchaseOrderId = i.PurchaseOrderId,
                ItemId = i.ItemId,
                ItemName = "", // TODO: Load from navigation property
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
