namespace salini.api.Domain.Entities;

public class PurchaseOrderItem : BaseEntity
{
    public string PurchaseOrderId { get; set; } = string.Empty;
    public string ItemId { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public string? Notes { get; set; }
    
    // Navigation properties
    public virtual PurchaseOrder PurchaseOrder { get; set; } = null!;
    public virtual Item? Item { get; set; }
}
