using salini.api.Application.Common.Interfaces;
using salini.api.Application.DTOs.Asset;
using salini.api.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace salini.api.Application.Features.Assets.Commands.UpdateAsset;

public record UpdateAssetCommand : ICommand<AssetDto>
{
    public string Id { get; init; } = string.Empty;
    public string AssetTag { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    public string? Description { get; init; }
    public string? SerialNumber { get; init; }
    public salini.api.Domain.Enums.AssetStatus Status { get; init; }
    public string? Condition { get; init; }
    public string? PoNumber { get; init; }
    public string? Location { get; init; }
    public string? ItemId { get; init; }
    public string ProjectId { get; init; } = string.Empty;
    public string? Notes { get; init; }
}

public class UpdateAssetCommandHandler : IRequestHandler<UpdateAssetCommand, AssetDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public UpdateAssetCommandHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<AssetDto> Handle(UpdateAssetCommand request, CancellationToken cancellationToken)
    {
        var asset = await _context.Assets
            .Include(a => a.Item)
            .Include(a => a.Project)
            .FirstOrDefaultAsync(a => a.Id == request.Id, cancellationToken);

        if (asset == null)
        {
            throw new NotFoundException($"Asset with ID '{request.Id}' not found.");
        }

        // Check if asset tag already exists for another asset
        var existingAsset = await _context.Assets
            .FirstOrDefaultAsync(a => a.AssetTag == request.AssetTag && a.Id != request.Id, cancellationToken);
            
        if (existingAsset != null)
        {
            throw new DuplicateException($"Asset with tag '{request.AssetTag}' already exists.");
        }

        // Verify project exists
        var project = await _context.Projects
            .FirstOrDefaultAsync(p => p.Id == request.ProjectId, cancellationToken);
            
        if (project == null)
        {
            throw new NotFoundException($"Project with ID '{request.ProjectId}' not found.");
        }

        // Verify item exists if provided
        if (!string.IsNullOrEmpty(request.ItemId))
        {
            var item = await _context.Items
                .FirstOrDefaultAsync(i => i.Id == request.ItemId, cancellationToken);
                
            if (item == null)
            {
                throw new NotFoundException($"Item with ID '{request.ItemId}' not found.");
            }
        }

        asset.AssetTag = request.AssetTag;
        asset.Name = request.Name;
        asset.Description = request.Description;
        asset.SerialNumber = request.SerialNumber;
        asset.Status = request.Status;
        asset.Condition = request.Condition;
        asset.PoNumber = request.PoNumber;
        asset.Location = request.Location;
        asset.ItemId = request.ItemId;
        asset.ProjectId = request.ProjectId;
        asset.Notes = request.Notes;
        asset.UpdatedAt = DateTime.UtcNow;
        asset.UpdatedBy = _currentUserService.UserId;

        await _context.SaveChangesAsync(cancellationToken);

        return new AssetDto
        {
            Id = asset.Id,
            AssetTag = asset.AssetTag,
            Name = asset.Name,
            Description = asset.Description,
            SerialNumber = asset.SerialNumber,
            Status = asset.Status,
            Condition = asset.Condition,
            PoNumber = asset.PoNumber,
            Location = asset.Location,
            Notes = asset.Notes,
            ItemId = asset.ItemId,
            ItemName = asset.Item?.Name,
            ProjectId = asset.ProjectId,
            ProjectName = asset.Project?.Name,
            CreatedAt = asset.CreatedAt,
            CreatedBy = asset.CreatedBy,
            UpdatedAt = asset.UpdatedAt,
            UpdatedBy = asset.UpdatedBy
        };
    }
}
