using MediatR;
using salini.api.Application.Common.Interfaces;
using salini.api.Application.DTOs.SimCard;
using Microsoft.EntityFrameworkCore;

namespace salini.api.Application.Features.SimCards.Queries.GetSimCardById;

public record GetSimCardByIdQuery(string Id) : IRequest<SimCardDto>;

public class GetSimCardByIdQueryHandler : IRequestHandler<GetSimCardByIdQuery, SimCardDto>
{
    private readonly IApplicationDbContext _context;

    public GetSimCardByIdQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<SimCardDto> Handle(GetSimCardByIdQuery request, CancellationToken cancellationToken)
    {
        var simCard = await _context.SimCards
            .Include(s => s.SimType)
            .Include(s => s.SimProvider)
            .Include(s => s.SimCardPlan)
            .Include(s => s.Project)
            .Include(s => s.AssignedEmployee)
            .FirstOrDefaultAsync(s => s.Id == request.Id, cancellationToken);

        if (simCard == null)
        {
            throw new KeyNotFoundException($"SIM card with ID {request.Id} not found.");
        }

        return new SimCardDto
        {
            Id = simCard.Id,
            SimAccountNo = simCard.SimAccountNo,
            SimServiceNo = simCard.SimServiceNo,
            SimStartDate = simCard.SimStartDate,
            SimTypeId = simCard.SimTypeId,
            SimCardPlanId = simCard.SimCardPlanId,
            SimProviderId = simCard.SimProviderId,
            SimStatus = simCard.SimStatus,
            SimSerialNo = simCard.SimSerialNo,
            AssignedTo = simCard.AssignedTo,
            ProjectId = simCard.ProjectId,
            CreatedAt = simCard.CreatedAt,
            CreatedBy = simCard.CreatedBy,
            UpdatedAt = simCard.UpdatedAt,
            UpdatedBy = simCard.UpdatedBy,
            
            // Navigation properties
            ProjectName = simCard.Project?.Name,
            SimTypeName = simCard.SimType?.Name,
            SimCardPlanName = simCard.SimCardPlan?.Name,
            SimProviderName = simCard.SimProvider?.Name,
            AssignedEmployeeId = simCard.AssignedTo,
            AssignedEmployeeName = simCard?.AssignedEmployee != null ? 
                $"{simCard?.AssignedEmployee.FirstName} {simCard?.AssignedEmployee.LastName}" : null,
            AssignmentDate = simCard?.AssignmentDate
        };
    }
}
