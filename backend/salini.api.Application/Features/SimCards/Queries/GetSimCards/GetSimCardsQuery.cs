using MediatR;
using salini.api.Application.Common.Interfaces;
using salini.api.Application.DTOs;
using salini.api.Application.DTOs.SimCard;
using Microsoft.EntityFrameworkCore;
using salini.api.Domain.Enums;

namespace salini.api.Application.Features.SimCards.Queries.GetSimCards;

public record GetSimCardsQuery : IQuery<PaginatedResult<SimCardListDto>>
{
    public int PageNumber { get; init; } = 1;
    public int PageSize { get; init; } = 10;
    public string? SearchTerm { get; init; }
    public string? SortBy { get; init; }
    public bool SortDescending { get; init; } = false;
    public string? ProjectId { get; init; }
    public string? SimProviderId { get; init; }
    public string? SimTypeId { get; init; }
    public string? SimCardPlanId { get; init; }
    public SimCardStatus? Status { get; init; }
    public bool? Assigned { get; init; }
    public string? AssignedTo { get; init; }
}

public class GetSimCardsQueryHandler : IRequestHandler<GetSimCardsQuery, PaginatedResult<SimCardListDto>>
{
    private readonly IApplicationDbContext _context;

    public GetSimCardsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PaginatedResult<SimCardListDto>> Handle(GetSimCardsQuery request, CancellationToken cancellationToken)
    {
        var query = _context.SimCards
            .Include(s => s.SimType)
            .Include(s => s.SimProvider)
            .Include(s => s.SimCardPlan)
            .Include(s => s.Project)
            .Include(s => s.EmployeeSimCards)
                .ThenInclude(es => es.Employee)
            .AsQueryable();

        // Apply filters
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

        if (request.Assigned.HasValue)
        {
            if (request.Assigned.Value)
            {
                query = query.Where(s => !string.IsNullOrEmpty(s.AssignedTo));
            }
            else
            {
                query = query.Where(s => string.IsNullOrEmpty(s.AssignedTo));
            }
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
            "simstartdate" => request.SortDescending ? query.OrderByDescending(s => s.SimStartDate) : query.OrderBy(s => s.SimStartDate),
            "simstatus" => request.SortDescending ? query.OrderByDescending(s => s.SimStatus) : query.OrderBy(s => s.SimStatus),
            "createdat" => request.SortDescending ? query.OrderByDescending(s => s.CreatedAt) : query.OrderBy(s => s.CreatedAt),
            _ => query.OrderBy(s => s.SimAccountNo)
        };

        var totalCount = await query.CountAsync(cancellationToken);

        var simCards = await query
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(s => new SimCardListDto
            {
                Id = s.Id,
                SimAccountNo = s.SimAccountNo,
                SimServiceNo = s.SimServiceNo,
                SimStartDate = s.SimStartDate,
                SimStatus = s.SimStatus,
                SimSerialNo = s.SimSerialNo,
                ProjectName = s.Project != null ? s.Project.Name : null,
                SimCardPlanName = s.SimCardPlan != null ? s.SimCardPlan.Name : null,
                SimProviderName = s.SimProvider != null ? s.SimProvider.Name : null,
                SimTypeName = s.SimType != null ? s.SimType.Name : null,
                AssignedEmployeeName = s.EmployeeSimCards
                    .Where(es => es.Status == AssignmentStatus.Assigned)
                    .Select(es => es.Employee != null ? $"{es.Employee.FirstName} {es.Employee.LastName}" : null)
                    .FirstOrDefault(),
                AssignmentDate = s.EmployeeSimCards
                    .Where(es => es.Status == AssignmentStatus.Assigned)
                    .Select(es => es.AssignedDate)
                    .FirstOrDefault()
            })
            .ToListAsync(cancellationToken);

        return new PaginatedResult<SimCardListDto>
        {
            Items = simCards,
            TotalCount = totalCount,
            PageNumber = request.PageNumber,
            PageSize = request.PageSize
        };
    }
}
