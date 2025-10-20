namespace salini.api.Application.DTOs.Inventory;

public class InventorySummaryDto
{
    public int TotalItems { get; set; }
    public int TotalCategories { get; set; }
    public int LowStockItems { get; set; }
    public int OutOfStockItems { get; set; }
    public int InStockItems { get; set; }
    public List<InventoryDto> Items { get; set; } = new();
    
    // Additional calculated fields for validation
    public int TotalPurchased { get; set; }
    public int TotalAllocated { get; set; }
    public DateTime CalculatedAt { get; set; } = DateTime.UtcNow;
}
