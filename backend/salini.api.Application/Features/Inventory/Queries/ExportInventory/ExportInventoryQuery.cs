using MediatR;
using salini.api.Application.Common.Helpers;
using salini.api.Application.Services;

namespace salini.api.Application.Features.Inventory.Queries.ExportInventory;

public record ExportInventoryQuery : IRequest<byte[]>
{
    public List<string>? ProjectIds { get; init; }
}

public class ExportInventoryQueryHandler : IRequestHandler<ExportInventoryQuery, byte[]>
{
    private readonly IInventoryService _inventoryService;

    public ExportInventoryQueryHandler(IInventoryService inventoryService)
    {
        _inventoryService = inventoryService;
    }

    public async Task<byte[]> Handle(ExportInventoryQuery request, CancellationToken cancellationToken)
    {
        var inventoryItems = await _inventoryService.GetInventorySummaryAsync(request.ProjectIds);

        // Define CSV headers (using snake_case for consistency)
        var headers = new[]
        {
            "item_name",
            "category",
            "brand",
            "model",
            "project",
            "purchased",
            "allocated",
            "available",
            "status",
            "last_purchase_date",
            "vendor"
        };

        // Create CSV rows
        var rows = inventoryItems.Select(item =>
        {
            string statusText = item.Status.ToString().Replace("Stock", " Stock");
            if (statusText == "In Stock")
                statusText = "In Stock";
            else if (statusText == "Low Stock")
                statusText = "Low Stock";
            else if (statusText == "Out Stock")
                statusText = "Out of Stock";

            return new[]
            {
                item.ItemName,
                item.Category,
                item.Brand,
                item.Model,
                item.ProjectName ?? string.Empty,
                item.TotalPurchased.ToString(),
                item.TotalAllocated.ToString(),
                item.AvailableCount.ToString(),
                statusText,
                item.LastPurchaseDate.ToString("yyyy-MM-dd"),
                item.Vendor
            };
        });

        return CsvExportHelper.CreateCsvFile(headers, rows);
    }
}

