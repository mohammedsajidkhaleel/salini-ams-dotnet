using MediatR;
using Microsoft.EntityFrameworkCore;
using salini.api.Application.Common.Interfaces;
using salini.api.Application.DTOs.Nationality;
using salini.api.Domain.Entities;

namespace salini.api.Application.Features.Nationalities.Commands.UpdateNationality;

public record UpdateNationalityCommand : IRequest<NationalityDto>
{
    public string Id { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    public string? Description { get; init; }
    public salini.api.Domain.Enums.Status Status { get; init; } = salini.api.Domain.Enums.Status.Active;
}

public class UpdateNationalityCommandHandler : IRequestHandler<UpdateNationalityCommand, NationalityDto>
{
    private readonly IApplicationDbContext _context;

    public UpdateNationalityCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<NationalityDto> Handle(UpdateNationalityCommand request, CancellationToken cancellationToken)
    {
        var nationality = await _context.Nationalities
            .FirstOrDefaultAsync(n => n.Id == request.Id, cancellationToken);

        if (nationality == null)
        {
            throw new KeyNotFoundException($"Nationality with ID {request.Id} not found.");
        }

        nationality.Name = request.Name;
        nationality.Description = request.Description;
        nationality.Status = request.Status;
        nationality.UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc);
        nationality.UpdatedBy = "System";

        await _context.SaveChangesAsync(cancellationToken);

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