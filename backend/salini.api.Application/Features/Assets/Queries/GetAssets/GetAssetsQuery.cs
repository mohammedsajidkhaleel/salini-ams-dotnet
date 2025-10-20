using salini.api.Application.Common.Interfaces;
using salini.api.Application.DTOs;
using salini.api.Application.DTOs.Asset;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace salini.api.Application.Features.Assets.Queries.GetAssets;

public record GetAssetsQuery : IQuery<PaginatedResult<AssetListDto>>
{
    public int PageNumber { get; init; } = 1;
    public int PageSize { get; init; } = 10;
    public string? SearchTerm { get; init; }
    public string? SortBy { get; init; }
    public bool SortDescending { get; init; } = false;
    public string? ProjectId { get; init; }
    public string? ItemId { get; init; }
    public salini.api.Domain.Enums.AssetStatus? Status { get; init; }
    public string? AssignedTo { get; init; }
    public bool? Assigned { get; init; }
}

public class GetAssetsQueryHandler : IRequestHandler<GetAssetsQuery, PaginatedResult<AssetListDto>>
{
    private readonly IApplicationDbContext _context;

    public GetAssetsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PaginatedResult<AssetListDto>> Handle(GetAssetsQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Assets
            .Include(a => a.Item)
            .Include(a => a.Project)
            .Include(a => a.EmployeeAssets)
                .ThenInclude(ea => ea.Employee)
            .AsQueryable();

        // Apply filters
        if (!string.IsNullOrEmpty(request.SearchTerm))
        {
            var searchTerm = request.SearchTerm.ToLower();
            query = query.Where(a => 
                a.AssetTag.ToLower().Contains(searchTerm) ||
                a.Name.ToLower().Contains(searchTerm) ||
                (a.SerialNumber != null && a.SerialNumber.ToLower().Contains(searchTerm)) ||
                (a.Description != null && a.Description.ToLower().Contains(searchTerm)));
        }

        if (!string.IsNullOrEmpty(request.ProjectId))
        {
            query = query.Where(a => a.ProjectId == request.ProjectId);
        }

        if (!string.IsNullOrEmpty(request.ItemId))
        {
            query = query.Where(a => a.ItemId == request.ItemId);
        }

        if (request.Status.HasValue)
        {
            query = query.Where(a => a.Status == request.Status.Value);
        }

        if (!string.IsNullOrEmpty(request.AssignedTo))
        {
            query = query.Where(a => a.EmployeeAssets
                .Any(ea => ea.EmployeeId == request.AssignedTo && ea.Status == salini.api.Domain.Enums.AssignmentStatus.Assigned));
        }

        if (request.Assigned.HasValue)
        {
            if (request.Assigned.Value)
            {
                // Get assigned assets
                query = query.Where(a => a.EmployeeAssets
                    .Any(ea => ea.Status == salini.api.Domain.Enums.AssignmentStatus.Assigned));
            }
            else
            {
                // Get unassigned assets
                query = query.Where(a => !a.EmployeeAssets
                    .Any(ea => ea.Status == salini.api.Domain.Enums.AssignmentStatus.Assigned));
            }
        }

        // Apply sorting
        query = request.SortBy?.ToLower() switch
        {
            "assettag" => request.SortDescending ? query.OrderByDescending(a => a.AssetTag) : query.OrderBy(a => a.AssetTag),
            "name" => request.SortDescending ? query.OrderByDescending(a => a.Name) : query.OrderBy(a => a.Name),
            "serialnumber" => request.SortDescending ? query.OrderByDescending(a => a.SerialNumber) : query.OrderBy(a => a.SerialNumber),
            "status" => request.SortDescending ? query.OrderByDescending(a => a.Status) : query.OrderBy(a => a.Status),
            "condition" => request.SortDescending ? query.OrderByDescending(a => a.Condition) : query.OrderBy(a => a.Condition),
            "location" => request.SortDescending ? query.OrderByDescending(a => a.Location) : query.OrderBy(a => a.Location),
            _ => query.OrderBy(a => a.AssetTag)
        };

        var totalCount = await query.CountAsync(cancellationToken);

        var assets = await query
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(a => new AssetListDto
            {
                Id = a.Id,
                AssetTag = a.AssetTag,
                Name = a.Name,
                SerialNumber = a.SerialNumber,
                Status = a.Status,
                Condition = a.Condition,
                Location = a.Location,
                PoNumber = a.PoNumber,
                ItemName = a.Item != null ? a.Item.Name : null,
                ProjectName = a.Project != null ? a.Project.Name : null,
                AssignedEmployeeName = a.EmployeeAssets
                    .Where(ea => ea.Status == salini.api.Domain.Enums.AssignmentStatus.Assigned)
                    .Select(ea => ea.Employee != null ? $"{ea.Employee.FirstName} {ea.Employee.LastName}" : null)
                    .FirstOrDefault(),
                AssignmentDate = a.EmployeeAssets
                    .Where(ea => ea.Status == salini.api.Domain.Enums.AssignmentStatus.Assigned)
                    .Select(ea => ea.AssignedDate)
                    .FirstOrDefault()
            })
            .ToListAsync(cancellationToken);

        return new PaginatedResult<AssetListDto>
        {
            Items = assets,
            TotalCount = totalCount,
            PageNumber = request.PageNumber,
            PageSize = request.PageSize
        };
    }
}
