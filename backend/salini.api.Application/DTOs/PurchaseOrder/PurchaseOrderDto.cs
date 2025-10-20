using System.ComponentModel.DataAnnotations;
using salini.api.Application.DTOs;
using salini.api.Domain.Enums;

namespace salini.api.Application.DTOs.PurchaseOrder;

public class PurchaseOrderDto : BaseDto
{
    public string PoNumber { get; set; } = string.Empty;
    public DateTime PoDate { get; set; }
    public DateTime? ExpectedDeliveryDate { get; set; }
    public DateTime? ActualDeliveryDate { get; set; }
    public PurchaseOrderStatus Status { get; set; }
    public decimal? TotalAmount { get; set; }
    public string? Notes { get; set; }
    public string? RequestedById { get; set; }
    public string? RequestedByName { get; set; }
    public string SupplierId { get; set; } = string.Empty;
    public string SupplierName { get; set; } = string.Empty;
    public string ProjectId { get; set; } = string.Empty;
    public string ProjectName { get; set; } = string.Empty;
    public List<PurchaseOrderItemDto> Items { get; set; } = new();
}

public class PurchaseOrderCreateDto
{
    [Required]
    [StringLength(100)]
    public string PoNumber { get; set; } = string.Empty;
    
    [Required]
    public DateTime PoDate { get; set; }
    
    public DateTime? ExpectedDeliveryDate { get; set; }
    
    public PurchaseOrderStatus Status { get; set; } = PurchaseOrderStatus.Draft;
    
    [StringLength(1000)]
    public string? Notes { get; set; }
    
    public string? RequestedById { get; set; }
    
    [Required]
    public string SupplierId { get; set; } = string.Empty;
    
    [Required]
    public string ProjectId { get; set; } = string.Empty;
    
    public List<PurchaseOrderItemCreateDto> Items { get; set; } = new();
}

public class PurchaseOrderUpdateDto
{
    [Required]
    public string Id { get; set; } = string.Empty;
    
    [Required]
    [StringLength(100)]
    public string PoNumber { get; set; } = string.Empty;
    
    [Required]
    public DateTime PoDate { get; set; }
    
    public DateTime? ExpectedDeliveryDate { get; set; }
    
    public DateTime? ActualDeliveryDate { get; set; }
    
    public PurchaseOrderStatus Status { get; set; }
    
    [StringLength(1000)]
    public string? Notes { get; set; }
    
    public string? RequestedById { get; set; }
    
    [Required]
    public string SupplierId { get; set; } = string.Empty;
    
    [Required]
    public string ProjectId { get; set; } = string.Empty;
}

public class PurchaseOrderListDto
{
    public string Id { get; set; } = string.Empty;
    public string PoNumber { get; set; } = string.Empty;
    public DateTime PoDate { get; set; }
    public DateTime? ExpectedDeliveryDate { get; set; }
    public DateTime? ActualDeliveryDate { get; set; }
    public PurchaseOrderStatus Status { get; set; }
    public decimal? TotalAmount { get; set; }
    public string? RequestedByName { get; set; }
    public string SupplierName { get; set; } = string.Empty;
    public string ProjectName { get; set; } = string.Empty;
    public int ItemCount { get; set; }
}

public class PurchaseOrderItemDto
{
    public string Id { get; set; } = string.Empty;
    public string PurchaseOrderId { get; set; } = string.Empty;
    public string ItemId { get; set; } = string.Empty;
    public string ItemName { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal TotalPrice { get; set; }
    public string? Notes { get; set; }
}

public class PurchaseOrderItemCreateDto
{
    [Required]
    public string ItemId { get; set; } = string.Empty;
    
    [Required]
    [Range(1, int.MaxValue)]
    public int Quantity { get; set; }
    
    [Required]
    [Range(0, double.MaxValue)]
    public decimal UnitPrice { get; set; }
    
    [StringLength(500)]
    public string? Notes { get; set; }
}

public class PurchaseOrderItemUpdateDto
{
    [Required]
    public string Id { get; set; } = string.Empty;
    
    [Required]
    public string ItemId { get; set; } = string.Empty;
    
    [Required]
    [Range(1, int.MaxValue)]
    public int Quantity { get; set; }
    
    [Required]
    [Range(0, double.MaxValue)]
    public decimal UnitPrice { get; set; }
    
    [StringLength(500)]
    public string? Notes { get; set; }
}
