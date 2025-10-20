using MediatR;
using salini.api.Application.Common.Interfaces;
using salini.api.Application.DTOs.PurchaseOrder;
using salini.api.Domain.Entities;
using salini.api.Domain.Enums;

namespace salini.api.Application.Features.PurchaseOrders.Commands.CreatePurchaseOrder;

public record CreatePurchaseOrderCommand : IRequest<PurchaseOrderDto>
{
    public string PoNumber { get; init; } = string.Empty;
    public DateTime PoDate { get; init; }
    public DateTime? ExpectedDeliveryDate { get; init; }
    public PurchaseOrderStatus Status { get; init; } = PurchaseOrderStatus.Draft;
    public string? Notes { get; init; }
    public string? RequestedById { get; init; }
    public string SupplierId { get; init; } = string.Empty;
    public string ProjectId { get; init; } = string.Empty;
    public List<PurchaseOrderItemCreateDto> Items { get; init; } = new();
}

public class CreatePurchaseOrderCommandHandler : IRequestHandler<CreatePurchaseOrderCommand, PurchaseOrderDto>
{
    private readonly IApplicationDbContext _context;

    public CreatePurchaseOrderCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PurchaseOrderDto> Handle(CreatePurchaseOrderCommand request, CancellationToken cancellationToken)
    {
        var purchaseOrder = new PurchaseOrder
        {
            Id = Guid.NewGuid().ToString(),
            PoNumber = request.PoNumber,
            PoDate = DateTime.SpecifyKind(request.PoDate, DateTimeKind.Utc),
            ExpectedDeliveryDate = request.ExpectedDeliveryDate.HasValue 
                ? DateTime.SpecifyKind(request.ExpectedDeliveryDate.Value, DateTimeKind.Utc) 
                : null,
            Status = request.Status,
            Notes = request.Notes,
            RequestedById = request.RequestedById,
            SupplierId = request.SupplierId,
            ProjectId = request.ProjectId,
            CreatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc),
            CreatedBy = "System" // TODO: Get from current user context
        };

        _context.PurchaseOrders.Add(purchaseOrder);

        // Add items
        foreach (var itemDto in request.Items)
        {
            var item = new PurchaseOrderItem
            {
                Id = Guid.NewGuid().ToString(),
                PurchaseOrderId = purchaseOrder.Id,
                ItemId = itemDto.ItemId,
                Quantity = itemDto.Quantity,
                UnitPrice = itemDto.UnitPrice,
                Notes = itemDto.Notes,
                CreatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc),
                CreatedBy = "System"
            };
            _context.PurchaseOrderItems.Add(item);
        }

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
