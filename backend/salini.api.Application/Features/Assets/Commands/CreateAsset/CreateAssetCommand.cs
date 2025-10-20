using salini.api.Application.Common.Interfaces;
using salini.api.Application.DTOs.Asset;
using salini.api.Domain.Entities;
using salini.api.Domain.Enums;
using salini.api.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace salini.api.Application.Features.Assets.Commands.CreateAsset;

public record CreateAssetCommand : ICommand<AssetDto>
{
    public string AssetTag { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    public string? Description { get; init; }
    public string? SerialNumber { get; init; }
    public AssetStatus Status { get; init; } = AssetStatus.Available;
    public string? Condition { get; init; }
    public string? PoNumber { get; init; }
    public string? Location { get; init; }
    public string? ItemId { get; init; }
    public string ProjectId { get; init; } = string.Empty;
    public string? Notes { get; init; }
}

public class CreateAssetCommandHandler : IRequestHandler<CreateAssetCommand, AssetDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public CreateAssetCommandHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<AssetDto> Handle(CreateAssetCommand request, CancellationToken cancellationToken)
    {
        // Check if asset tag already exists
        var existingAsset = await _context.Assets
            .FirstOrDefaultAsync(a => a.AssetTag == request.AssetTag, cancellationToken);
            
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

        var asset = new Asset
        {
            Id = Guid.NewGuid().ToString(),
            AssetTag = request.AssetTag,
            Name = request.Name,
            Description = request.Description,
            SerialNumber = request.SerialNumber,
            Status = request.Status,
            Condition = request.Condition,
            PoNumber = request.PoNumber,
            Location = request.Location,
            ItemId = request.ItemId,
            ProjectId = request.ProjectId,
            Notes = request.Notes,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = _currentUserService.UserId
        };

        _context.Assets.Add(asset);
        await _context.SaveChangesAsync(cancellationToken);

        // Load the asset with related data for mapping
        var createdAsset = await _context.Assets
            .Include(a => a.Item)
            .Include(a => a.Project)
            .FirstOrDefaultAsync(a => a.Id == asset.Id, cancellationToken);

        return new AssetDto
        {
            Id = createdAsset!.Id,
            AssetTag = createdAsset.AssetTag,
            Name = createdAsset.Name,
            Description = createdAsset.Description,
            SerialNumber = createdAsset.SerialNumber,
            Status = createdAsset.Status,
            Condition = createdAsset.Condition,
            PoNumber = createdAsset.PoNumber,
            Location = createdAsset.Location,
            Notes = createdAsset.Notes,
            ItemId = createdAsset.ItemId,
            ItemName = createdAsset.Item?.Name,
            ProjectId = createdAsset.ProjectId,
            ProjectName = createdAsset.Project?.Name,
            CreatedAt = createdAsset.CreatedAt,
            CreatedBy = createdAsset.CreatedBy
        };
    }
}
