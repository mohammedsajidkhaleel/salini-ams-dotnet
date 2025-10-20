using salini.api.Domain.Enums;

namespace salini.api.Application.DTOs.Inventory
{
    public class InventoryDto
    {
        public string ItemId { get; set; } = string.Empty;
        public string ItemName { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string Brand { get; set; } = string.Empty;
        public string Model { get; set; } = string.Empty;
        public int TotalPurchased { get; set; }
        public int TotalAllocated { get; set; }
        public int AvailableCount { get; set; }
        public InventoryStatus Status { get; set; }
        public DateTime LastPurchaseDate { get; set; }
        public string Vendor { get; set; } = string.Empty;
        public string? ProjectName { get; set; }
    }

    public enum InventoryStatus
    {
        InStock = 1,
        LowStock = 2,
        OutOfStock = 3
    }
}
