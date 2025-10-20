using MediatR;
using Microsoft.EntityFrameworkCore;
using salini.api.Application.Common.Interfaces;
using salini.api.Application.DTOs.SimProvider;
using salini.api.Domain.Entities;

namespace salini.api.Application.Features.SimProviders.Queries.GetSimProviderById;

public record GetSimProviderByIdQuery(string Id) : IRequest<SimProviderDto?>;

public class GetSimProviderByIdQueryHandler : IRequestHandler<GetSimProviderByIdQuery, SimProviderDto?>
{
    private readonly IApplicationDbContext _context;

    public GetSimProviderByIdQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<SimProviderDto?> Handle(GetSimProviderByIdQuery request, CancellationToken cancellationToken)
    {
        var simProvider = await _context.SimProviders
            .FirstOrDefaultAsync(sp => sp.Id == request.Id, cancellationToken);

        if (simProvider == null)
        {
            return null;
        }

        return new SimProviderDto
        {
            Id = simProvider.Id,
            Name = simProvider.Name,
            Description = simProvider.Description,
            ContactInfo = simProvider.ContactInfo,
            IsActive = simProvider.IsActive,
            CreatedAt = simProvider.CreatedAt,
            CreatedBy = simProvider.CreatedBy,
            UpdatedAt = simProvider.UpdatedAt,
            UpdatedBy = simProvider.UpdatedBy
        };
    }
}
