using salini.api.Application.Common.Interfaces;
using salini.api.Application.DTOs.Asset;
using salini.api.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace salini.api.Application.Features.Assets.Queries.GetAssetById;

public record GetAssetByIdQuery(string Id) : IQuery<AssetDto>;

public class GetAssetByIdQueryHandler : IRequestHandler<GetAssetByIdQuery, AssetDto>
{
    private readonly IApplicationDbContext _context;

    public GetAssetByIdQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<AssetDto> Handle(GetAssetByIdQuery request, CancellationToken cancellationToken)
    {
        var asset = await _context.Assets
            .Include(a => a.Item)
            .Include(a => a.Project)
            .Include(a => a.EmployeeAssets.Where(ea => ea.Status == salini.api.Domain.Enums.AssignmentStatus.Assigned))
                .ThenInclude(ea => ea.Employee)
            .FirstOrDefaultAsync(a => a.Id == request.Id, cancellationToken);

        if (asset == null)
        {
            throw new NotFoundException($"Asset with ID '{request.Id}' not found.");
        }

        var currentAssignment = asset.EmployeeAssets.FirstOrDefault();

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
            AssignedEmployeeId = currentAssignment?.EmployeeId,
            AssignedEmployeeName = currentAssignment?.Employee != null ? 
                $"{currentAssignment.Employee.FirstName} {currentAssignment.Employee.LastName}" : null,
            AssignmentDate = currentAssignment?.AssignedDate,
            CreatedAt = asset.CreatedAt,
            CreatedBy = asset.CreatedBy,
            UpdatedAt = asset.UpdatedAt,
            UpdatedBy = asset.UpdatedBy
        };
    }
}
