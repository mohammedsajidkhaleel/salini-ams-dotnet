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
    private readonly ICurrentUserService _currentUserService;

    public UpdateSimCardCommandHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
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
        simCard.SimStartDate = request.SimStartDate.HasValue
            ? request.SimStartDate.Value.Kind == DateTimeKind.Utc
                ? request.SimStartDate.Value
                : request.SimStartDate.Value.Kind == DateTimeKind.Unspecified
                    ? DateTime.SpecifyKind(request.SimStartDate.Value, DateTimeKind.Utc)
                    : DateTime.SpecifyKind(request.SimStartDate.Value.ToUniversalTime(), DateTimeKind.Utc)
            : null;
        simCard.SimTypeId = request.SimTypeId;
        simCard.SimCardPlanId = request.SimCardPlanId;
        simCard.SimProviderId = request.SimProviderId;
        simCard.SimStatus = request.SimStatus;
        simCard.SimSerialNo = request.SimSerialNo;
        simCard.AssignedTo = request.AssignedTo;
        if (!string.IsNullOrEmpty(request.AssignedTo))
            simCard.AssignmentDate = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc);
        else
            simCard.AssignmentDate = null;
        simCard.ProjectId = request.ProjectId;
        simCard.UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc);
        simCard.UpdatedBy = _currentUserService.UserId;
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
            AssignmentDate = simCard.AssignmentDate,
            ProjectId = simCard.ProjectId,
            CreatedAt = simCard.CreatedAt,
            CreatedBy = simCard.CreatedBy,
            UpdatedAt = simCard.UpdatedAt,
            UpdatedBy = simCard.UpdatedBy
        };
    }
}
