using MediatR;
using Microsoft.EntityFrameworkCore;
using salini.api.Application.Common.Interfaces;
using salini.api.Application.DTOs.EmployeePosition;
using salini.api.Domain.Entities;

namespace salini.api.Application.Features.EmployeePositions.Commands.CreateEmployeePosition;

public record CreateEmployeePositionCommand : IRequest<EmployeePositionDto>
{
    public string Name { get; init; } = string.Empty;
    public string? Description { get; init; }
    public salini.api.Domain.Enums.Status Status { get; init; } = salini.api.Domain.Enums.Status.Active;
}

public class CreateEmployeePositionCommandHandler : IRequestHandler<CreateEmployeePositionCommand, EmployeePositionDto>
{
    private readonly IApplicationDbContext _context;

    public CreateEmployeePositionCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<EmployeePositionDto> Handle(CreateEmployeePositionCommand request, CancellationToken cancellationToken)
    {
        var employeePosition = new EmployeePosition
        {
            Id = Guid.NewGuid().ToString(),
            Name = request.Name,
            Description = request.Description,
            Status = request.Status,
            CreatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc),
            CreatedBy = "System"
        };

        _context.EmployeePositions.Add(employeePosition);
        await _context.SaveChangesAsync(cancellationToken);

        return new EmployeePositionDto
        {
            Id = employeePosition.Id,
            Name = employeePosition.Name,
            Description = employeePosition.Description,
            Status = employeePosition.Status.ToString(),
            CreatedAt = employeePosition.CreatedAt,
            CreatedBy = employeePosition.CreatedBy
        };
    }
}
