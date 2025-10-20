using MediatR;
using salini.api.Application.Common.Interfaces;
using salini.api.Application.DTOs.SimCard;
using salini.api.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace salini.api.Application.Features.SimCards.Commands.UpdateSimCard;

public record UpdateSimCardCommand : IRequest<SimCardDto>
{
    public string Id { get; init; } = string.Empty;
    public string SimAccountNo { get; init; } = string.Empty;
    public string SimServiceNo { get; init; } = string.Empty;
    public DateTime? SimStartDate { get; init; }
    public string? SimTypeId { get; init; }
    public string? SimCardPlanId { get; init; }
    public string? SimProviderId { get; init; }
    public SimCardStatus SimStatus { get; init; }
    public string? SimSerialNo { get; init; }
    public string? AssignedTo { get; init; }
    public string? ProjectId { get; init; }
}

public class UpdateSimCardCommandHandler : IRequestHandler<UpdateSimCardCommand, SimCardDto>
{
    private readonly IApplicationDbContext _context;

    public UpdateSimCardCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<SimCardDto> Handle(UpdateSimCardCommand request, CancellationToken cancellationToken)
    {
        var simCard = await _context.SimCards
            .FirstOrDefaultAsync(s => s.Id == request.Id, cancellationToken);

        if (simCard == null)
        {
            throw new KeyNotFoundException($"SIM card with ID {request.Id} not found.");
        }

        simCard.SimAccountNo = request.SimAccountNo;
        simCard.SimServiceNo = request.SimServiceNo;
        simCard.SimStartDate = request.SimStartDate;
        simCard.SimTypeId = request.SimTypeId;
        simCard.SimCardPlanId = request.SimCardPlanId;
        simCard.SimProviderId = request.SimProviderId;
        simCard.SimStatus = request.SimStatus;
        simCard.SimSerialNo = request.SimSerialNo;
        simCard.AssignedTo = request.AssignedTo;
        simCard.ProjectId = request.ProjectId;
        simCard.UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc);
        simCard.UpdatedBy = "System"; // TODO: Get from current user context

        await _context.SaveChangesAsync(cancellationToken);

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
            UpdatedBy = simCard.UpdatedBy
        };
    }
}
