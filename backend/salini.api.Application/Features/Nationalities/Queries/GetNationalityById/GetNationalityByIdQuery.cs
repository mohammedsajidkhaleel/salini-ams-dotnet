using MediatR;
using Microsoft.EntityFrameworkCore;
using salini.api.Application.Common.Interfaces;
using salini.api.Application.DTOs.Nationality;
using salini.api.Domain.Entities;

namespace salini.api.Application.Features.Nationalities.Queries.GetNationalityById;

public record GetNationalityByIdQuery(string Id) : IRequest<NationalityDto?>;

public class GetNationalityByIdQueryHandler : IRequestHandler<GetNationalityByIdQuery, NationalityDto?>
{
    private readonly IApplicationDbContext _context;

    public GetNationalityByIdQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<NationalityDto?> Handle(GetNationalityByIdQuery request, CancellationToken cancellationToken)
    {
        var nationality = await _context.Nationalities
            .FirstOrDefaultAsync(n => n.Id == request.Id, cancellationToken);

        if (nationality == null)
        {
            return null;
        }

        return new NationalityDto
        {
            Id = nationality.Id,
            Name = nationality.Name,
            Description = nationality.Description,
            Status = nationality.Status.ToString(),
            CreatedAt = nationality.CreatedAt,
            CreatedBy = nationality.CreatedBy,
            UpdatedAt = nationality.UpdatedAt,
            UpdatedBy = nationality.UpdatedBy
        };
    }
}