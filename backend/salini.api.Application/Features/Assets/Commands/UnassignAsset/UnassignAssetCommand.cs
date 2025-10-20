using salini.api.Application.Common.Interfaces;
using salini.api.Domain.Enums;
using salini.api.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace salini.api.Application.Features.Assets.Commands.UnassignAsset;

public record UnassignAssetCommand : ICommand<bool>
{
    public string AssetId { get; init; } = string.Empty;
    public string? Notes { get; init; }
}

public class UnassignAssetCommandHandler : IRequestHandler<UnassignAssetCommand, bool>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public UnassignAssetCommandHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<bool> Handle(UnassignAssetCommand request, CancellationToken cancellationToken)
    {
        // Find the current assignment
        var assignment = await _context.EmployeeAssets
            .Include(ea => ea.Asset)
            .FirstOrDefaultAsync(ea => ea.AssetId == request.AssetId && ea.Status == AssignmentStatus.Assigned, cancellationToken);

        if (assignment == null)
        {
            throw new NotFoundException($"No active assignment found for asset with ID '{request.AssetId}'.");
        }

        // Update assignment status
        assignment.Status = AssignmentStatus.Returned;
        assignment.ReturnedDate = DateTime.UtcNow;
        assignment.Notes = request.Notes;
        assignment.UpdatedAt = DateTime.UtcNow;
        assignment.UpdatedBy = _currentUserService.UserId;

        // Update asset status
        assignment.Asset.Status = AssetStatus.Available;
        assignment.Asset.UpdatedAt = DateTime.UtcNow;
        assignment.Asset.UpdatedBy = _currentUserService.UserId;

        await _context.SaveChangesAsync(cancellationToken);

        return true;
    }
}
