using Microsoft.EntityFrameworkCore;
using salini.api.Application.DTOs.Inventory;
using salini.api.Application.Common.Interfaces;

namespace salini.api.Application.Services
{
    public interface IInventoryService
    {
        Task<List<InventoryDto>> GetInventorySummaryAsync(List<string>? projectIds = null);
        Task<InventorySummaryDto> GetInventorySummaryWithStatsAsync(List<string>? projectIds = null);
        Task<Dictionary<string, object>> ValidateInventoryCalculationsAsync(List<string>? projectIds = null);
    }

    public class InventoryService : IInventoryService
    {
        private readonly IApplicationDbContext _context;

        public InventoryService(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<InventoryDto>> GetInventorySummaryAsync(List<string>? projectIds = null)
        {
            // If user has no assigned projects (empty list), return empty result
            if (projectIds != null && projectIds.Count == 0)
            {
                Console.WriteLine("User has no assigned projects, returning empty inventory list");
                return new List<InventoryDto>();
            }

            // Get purchase order items from all purchase orders (regardless of status)
            IQueryable<salini.api.Domain.Entities.PurchaseOrderItem> purchaseOrderItemsQuery = _context.PurchaseOrderItems
                .Include(poi => poi.PurchaseOrder)
                .Include(poi => poi.Item)
                    .ThenInclude(item => item.ItemCategory)
                .Where(poi => poi.PurchaseOrder != null);

            // Apply project filtering if projectIds are provided
            if (projectIds != null && projectIds.Any())
            {
                purchaseOrderItemsQuery = purchaseOrderItemsQuery
                    .Where(poi => poi.PurchaseOrder != null && projectIds.Contains(poi.PurchaseOrder.ProjectId));
            }

            var purchaseOrderItems = await purchaseOrderItemsQuery.ToListAsync();
            
            // Debug logging
            Console.WriteLine($"Found {purchaseOrderItems.Count} purchase order items (all statuses)");
            if (purchaseOrderItems.Any())
            {
                Console.WriteLine($"Sample purchase order item: {purchaseOrderItems.First().Item?.Name}");
                Console.WriteLine($"Purchase order status: {purchaseOrderItems.First().PurchaseOrder?.Status}");
                Console.WriteLine($"Purchase order project: {purchaseOrderItems.First().PurchaseOrder?.ProjectId}");
            }

            // Get assets to check allocations
            IQueryable<salini.api.Domain.Entities.Asset> assetsQuery = _context.Assets
                .Include(a => a.Item)
                .Include(a => a.Project);

            // Apply project filtering to assets if projectIds are provided
            if (projectIds != null && projectIds.Any())
            {
                assetsQuery = assetsQuery.Where(a => projectIds.Contains(a.ProjectId));
            }
            // Note: If projectIds is null (admin) or empty (no projects), no filtering is applied

            var assets = await assetsQuery.ToListAsync();
            
            // Debug logging for assets
            Console.WriteLine($"Found {assets.Count} assets");

            // Group purchase order items by ItemId
            var inventoryMap = new Dictionary<string, InventoryDto>();

            foreach (var poi in purchaseOrderItems)
            {
                var itemId = poi.ItemId;
                
                if (!inventoryMap.ContainsKey(itemId))
                {
                    // Extract brand and model from item name
                    var parts = poi.Item.Name.Split(' ');
                    var brand = parts.Length > 0 ? parts[0] : "Unknown";
                    var model = parts.Length > 1 ? string.Join(" ", parts.Skip(1)) : "Unknown";

                    inventoryMap[itemId] = new InventoryDto
                    {
                        ItemId = itemId,
                        ItemName = poi.Item.Name,
                        Category = poi.Item.ItemCategory?.Name ?? "Other",
                        Brand = brand,
                        Model = model,
                        TotalPurchased = 0,
                        TotalAllocated = 0,
                        AvailableCount = 0,
                        Status = InventoryStatus.InStock,
                        LastPurchaseDate = poi.PurchaseOrder.PoDate,
                        Vendor = poi.PurchaseOrder.Supplier?.Name ?? "Unknown"
                    };
                }

                // Add to total purchased
                inventoryMap[itemId].TotalPurchased += poi.Quantity;

                // Update last purchase date if this is more recent
                if (poi.PurchaseOrder != null && poi.PurchaseOrder.PoDate > inventoryMap[itemId].LastPurchaseDate)
                {
                    inventoryMap[itemId].LastPurchaseDate = poi.PurchaseOrder.PoDate;
                }
            }

            // Count allocated assets for each item
            foreach (var asset in assets)
            {
                if (asset.ItemId != null && inventoryMap.ContainsKey(asset.ItemId))
                {
                    inventoryMap[asset.ItemId].TotalAllocated += 1;
                    
                    // Set project name if not already set (use first project found)
                    if (string.IsNullOrEmpty(inventoryMap[asset.ItemId].ProjectName) && asset.Project != null)
                    {
                        inventoryMap[asset.ItemId].ProjectName = asset.Project.Name;
                    }
                }
            }

            // Calculate available count and status
            foreach (var item in inventoryMap.Values)
            {
                item.AvailableCount = item.TotalPurchased - item.TotalAllocated;
                
                // Determine status based on available count
                if (item.AvailableCount <= 0)
                {
                    item.Status = InventoryStatus.OutOfStock;
                }
                else if (item.AvailableCount <= 2)
                {
                    item.Status = InventoryStatus.LowStock;
                }
                else
                {
                    item.Status = InventoryStatus.InStock;
                }
            }

            var result = inventoryMap.Values
                .OrderBy(x => x.ItemName)
                .ToList();
                
            // Debug logging for final result
            Console.WriteLine($"Returning {result.Count} inventory items");
            if (result.Any())
            {
                Console.WriteLine($"Sample inventory item: {result.First().ItemName}");
            }
            
            return result;
        }

        public async Task<InventorySummaryDto> GetInventorySummaryWithStatsAsync(List<string>? projectIds = null)
        {
            // Get the detailed inventory items first
            var inventoryItems = await GetInventorySummaryAsync(projectIds);
            
            // Calculate statistics on the backend
            var totalItems = inventoryItems.Sum(x => x.AvailableCount);
            var totalCategories = inventoryItems.Select(x => x.Category).Distinct().Count();
            var lowStockItems = inventoryItems.Count(x => x.Status == InventoryStatus.LowStock);
            var outOfStockItems = inventoryItems.Count(x => x.Status == InventoryStatus.OutOfStock);
            var inStockItems = inventoryItems.Count(x => x.Status == InventoryStatus.InStock);
            var totalPurchased = inventoryItems.Sum(x => x.TotalPurchased);
            var totalAllocated = inventoryItems.Sum(x => x.TotalAllocated);
            
            // Validation: Ensure calculations are consistent
            var calculatedAvailable = totalPurchased - totalAllocated;
            if (calculatedAvailable != totalItems)
            {
                Console.WriteLine($"⚠️ WARNING: Calculation mismatch - Calculated: {calculatedAvailable}, Sum of Available: {totalItems}");
            }
            
            // Validation: Ensure status counts add up
            var totalStatusCount = lowStockItems + outOfStockItems + inStockItems;
            if (totalStatusCount != inventoryItems.Count)
            {
                Console.WriteLine($"⚠️ WARNING: Status count mismatch - Total items: {inventoryItems.Count}, Status sum: {totalStatusCount}");
            }
            
            // Debug logging for validation
            Console.WriteLine($"📊 Inventory Summary Calculated:");
            Console.WriteLine($"   Total Items (Available): {totalItems}");
            Console.WriteLine($"   Total Categories: {totalCategories}");
            Console.WriteLine($"   Low Stock Items: {lowStockItems}");
            Console.WriteLine($"   Out of Stock Items: {outOfStockItems}");
            Console.WriteLine($"   In Stock Items: {inStockItems}");
            Console.WriteLine($"   Total Purchased: {totalPurchased}");
            Console.WriteLine($"   Total Allocated: {totalAllocated}");
            Console.WriteLine($"   Calculated Available: {calculatedAvailable}");
            Console.WriteLine($"   Validation: {(calculatedAvailable == totalItems ? "✅ PASS" : "❌ FAIL")}");
            
            var summary = new InventorySummaryDto
            {
                TotalItems = totalItems,
                TotalCategories = totalCategories,
                LowStockItems = lowStockItems,
                OutOfStockItems = outOfStockItems,
                InStockItems = inStockItems,
                TotalPurchased = totalPurchased,
                TotalAllocated = totalAllocated,
                Items = inventoryItems,
                CalculatedAt = DateTime.UtcNow
            };
            
            return summary;
        }

        /// <summary>
        /// Validates inventory calculations for testing purposes
        /// </summary>
        public async Task<Dictionary<string, object>> ValidateInventoryCalculationsAsync(List<string>? projectIds = null)
        {
            var inventoryItems = await GetInventorySummaryAsync(projectIds);
            
            var validation = new Dictionary<string, object>
            {
                ["TotalItems"] = inventoryItems.Count,
                ["TotalPurchased"] = inventoryItems.Sum(x => x.TotalPurchased),
                ["TotalAllocated"] = inventoryItems.Sum(x => x.TotalAllocated),
                ["TotalAvailable"] = inventoryItems.Sum(x => x.AvailableCount),
                ["CalculatedAvailable"] = inventoryItems.Sum(x => x.TotalPurchased) - inventoryItems.Sum(x => x.TotalAllocated),
                ["StatusCounts"] = new Dictionary<string, int>
                {
                    ["InStock"] = inventoryItems.Count(x => x.Status == InventoryStatus.InStock),
                    ["LowStock"] = inventoryItems.Count(x => x.Status == InventoryStatus.LowStock),
                    ["OutOfStock"] = inventoryItems.Count(x => x.Status == InventoryStatus.OutOfStock)
                },
                ["Categories"] = inventoryItems.Select(x => x.Category).Distinct().Count(),
                ["ValidationPassed"] = inventoryItems.Sum(x => x.AvailableCount) == (inventoryItems.Sum(x => x.TotalPurchased) - inventoryItems.Sum(x => x.TotalAllocated))
            };
            
            return validation;
        }
    }
}
