using salini.api.Application.Common.Interfaces;
using salini.api.Application.DTOs.Asset;
using salini.api.Domain.Entities;
using salini.api.Domain.Enums;
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
    public string? ItemConfigurationId { get; init; }
    public string ProjectId { get; init; } = string.Empty;
    public string? Notes { get; init; }
    
    // Optional: Handle assignment/unassignment in the same request
    public string? AssignedEmployeeId { get; init; }
    public string? AssignmentNotes { get; init; }
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

        // Verify item configuration exists if provided
        if (!string.IsNullOrEmpty(request.ItemConfigurationId))
        {
            var itemConfiguration = await _context.ItemConfigurations
                .FirstOrDefaultAsync(ic => ic.Id == request.ItemConfigurationId, cancellationToken);

            if (itemConfiguration == null)
            {
                throw new NotFoundException($"Item configuration with ID '{request.ItemConfigurationId}' not found.");
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
        asset.ItemConfigurationId = request.ItemConfigurationId;
        asset.ProjectId = request.ProjectId;
        asset.Notes = request.Notes;
        asset.UpdatedAt = DateTime.UtcNow;
        asset.UpdatedBy = _currentUserService.UserId;

        // Handle assignment/unassignment if provided
        var currentAssignment = await _context.EmployeeAssets
            .FirstOrDefaultAsync(ea => ea.AssetId == request.Id && ea.Status == AssignmentStatus.Assigned, cancellationToken);

        if (!string.IsNullOrEmpty(request.AssignedEmployeeId))
        {
            // Assign or reassign asset
            if (currentAssignment != null)
            {
                // If already assigned to the same employee, do nothing
                if (currentAssignment.EmployeeId == request.AssignedEmployeeId)
                {
                    // Update assignment notes if provided
                    if (!string.IsNullOrEmpty(request.AssignmentNotes))
                    {
                        currentAssignment.Notes = request.AssignmentNotes;
                        currentAssignment.UpdatedAt = DateTime.UtcNow;
                        currentAssignment.UpdatedBy = _currentUserService.UserId;
                    }
                }
                else
                {
                    // Unassign from current employee
                    currentAssignment.Status = AssignmentStatus.Returned;
                    currentAssignment.ReturnedDate = DateTime.UtcNow;
                    currentAssignment.UpdatedAt = DateTime.UtcNow;
                    currentAssignment.UpdatedBy = _currentUserService.UserId;

                    // Assign to new employee
                    var employee = await _context.Employees
                        .FirstOrDefaultAsync(e => e.Id == request.AssignedEmployeeId, cancellationToken);

                    if (employee == null)
                    {
                        throw new NotFoundException($"Employee with ID '{request.AssignedEmployeeId}' not found.");
                    }

                    if (employee.Status != Status.Active)
                    {
                        throw new ValidationException($"Employee '{employee.EmployeeId}' is not active. Current status: {employee.Status}");
                    }

                    var newAssignment = new EmployeeAsset
                    {
                        Id = Guid.NewGuid().ToString(),
                        EmployeeId = request.AssignedEmployeeId,
                        AssetId = request.Id,
                        Status = AssignmentStatus.Assigned,
                        AssignedDate = DateTime.UtcNow,
                        Notes = request.AssignmentNotes,
                        CreatedAt = DateTime.UtcNow,
                        CreatedBy = _currentUserService.UserId
                    };

                    _context.EmployeeAssets.Add(newAssignment);
                    asset.Status = AssetStatus.Assigned;
                }
            }
            else
            {
                // New assignment
                var employee = await _context.Employees
                    .FirstOrDefaultAsync(e => e.Id == request.AssignedEmployeeId, cancellationToken);

                if (employee == null)
                {
                    throw new NotFoundException($"Employee with ID '{request.AssignedEmployeeId}' not found.");
                }

                if (employee.Status != Status.Active)
                {
                    throw new ValidationException($"Employee '{employee.EmployeeId}' is not active. Current status: {employee.Status}");
                }

                var employeeAssignment = new EmployeeAsset
                {
                    Id = Guid.NewGuid().ToString(),
                    EmployeeId = request.AssignedEmployeeId,
                    AssetId = request.Id,
                    Status = AssignmentStatus.Assigned,
                    AssignedDate = DateTime.UtcNow,
                    Notes = request.AssignmentNotes,
                    CreatedAt = DateTime.UtcNow,
                    CreatedBy = _currentUserService.UserId
                };

                _context.EmployeeAssets.Add(employeeAssignment);
                asset.Status = AssetStatus.Assigned;
            }
        }
        else if (currentAssignment != null)
        {
            // Unassign asset
            currentAssignment.Status = AssignmentStatus.Returned;
            currentAssignment.ReturnedDate = DateTime.UtcNow;
            currentAssignment.Notes = request.AssignmentNotes ?? currentAssignment.Notes;
            currentAssignment.UpdatedAt = DateTime.UtcNow;
            currentAssignment.UpdatedBy = _currentUserService.UserId;
            asset.Status = AssetStatus.Available;
        }

        await _context.SaveChangesAsync(cancellationToken);

        // Load assignment information if exists
        var assignment = await _context.EmployeeAssets
            .Include(ea => ea.Employee)
            .FirstOrDefaultAsync(ea => ea.AssetId == asset.Id && ea.Status == AssignmentStatus.Assigned, cancellationToken);

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
            ItemConfigurationId = asset.ItemConfigurationId,
            ItemName = asset.Item?.Name,
            ProjectId = asset.ProjectId,
            ProjectName = asset.Project?.Name,
            AssignedEmployeeId = assignment?.EmployeeId,
            AssignedEmployeeName = assignment?.Employee != null 
                ? $"{assignment.Employee.EmployeeId} - {assignment.Employee.FirstName} {assignment.Employee.LastName}"
                : null,
            AssignmentDate = assignment?.AssignedDate,
            CreatedAt = asset.CreatedAt,
            CreatedBy = asset.CreatedBy,
            UpdatedAt = asset.UpdatedAt,
            UpdatedBy = asset.UpdatedBy
        };
    }
}
