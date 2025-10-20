using MediatR;
using Microsoft.EntityFrameworkCore;
using salini.api.Application.Common.Interfaces;
using salini.api.Application.DTOs.Accessory;
using salini.api.Domain.Entities;

namespace salini.api.Application.Features.Accessories.Queries.GetAccessoryById;

public record GetAccessoryByIdQuery(string Id) : IRequest<AccessoryDto?>;

public class GetAccessoryByIdQueryHandler : IRequestHandler<GetAccessoryByIdQuery, AccessoryDto?>
{
    private readonly IApplicationDbContext _context;

    public GetAccessoryByIdQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<AccessoryDto?> Handle(GetAccessoryByIdQuery request, CancellationToken cancellationToken)
    {
        var accessory = await _context.Accessories
            .FirstOrDefaultAsync(a => a.Id == request.Id, cancellationToken);

        if (accessory == null)
        {
            return null;
        }

        return new AccessoryDto
        {
            Id = accessory.Id,
            Name = accessory.Name,
            Description = accessory.Description,
            Status = accessory.Status.ToString(),
            CreatedAt = accessory.CreatedAt,
            CreatedBy = accessory.CreatedBy,
            UpdatedAt = accessory.UpdatedAt,
            UpdatedBy = accessory.UpdatedBy
        };
    }
}
