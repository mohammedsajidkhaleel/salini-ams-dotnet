using MediatR;
using Microsoft.EntityFrameworkCore;
using salini.api.Application.Common.Interfaces;
using salini.api.Application.DTOs.CostCenter;
using salini.api.Domain.Entities;

namespace salini.api.Application.Features.CostCenters.Queries.GetCostCenterById;

public record GetCostCenterByIdQuery(string Id) : IRequest<CostCenterDto?>;

public class GetCostCenterByIdQueryHandler : IRequestHandler<GetCostCenterByIdQuery, CostCenterDto?>
{
    private readonly IApplicationDbContext _context;

    public GetCostCenterByIdQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<CostCenterDto?> Handle(GetCostCenterByIdQuery request, CancellationToken cancellationToken)
    {
        var costCenter = await _context.CostCenters
            .FirstOrDefaultAsync(cc => cc.Id == request.Id, cancellationToken);

        if (costCenter == null)
        {
            return null;
        }

        return new CostCenterDto
        {
            Id = costCenter.Id,
            Code = costCenter.Code,
            Name = costCenter.Name,
            Description = costCenter.Description,
            Status = costCenter.Status.ToString(),
            CreatedAt = costCenter.CreatedAt,
            CreatedBy = costCenter.CreatedBy,
            UpdatedAt = costCenter.UpdatedAt,
            UpdatedBy = costCenter.UpdatedBy
        };
    }
}
