using salini.api.Application.Common.Interfaces;
using salini.api.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace salini.api.Application.Features.Assets.Commands.DeleteAsset;

public record DeleteAssetCommand(string Id) : ICommand<bool>;

public class DeleteAssetCommandHandler : IRequestHandler<DeleteAssetCommand, bool>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public DeleteAssetCommandHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<bool> Handle(DeleteAssetCommand request, CancellationToken cancellationToken)
    {
        var asset = await _context.Assets
            .FirstOrDefaultAsync(a => a.Id == request.Id, cancellationToken);

        if (asset == null)
        {
            throw new NotFoundException($"Asset with ID '{request.Id}' not found.");
        }

        // Check if asset is assigned to any employee
        var isAssigned = await _context.EmployeeAssets
            .AnyAsync(ea => ea.AssetId == request.Id, cancellationToken);

        if (isAssigned)
        {
            throw new ValidationException("Cannot delete asset that is assigned to an employee. Please unassign the asset first.");
        }

        _context.Assets.Remove(asset);
        await _context.SaveChangesAsync(cancellationToken);

        return true;
    }
}
