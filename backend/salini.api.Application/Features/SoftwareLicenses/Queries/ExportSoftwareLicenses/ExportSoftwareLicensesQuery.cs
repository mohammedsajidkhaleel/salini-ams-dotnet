using MediatR;
using Microsoft.EntityFrameworkCore;
using salini.api.Application.Common.Helpers;
using salini.api.Application.Common.Interfaces;
using salini.api.Domain.Enums;

namespace salini.api.Application.Features.SoftwareLicenses.Queries.ExportSoftwareLicenses;

public record ExportSoftwareLicensesQuery : IRequest<byte[]>
{
    public string? SearchTerm { get; init; }
    public string? ProjectId { get; init; }
    public string? Vendor { get; init; }
    public SoftwareLicenseStatus? Status { get; init; }
    public string? AssignedTo { get; init; }
    public string? SortBy { get; init; }
    public bool SortDescending { get; init; } = false;
}

public class ExportSoftwareLicensesQueryHandler : IRequestHandler<ExportSoftwareLicensesQuery, byte[]>
{
    private readonly IApplicationDbContext _context;

    public ExportSoftwareLicensesQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<byte[]> Handle(ExportSoftwareLicensesQuery request, CancellationToken cancellationToken)
    {
        var query = _context.SoftwareLicenses
            .Include(sl => sl.Project)
            .Include(sl => sl.EmployeeSoftwareLicenses)
                .ThenInclude(esl => esl.Employee)
            .AsQueryable();

        // Apply filters (same as GetSoftwareLicensesQuery)
        if (!string.IsNullOrEmpty(request.SearchTerm))
        {
            var searchTerm = request.SearchTerm.ToLower();
            query = query.Where(sl =>
                sl.SoftwareName.ToLower().Contains(searchTerm) ||
                (sl.Vendor != null && sl.Vendor.ToLower().Contains(searchTerm)) ||
                (sl.LicenseKey != null && sl.LicenseKey.ToLower().Contains(searchTerm)));
        }

        if (!string.IsNullOrEmpty(request.ProjectId))
        {
            query = query.Where(sl => sl.ProjectId == request.ProjectId);
        }

        if (!string.IsNullOrEmpty(request.Vendor))
        {
            query = query.Where(sl => sl.Vendor == request.Vendor);
        }

        if (request.Status.HasValue)
        {
            query = query.Where(sl => sl.Status == request.Status.Value);
        }

        if (!string.IsNullOrEmpty(request.AssignedTo))
        {
            query = query.Where(sl => sl.EmployeeSoftwareLicenses
                .Any(esl => esl.EmployeeId == request.AssignedTo && esl.Status == AssignmentStatus.Assigned));
        }

        // Apply sorting
        query = request.SortBy?.ToLower() switch
        {
            "softwarename" => request.SortDescending ? query.OrderByDescending(sl => sl.SoftwareName) : query.OrderBy(sl => sl.SoftwareName),
            "vendor" => request.SortDescending ? query.OrderByDescending(sl => sl.Vendor) : query.OrderBy(sl => sl.Vendor),
            "status" => request.SortDescending ? query.OrderByDescending(sl => sl.Status) : query.OrderBy(sl => sl.Status),
            "purchasedate" => request.SortDescending ? query.OrderByDescending(sl => sl.PurchaseDate) : query.OrderBy(sl => sl.PurchaseDate),
            "expirydate" => request.SortDescending ? query.OrderByDescending(sl => sl.ExpiryDate) : query.OrderBy(sl => sl.ExpiryDate),
            _ => query.OrderBy(sl => sl.SoftwareName)
        };

        var licenses = await query.ToListAsync(cancellationToken);

        // Define CSV headers (matching import template format - snake_case)
        var headers = new[]
        {
            "software_name",
            "vendor",
            "license_type",
            "license_key",
            "seats",
            "status",
            "po_number",
            "project",
            "purchase_date",
            "expiry_date",
            "cost",
            "notes"
        };

        // Create CSV rows
        var rows = licenses.Select(sl =>
        {
            string statusText = sl.Status switch
            {
                SoftwareLicenseStatus.Active => "active",
                SoftwareLicenseStatus.Inactive => "inactive",
                SoftwareLicenseStatus.Expired => "expired",
                _ => "active"
            };

            return new[]
            {
                sl.SoftwareName,
                sl.Vendor ?? string.Empty,
                sl.LicenseType ?? string.Empty,
                sl.LicenseKey ?? string.Empty,
                sl.Seats?.ToString() ?? "0",
                statusText,
                sl.PoNumber ?? string.Empty,
                sl.Project?.Name ?? string.Empty,
                sl.PurchaseDate?.ToString("yyyy-MM-dd") ?? string.Empty,
                sl.ExpiryDate?.ToString("yyyy-MM-dd") ?? string.Empty,
                sl.Cost?.ToString("F2") ?? string.Empty,
                sl.Notes ?? string.Empty
            };
        });

        return CsvExportHelper.CreateCsvFile(headers, rows);
    }
}

