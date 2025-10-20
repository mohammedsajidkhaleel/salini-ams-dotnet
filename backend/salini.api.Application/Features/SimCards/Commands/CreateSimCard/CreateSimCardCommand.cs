using MediatR;
using salini.api.Application.Common.Interfaces;
using salini.api.Application.DTOs.SimCard;
using salini.api.Domain.Entities;
using salini.api.Domain.Enums;

namespace salini.api.Application.Features.SimCards.Commands.CreateSimCard;

public record CreateSimCardCommand : IRequest<SimCardDto>
{
    public string SimAccountNo { get; init; } = string.Empty;
    public string SimServiceNo { get; init; } = string.Empty;
    public DateTime? SimStartDate { get; init; }
    public string? SimTypeId { get; init; }
    public string? SimCardPlanId { get; init; }
    public string? SimProviderId { get; init; }
    public SimCardStatus SimStatus { get; init; } = SimCardStatus.Active;
    public string? SimSerialNo { get; init; }
    public string? AssignedTo { get; init; }
    public string? ProjectId { get; init; }
}

public class CreateSimCardCommandHandler : IRequestHandler<CreateSimCardCommand, SimCardDto>
{
    private readonly IApplicationDbContext _context;

    public CreateSimCardCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<SimCardDto> Handle(CreateSimCardCommand request, CancellationToken cancellationToken)
    {
        var simCard = new SimCard
        {
            Id = Guid.NewGuid().ToString(),
            SimAccountNo = request.SimAccountNo,
            SimServiceNo = request.SimServiceNo,
            SimStartDate = request.SimStartDate,
            SimTypeId = request.SimTypeId,
            SimCardPlanId = request.SimCardPlanId,
            SimProviderId = request.SimProviderId,
            SimStatus = request.SimStatus,
            SimSerialNo = request.SimSerialNo,
            AssignedTo = request.AssignedTo,
            ProjectId = request.ProjectId,
            CreatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc),
            CreatedBy = "System" // TODO: Get from current user context
        };

        _context.SimCards.Add(simCard);
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
            CreatedBy = simCard.CreatedBy
        };
    }
}
