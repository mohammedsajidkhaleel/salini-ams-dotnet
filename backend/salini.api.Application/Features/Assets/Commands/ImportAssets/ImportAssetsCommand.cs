using salini.api.Application.Common.Interfaces;
using salini.api.Domain.Entities;
using salini.api.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using salini.api.Application.DTOs.Asset;
using salini.api.Application.Features.Employees.Commands.ImportEmployees;

namespace salini.api.Application.Features.Assets.Commands.ImportAssets;

public record ImportAssetsCommand : ICommand<ImportAssetsResult>
{
    public List<AssetImportDto> Assets { get; init; } = new();
    public string? ProjectId { get; init; }
}

public class ImportAssetsCommandHandler : IRequestHandler<ImportAssetsCommand, ImportAssetsResult>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public ImportAssetsCommandHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<ImportAssetsResult> Handle(ImportAssetsCommand request, CancellationToken cancellationToken)
    {
        var result = new ImportAssetsResult
        {
            Success = true,
            Imported = 0,
            Updated = 0,
            Errors = new List<ImportError>()
        };

        // Normalize serial numbers - treat "n/a", "-", and empty strings as null
        foreach (var asset in request.Assets)
        {
            if (!string.IsNullOrWhiteSpace(asset.SerialNo))
            {
                var normalized = asset.SerialNo.Trim().ToLowerInvariant();
                if (normalized == "n/a" || normalized == "-")
                {
                    asset.SerialNo = null;
                }
                else
                {
                    asset.SerialNo = asset.SerialNo.Trim();
                }
            }
        }

        // Get existing assets for upsert logic (using asset tag as unique identifier)
        var existingAssets = await _context.Assets
            .Where(a => !string.IsNullOrEmpty(a.AssetTag))
            .ToDictionaryAsync(a => a.AssetTag!, a => a, cancellationToken);

        // Get master data for validation
        var itemCategories = await _context.ItemCategories.ToListAsync(cancellationToken);
        var items = await _context.Items.ToListAsync(cancellationToken);
        var employees = await _context.Employees.ToListAsync(cancellationToken);
        var projects = await _context.Projects.ToListAsync(cancellationToken);

        // Collect unique master data values from assets
        var uniqueItemCategories = request.Assets
            .Where(a => !string.IsNullOrWhiteSpace(a.ItemCategory))
            .Select(a => a.ItemCategory!.Trim())
            .Distinct()
            .ToList();

        var uniqueItems = request.Assets
            .Where(a => !string.IsNullOrWhiteSpace(a.Item))
            .Select(a => a.Item!.Trim())
            .Distinct()
            .ToList();

        // Create missing master data
        await CreateMissingMasterData(
            request,
            uniqueItemCategories, itemCategories,
            uniqueItems, items,
            cancellationToken);

        // Refresh master data after creating missing ones
        itemCategories = await _context.ItemCategories.ToListAsync(cancellationToken);
        items = await _context.Items.ToListAsync(cancellationToken);
        
        // Get project for assets (optional)
        Project? selectedProject = null;
        if (!string.IsNullOrEmpty(request.ProjectId))
        {
            selectedProject = projects.FirstOrDefault(p => p.Id == request.ProjectId);
            if (selectedProject == null)
            {
                result.Errors.Add(new ImportError
                {
                    Row = 0,
                    Message = $"Project with ID '{request.ProjectId}' not found."
                });
                result.Success = false;
                return result;
            }
        }

        var assetsToAdd = new List<Asset>();
        var assetsToUpdate = new List<Asset>();
        var employeeAssignments = new List<EmployeeAsset>();
        var processedAssetTags = new HashSet<string>();

        for (int i = 0; i < request.Assets.Count; i++)
        {
            var assetDto = request.Assets[i];
            var rowNumber = i + 1;

            try
            {
                // Check for duplicate asset tags within the same import batch
                if (processedAssetTags.Contains(assetDto.AssetTag))
                {
                    result.Errors.Add(new ImportError
                    {
                        Row = rowNumber,
                        Message = $"Duplicate Asset Tag '{assetDto.AssetTag}' found in import data"
                    });
                    continue;
                }
                processedAssetTags.Add(assetDto.AssetTag);

                // Validate required fields
                if (string.IsNullOrWhiteSpace(assetDto.AssetTag))
                {
                    result.Errors.Add(new ImportError
                    {
                        Row = rowNumber,
                        Message = "Asset Tag is required"
                    });
                    continue;
                }

                if (string.IsNullOrWhiteSpace(assetDto.AssetName))
                {
                    result.Errors.Add(new ImportError
                    {
                        Row = rowNumber,
                        Message = "Asset Name is required"
                    });
                    continue;
                }

                //if (string.IsNullOrWhiteSpace(assetDto.SerialNo))
                //{
                //    result.Errors.Add(new ImportError
                //    {
                //        Row = rowNumber,
                //        Message = "Serial Number is required"
                //    });
                //    continue;
                //}

                if (string.IsNullOrWhiteSpace(assetDto.ItemCategory))
                {
                    result.Errors.Add(new ImportError
                    {
                        Row = rowNumber,
                        Message = "Item Category is required"
                    });
                    continue;
                }

                if (string.IsNullOrWhiteSpace(assetDto.Item))
                {
                    result.Errors.Add(new ImportError
                    {
                        Row = rowNumber,
                        Message = "Item is required"
                    });
                    continue;
                }

                // Validate foreign key references
                var itemCategory = itemCategories.FirstOrDefault(ic => ic.Name.Equals(assetDto.ItemCategory, StringComparison.OrdinalIgnoreCase));
                if (itemCategory == null)
                {
                    result.Errors.Add(new ImportError
                    {
                        Row = rowNumber,
                        Message = $"Item Category '{assetDto.ItemCategory}' not found"
                    });
                    continue;
                }

                var item = items.FirstOrDefault(i => i.Name.Equals(assetDto.Item, StringComparison.OrdinalIgnoreCase));
                if (item == null)
                {
                    result.Errors.Add(new ImportError
                    {
                        Row = rowNumber,
                        Message = $"Item '{assetDto.Item}' not found"
                    });
                    continue;
                }

                // Check if asset exists for upsert logic (using asset tag)
                Asset? existingAsset = null;
                if (existingAssets.TryGetValue(assetDto.AssetTag, out existingAsset))
                {
                    // Update existing asset
                    existingAsset.AssetTag = assetDto.AssetTag;
                    existingAsset.Name = assetDto.AssetName;
                    existingAsset.Description = string.IsNullOrEmpty(assetDto.SerialNo) 
                        ? $"Imported: {assetDto.Item}" 
                        : $"Imported: {assetDto.Item} ({assetDto.SerialNo})";
                    existingAsset.Condition = assetDto.Condition;
                    existingAsset.ItemId = item.Id;
                    existingAsset.ProjectId = selectedProject?.Id;
                    existingAsset.UpdatedAt = DateTime.UtcNow;
                    existingAsset.UpdatedBy = _currentUserService.UserId;

                    assetsToUpdate.Add(existingAsset);
                }
                else
                {
                    // Create new asset
                    var newAsset = new Asset
                    {
                        Id = Guid.NewGuid().ToString(),
                        AssetTag = assetDto.AssetTag,
                        Name = assetDto.AssetName,
                        Description = string.IsNullOrEmpty(assetDto.SerialNo) 
                            ? $"Imported: {assetDto.Item}" 
                            : $"Imported: {assetDto.Item} ({assetDto.SerialNo})",
                        SerialNumber = assetDto.SerialNo,
                        Status = AssetStatus.Available,
                        Condition = assetDto.Condition,
                        ItemId = item.Id,
                        ProjectId = selectedProject?.Id,
                        CreatedAt = DateTime.UtcNow,
                        CreatedBy = _currentUserService.UserId
                    };

                    assetsToAdd.Add(newAsset);
                    // Add to existingAssets dictionary using asset tag
                    existingAssets[assetDto.AssetTag] = newAsset;
                }

                // Handle employee assignment
                if (!string.IsNullOrWhiteSpace(assetDto.AssignedTo))
                {
                    var employee = employees.FirstOrDefault(e => e.EmployeeId.Equals(assetDto.AssignedTo, StringComparison.OrdinalIgnoreCase));
                    if (employee != null)
                    {
                        var assetForAssignment = existingAssets[assetDto.AssetTag];
                        
                        // Check if assignment already exists
                        var existingAssignment = await _context.EmployeeAssets
                            .FirstOrDefaultAsync(ea => ea.AssetId == assetForAssignment.Id && ea.Status == AssignmentStatus.Assigned, cancellationToken);

                        if (existingAssignment == null)
                        {
                            var assignment = new EmployeeAsset
                            {
                                Id = Guid.NewGuid().ToString(),
                                EmployeeId = employee.Id,
                                AssetId = assetForAssignment.Id,
                                AssignedDate = DateTime.UtcNow,
                                Status = AssignmentStatus.Assigned,
                                CreatedAt = DateTime.UtcNow,
                                CreatedBy = _currentUserService.UserId
                            };
                            employeeAssignments.Add(assignment);
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                result.Errors.Add(new ImportError
                {
                    Row = rowNumber,
                    Message = $"Unexpected error: {ex.Message}"
                });
            }
        }

        // Save changes to database
        if (assetsToAdd.Any() || assetsToUpdate.Any())
        {
            if (assetsToAdd.Any())
            {
                _context.Assets.AddRange(assetsToAdd);
            }

            if (employeeAssignments.Any())
            {
                _context.EmployeeAssets.AddRange(employeeAssignments);
            }
            
            await _context.SaveChangesAsync(cancellationToken);
            result.Imported = assetsToAdd.Count;
            result.Updated = assetsToUpdate.Count;
        }

        if (result.Errors.Any())
        {
            result.Success = false;
        }

        return result;
    }

    private async Task CreateMissingMasterData(
        ImportAssetsCommand request,
        List<string> uniqueItemCategories, List<ItemCategory> existingItemCategories,
        List<string> uniqueItems, List<Item> existingItems,
        CancellationToken cancellationToken)
    {
        // Create missing item categories
        var missingItemCategories = uniqueItemCategories
            .Where(ic => !existingItemCategories.Any(eic => eic.Name.Equals(ic, StringComparison.OrdinalIgnoreCase)))
            .ToList();
        
        foreach (var categoryName in missingItemCategories)
        {
            var itemCategory = new ItemCategory
            {
                Id = Guid.NewGuid().ToString(),
                Name = categoryName,
                Description = $"Auto-created from asset import",
                Status = Status.Active,
                CreatedAt = DateTime.UtcNow,
                CreatedBy = _currentUserService.UserId
            };
            _context.ItemCategories.Add(itemCategory);
        }

        // Create missing items
        var missingItems = uniqueItems
            .Where(i => !existingItems.Any(ei => ei.Name.Equals(i, StringComparison.OrdinalIgnoreCase)))
            .ToList();
        
        foreach (var itemName in missingItems)
        {
            // Find the most appropriate category for this item
            string? bestCategoryId = null;
            
            // Find assets that have this item and see what category they belong to
            var assetsWithThisItem = request.Assets
                .Where(a => !string.IsNullOrWhiteSpace(a.Item) && 
                           a.Item.Equals(itemName, StringComparison.OrdinalIgnoreCase) &&
                           !string.IsNullOrWhiteSpace(a.ItemCategory))
                .ToList();
            
            if (assetsWithThisItem.Any())
            {
                // Get the most common category for this item
                var categoryCounts = assetsWithThisItem
                    .GroupBy(a => a.ItemCategory)
                    .OrderByDescending(g => g.Count())
                    .ToList();
                
                if (categoryCounts.Any())
                {
                    var mostCommonCategoryName = categoryCounts.First().Key;
                    var matchingCategory = existingItemCategories.FirstOrDefault(ic => ic.Name.Equals(mostCommonCategoryName, StringComparison.OrdinalIgnoreCase));
                    if (matchingCategory != null)
                    {
                        bestCategoryId = matchingCategory.Id;
                    }
                }
            }
            
            // Use the best category found, or create a default one
            if (bestCategoryId == null)
            {
                var defaultCategory = existingItemCategories.FirstOrDefault(ic => ic.Name.Equals("General", StringComparison.OrdinalIgnoreCase));
                if (defaultCategory == null)
                {
                    // Create a default category
                    defaultCategory = new ItemCategory
                    {
                        Id = Guid.NewGuid().ToString(),
                        Name = "General",
                        Description = "Default category for orphaned items",
                        Status = Status.Active,
                        CreatedAt = DateTime.UtcNow,
                        CreatedBy = _currentUserService.UserId
                    };
                    _context.ItemCategories.Add(defaultCategory);
                    // Add to existing list for subsequent lookups
                    existingItemCategories.Add(defaultCategory);
                }
                bestCategoryId = defaultCategory.Id;
            }
            
            var item = new Item
            {
                Id = Guid.NewGuid().ToString(),
                Name = itemName,
                Description = $"Auto-created from asset import",
                Status = Status.Active,
                ItemCategoryId = bestCategoryId,
                CreatedAt = DateTime.UtcNow,
                CreatedBy = _currentUserService.UserId
            };
            _context.Items.Add(item);
        }

        // Save all new master data
        if (missingItemCategories.Any() || missingItems.Any())
        {
            try
            {
                await _context.SaveChangesAsync(cancellationToken);
            }
            catch (Exception ex)
            {
                // Log the error and rethrow with more context
                throw new InvalidOperationException($"Failed to save master data during asset import. Error: {ex.Message}", ex);
            }
        }
    }
}
