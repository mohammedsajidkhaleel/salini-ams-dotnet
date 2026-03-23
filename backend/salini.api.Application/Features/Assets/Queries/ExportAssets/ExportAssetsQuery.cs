using MediatR;
using Microsoft.EntityFrameworkCore;
using salini.api.Application.Common.Helpers;
using salini.api.Application.Common.Interfaces;
using salini.api.Domain.Enums;

namespace salini.api.Application.Features.Assets.Queries.ExportAssets;

public record ExportAssetsQuery : IRequest<byte[]>
{
    public string? SearchTerm { get; init; }
    public string? ProjectId { get; init; }
    public string? ItemId { get; init; }
    public AssetStatus? Status { get; init; }
    public string? AssignedTo { get; init; }
    public bool? Assigned { get; init; }
    public string? SortBy { get; init; }
    public bool SortDescending { get; init; } = false;
}

public class ExportAssetsQueryHandler : IRequestHandler<ExportAssetsQuery, byte[]>
{
    private readonly IApplicationDbContext _context;

    public ExportAssetsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<byte[]> Handle(ExportAssetsQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Assets
            .Include(a => a.Item)
                .ThenInclude(i => i.ItemCategory)
            .Include(a => a.Project)
            .Include(a => a.EmployeeAssets)
                .ThenInclude(ea => ea.Employee)
            .AsQueryable();

        // Apply filters (same as GetAssetsQuery)
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
                .Any(ea => ea.EmployeeId == request.AssignedTo && ea.Status == AssignmentStatus.Assigned));
        }

        if (request.Assigned.HasValue)
        {
            if (request.Assigned.Value)
            {
                query = query.Where(a => a.EmployeeAssets
                    .Any(ea => ea.Status == AssignmentStatus.Assigned));
            }
            else
            {
                query = query.Where(a => !a.EmployeeAssets
                    .Any(ea => ea.Status == AssignmentStatus.Assigned));
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
            _ => query.OrderBy(a => a.AssetTag)
        };

        var assets = await query.ToListAsync(cancellationToken);

        // Define CSV headers (matching import template)
        var headers = new[]
        {
            "asset_tag",
            "asset_name",
            "item_category",
            "item",
            "serial_no",
            "employee_code",
            "project",
            "po_number",
            "condition"
        };

        // Create CSV rows
        var rows = assets.Select(a =>
        {
            var assignedEmployee = a.EmployeeAssets
                .FirstOrDefault(ea => ea.Status == AssignmentStatus.Assigned);
            var employeeCode = assignedEmployee?.Employee?.EmployeeId ?? string.Empty;

            return new[]
            {
                a.AssetTag,
                a.Name,
                a.Item?.ItemCategory?.Name ?? string.Empty,
                a.Item?.Name ?? string.Empty,
                a.SerialNumber ?? "n/a",
                employeeCode,
                a.Project?.Name ?? string.Empty,
                a.PoNumber ?? string.Empty,
                a.Condition ?? "excellent"
            };
        });

        return CsvExportHelper.CreateCsvFile(headers, rows);
    }
}

