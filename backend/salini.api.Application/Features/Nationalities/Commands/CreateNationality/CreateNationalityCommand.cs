using MediatR;
using Microsoft.EntityFrameworkCore;
using salini.api.Application.Common.Interfaces;
using salini.api.Application.DTOs.Nationality;
using salini.api.Domain.Entities;

namespace salini.api.Application.Features.Nationalities.Commands.CreateNationality;

public record CreateNationalityCommand : IRequest<NationalityDto>
{
    public string Name { get; init; } = string.Empty;
    public string? Description { get; init; }
    public salini.api.Domain.Enums.Status Status { get; init; } = salini.api.Domain.Enums.Status.Active;
}

public class CreateNationalityCommandHandler : IRequestHandler<CreateNationalityCommand, NationalityDto>
{
    private readonly IApplicationDbContext _context;

    public CreateNationalityCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<NationalityDto> Handle(CreateNationalityCommand request, CancellationToken cancellationToken)
    {
        var nationality = new Nationality
        {
            Id = Guid.NewGuid().ToString(),
            Name = request.Name,
            Description = request.Description,
            Status = request.Status,
            CreatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc),
            CreatedBy = "System"
        };

        _context.Nationalities.Add(nationality);
        await _context.SaveChangesAsync(cancellationToken);

        return new NationalityDto
        {
            Id = nationality.Id,
            Name = nationality.Name,
            Description = nationality.Description,
            Status = nationality.Status.ToString(),
            CreatedAt = nationality.CreatedAt,
            CreatedBy = nationality.CreatedBy
        };
    }
}