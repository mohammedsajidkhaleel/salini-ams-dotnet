using MediatR;
using Microsoft.EntityFrameworkCore;
using salini.api.Application.Common.Interfaces;
using salini.api.Application.DTOs.SimType;
using salini.api.Domain.Entities;

namespace salini.api.Application.Features.SimTypes.Queries.GetSimTypeById;

public record GetSimTypeByIdQuery(string Id) : IRequest<SimTypeDto?>;

public class GetSimTypeByIdQueryHandler : IRequestHandler<GetSimTypeByIdQuery, SimTypeDto?>
{
    private readonly IApplicationDbContext _context;

    public GetSimTypeByIdQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<SimTypeDto?> Handle(GetSimTypeByIdQuery request, CancellationToken cancellationToken)
    {
        var simType = await _context.SimTypes
            .FirstOrDefaultAsync(st => st.Id == request.Id, cancellationToken);

        if (simType == null)
        {
            return null;
        }

        return new SimTypeDto
        {
            Id = simType.Id,
            Name = simType.Name,
            Description = simType.Description,
            IsActive = simType.IsActive,
            CreatedAt = simType.CreatedAt,
            CreatedBy = simType.CreatedBy,
            UpdatedAt = simType.UpdatedAt,
            UpdatedBy = simType.UpdatedBy
        };
    }
}
