using MediatR;
using Microsoft.EntityFrameworkCore;
using salini.api.Application.Common.Helpers;
using salini.api.Application.Common.Interfaces;
using salini.api.Domain.Enums;

namespace salini.api.Application.Features.SimCards.Queries.ExportSimCards;

public record ExportSimCardsQuery : IRequest<byte[]>
{
    public string? SearchTerm { get; init; }
    public string? ProjectId { get; init; }
    public string? SimProviderId { get; init; }
    public string? SimTypeId { get; init; }
    public string? SimCardPlanId { get; init; }
    public SimCardStatus? Status { get; init; }
    public string? AssignedTo { get; init; }
    public string? SortBy { get; init; }
    public bool SortDescending { get; init; } = false;
}

public class ExportSimCardsQueryHandler : IRequestHandler<ExportSimCardsQuery, byte[]>
{
    private readonly IApplicationDbContext _context;

    public ExportSimCardsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<byte[]> Handle(ExportSimCardsQuery request, CancellationToken cancellationToken)
    {
        var query = _context.SimCards
            .Include(s => s.SimType)
            .Include(s => s.SimProvider)
            .Include(s => s.SimCardPlan)
            .Include(s => s.Project)
            .Include(s => s.AssignedEmployee)
            .AsQueryable();

        // Apply filters (same as GetSimCardsQuery)
        if (!string.IsNullOrEmpty(request.SearchTerm))
        {
            var searchTerm = request.SearchTerm.ToLower();
            query = query.Where(s =>
                s.SimAccountNo.ToLower().Contains(searchTerm) ||
                s.SimServiceNo.ToLower().Contains(searchTerm) ||
                (s.SimSerialNo != null && s.SimSerialNo.ToLower().Contains(searchTerm)));
        }

        if (!string.IsNullOrEmpty(request.ProjectId))
        {
            query = query.Where(s => s.ProjectId == request.ProjectId);
        }

        if (!string.IsNullOrEmpty(request.SimProviderId))
        {
            query = query.Where(s => s.SimProviderId == request.SimProviderId);
        }

        if (!string.IsNullOrEmpty(request.SimTypeId))
        {
            query = query.Where(s => s.SimTypeId == request.SimTypeId);
        }

        if (!string.IsNullOrEmpty(request.SimCardPlanId))
        {
            query = query.Where(s => s.SimCardPlanId == request.SimCardPlanId);
        }

        if (request.Status.HasValue)
        {
            query = query.Where(s => s.SimStatus == request.Status.Value);
        }

        if (!string.IsNullOrEmpty(request.AssignedTo))
        {
            query = query.Where(s => s.AssignedTo == request.AssignedTo);
        }

        // Apply sorting
        query = request.SortBy?.ToLower() switch
        {
            "simaccountno" => request.SortDescending ? query.OrderByDescending(s => s.SimAccountNo) : query.OrderBy(s => s.SimAccountNo),
            "simserviceno" => request.SortDescending ? query.OrderByDescending(s => s.SimServiceNo) : query.OrderBy(s => s.SimServiceNo),
            "simstatus" => request.SortDescending ? query.OrderByDescending(s => s.SimStatus) : query.OrderBy(s => s.SimStatus),
            _ => query.OrderBy(s => s.SimAccountNo)
        };

        var simCards = await query.ToListAsync(cancellationToken);

        // Define CSV headers (matching import template)
        var headers = new[]
        {
            "sim_account_no",
            "sim_service_no",
            "sim_start_date",
            "sim_type",
            "sim_provider",
            "sim_card_plan",
            "sim_status",
            "sim_serial_no",
            "assigned_to",
            "project"
        };

        // Create CSV rows (matching import template format)
        var rows = simCards.Select(s =>
        {
            var employeeCode = s.AssignedEmployee?.EmployeeId ?? string.Empty;

            string statusText = s.SimStatus switch
            {
                SimCardStatus.Active => "active",
                SimCardStatus.Inactive => "inactive",
                SimCardStatus.Suspended => "suspended",
                SimCardStatus.Expired => "expired",
                _ => "active"
            };

            return new[]
            {
                s.SimAccountNo,
                s.SimServiceNo,
                s.SimStartDate?.ToString("yyyy-MM-dd") ?? string.Empty,
                s.SimType?.Name ?? string.Empty,
                s.SimProvider?.Name ?? string.Empty,
                s.SimCardPlan?.Name ?? string.Empty,
                statusText,
                s.SimSerialNo ?? string.Empty,
                employeeCode,
                s.Project?.Name ?? string.Empty
            };
        });

        return CsvExportHelper.CreateCsvFile(headers, rows);
    }
}

