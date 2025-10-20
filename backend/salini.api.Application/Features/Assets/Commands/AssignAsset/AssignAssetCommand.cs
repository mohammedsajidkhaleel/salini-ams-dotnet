using salini.api.Application.Common.Interfaces;
using salini.api.Domain.Entities;
using salini.api.Domain.Enums;
using salini.api.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace salini.api.Application.Features.Assets.Commands.AssignAsset;

public record AssignAssetCommand : ICommand<bool>
{
    public string AssetId { get; init; } = string.Empty;
    public string EmployeeId { get; init; } = string.Empty;
    public string? Notes { get; init; }
}

public class AssignAssetCommandHandler : IRequestHandler<AssignAssetCommand, bool>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public AssignAssetCommandHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<bool> Handle(AssignAssetCommand request, CancellationToken cancellationToken)
    {
        // Verify asset exists and is available
        var asset = await _context.Assets
            .FirstOrDefaultAsync(a => a.Id == request.AssetId, cancellationToken);

        if (asset == null)
        {
            throw new NotFoundException($"Asset with ID '{request.AssetId}' not found.");
        }

        if (asset.Status != AssetStatus.Available)
        {
            throw new ValidationException($"Asset '{asset.AssetTag}' is not available for assignment. Current status: {asset.Status}");
        }

        // Verify employee exists and is active
        var employee = await _context.Employees
            .FirstOrDefaultAsync(e => e.Id == request.EmployeeId, cancellationToken);

        if (employee == null)
        {
            throw new NotFoundException($"Employee with ID '{request.EmployeeId}' not found.");
        }

        if (employee.Status != Status.Active)
        {
            throw new ValidationException($"Employee '{employee.EmployeeId}' is not active. Current status: {employee.Status}");
        }

        // Check if asset is already assigned
        var existingAssignment = await _context.EmployeeAssets
            .FirstOrDefaultAsync(ea => ea.AssetId == request.AssetId && ea.Status == AssignmentStatus.Assigned, cancellationToken);

        if (existingAssignment != null)
        {
            throw new ValidationException($"Asset '{asset.AssetTag}' is already assigned to another employee.");
        }

        // Create assignment
        var assignment = new EmployeeAsset
        {
            Id = Guid.NewGuid().ToString(),
            EmployeeId = request.EmployeeId,
            AssetId = request.AssetId,
            Status = AssignmentStatus.Assigned,
            AssignedDate = DateTime.UtcNow,
            Notes = request.Notes,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = _currentUserService.UserId
        };

        // Update asset status
        asset.Status = AssetStatus.Assigned;
        asset.UpdatedAt = DateTime.UtcNow;
        asset.UpdatedBy = _currentUserService.UserId;

        _context.EmployeeAssets.Add(assignment);
        await _context.SaveChangesAsync(cancellationToken);

        return true;
    }
}
