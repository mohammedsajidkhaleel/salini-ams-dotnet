using MediatR;
using Microsoft.EntityFrameworkCore;
using salini.api.Application.Common.Interfaces;
using salini.api.Application.DTOs;
using salini.api.Application.DTOs.SoftwareLicense;
using salini.api.Domain.Enums;

namespace salini.api.Application.Features.SoftwareLicenses.Queries.GetSoftwareLicenses;

public record GetSoftwareLicensesQuery : IRequest<PaginatedResult<SoftwareLicenseListDto>>
{
    public int PageNumber { get; init; } = 1;
    public int PageSize { get; init; } = 10;
    public string? SearchTerm { get; init; }
    public string? ProjectId { get; init; }
    public string? Vendor { get; init; }
    public SoftwareLicenseStatus? Status { get; init; }
    public string? AssignedTo { get; init; }
    public string? SortBy { get; init; }
    public bool SortDescending { get; init; } = false;
}

public class GetSoftwareLicensesQueryHandler : IRequestHandler<GetSoftwareLicensesQuery, PaginatedResult<SoftwareLicenseListDto>>
{
    private readonly IApplicationDbContext _context;

    public GetSoftwareLicensesQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PaginatedResult<SoftwareLicenseListDto>> Handle(GetSoftwareLicensesQuery request, CancellationToken cancellationToken)
    {
        var query = _context.SoftwareLicenses
            .Include(sl => sl.Project)
            .Include(sl => sl.EmployeeSoftwareLicenses)
                .ThenInclude(esl => esl.Employee)
            .AsQueryable();

        // Apply filters
        if (!string.IsNullOrEmpty(request.SearchTerm))
        {
            var searchTerm = request.SearchTerm.ToLowerInvariant();
            query = query.Where(sl => 
                sl.SoftwareName.ToLower().Contains(searchTerm) ||
                sl.Vendor != null && sl.Vendor.ToLower().Contains(searchTerm) ||
                sl.LicenseKey != null && sl.LicenseKey.ToLower().Contains(searchTerm));
        }

        if (!string.IsNullOrEmpty(request.ProjectId))
        {
            query = query.Where(sl => sl.ProjectId == request.ProjectId);
        }

        if (!string.IsNullOrEmpty(request.Vendor))
        {
            query = query.Where(sl => sl.Vendor != null && sl.Vendor.ToLower().Contains(request.Vendor.ToLowerInvariant()));
        }

        if (request.Status.HasValue)
        {
            query = query.Where(sl => sl.Status == request.Status.Value);
        }

        if (!string.IsNullOrEmpty(request.AssignedTo))
        {
            query = query.Where(sl => sl.EmployeeSoftwareLicenses
                .Any(esl => esl.EmployeeId == request.AssignedTo && esl.Status == salini.api.Domain.Enums.AssignmentStatus.Assigned));
        }

        // Apply sorting
        query = request.SortBy?.ToLowerInvariant() switch
        {
            "softwarename" => request.SortDescending ? query.OrderByDescending(sl => sl.SoftwareName) : query.OrderBy(sl => sl.SoftwareName),
            "vendor" => request.SortDescending ? query.OrderByDescending(sl => sl.Vendor) : query.OrderBy(sl => sl.Vendor),
            "purchasedate" => request.SortDescending ? query.OrderByDescending(sl => sl.PurchaseDate) : query.OrderBy(sl => sl.PurchaseDate),
            "expirydate" => request.SortDescending ? query.OrderByDescending(sl => sl.ExpiryDate) : query.OrderBy(sl => sl.ExpiryDate),
            "status" => request.SortDescending ? query.OrderByDescending(sl => sl.Status) : query.OrderBy(sl => sl.Status),
            _ => query.OrderBy(sl => sl.ExpiryDate) // Default sort by expiry date (ascending - closest expiry first)
        };

        // Get total count
        var totalCount = await query.CountAsync(cancellationToken);

        // Apply pagination
        var items = await query
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(sl => new SoftwareLicenseListDto
            {
                Id = sl.Id,
                SoftwareName = sl.SoftwareName,
                LicenseKey = sl.LicenseKey,
                LicenseType = sl.LicenseType,
                Seats = sl.Seats,
                Vendor = sl.Vendor,
                PurchaseDate = sl.PurchaseDate,
                ExpiryDate = sl.ExpiryDate,
                Cost = sl.Cost,
                Status = sl.Status,
                PoNumber = sl.PoNumber,
                ProjectName = sl.Project != null ? sl.Project.Name : null,
                AssignedEmployeeName = sl.EmployeeSoftwareLicenses
                    .Where(esl => esl.Status == salini.api.Domain.Enums.AssignmentStatus.Assigned)
                    .Select(esl => esl.Employee != null ? $"{esl.Employee.FirstName} {esl.Employee.LastName}" : null)
                    .FirstOrDefault(),
                AssignmentDate = sl.EmployeeSoftwareLicenses
                    .Where(esl => esl.Status == salini.api.Domain.Enums.AssignmentStatus.Assigned)
                    .Select(esl => esl.AssignedDate)
                    .FirstOrDefault()
            })
            .ToListAsync(cancellationToken);

        return new PaginatedResult<SoftwareLicenseListDto>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = request.PageNumber,
            PageSize = request.PageSize
        };
    }
}
