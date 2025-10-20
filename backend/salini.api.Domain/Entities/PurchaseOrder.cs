using salini.api.Domain.Enums;

namespace salini.api.Domain.Entities;

public class PurchaseOrder : BaseEntity
{
    public string PoNumber { get; set; } = string.Empty;
    public DateTime PoDate { get; set; }
    public DateTime? ExpectedDeliveryDate { get; set; }
    public DateTime? ActualDeliveryDate { get; set; }
    public PurchaseOrderStatus Status { get; set; } = PurchaseOrderStatus.Draft;
    public decimal? TotalAmount { get; set; }
    public string? Notes { get; set; }
    public string? RequestedById { get; set; }
    public string SupplierId { get; set; } = string.Empty;
    public string ProjectId { get; set; } = string.Empty;
    
    // Navigation properties
    public virtual Project? Project { get; set; }
    public virtual Supplier? Supplier { get; set; }
    public virtual Employee? RequestedBy { get; set; }
    public virtual ICollection<PurchaseOrderItem> Items { get; set; } = new List<PurchaseOrderItem>();
}
