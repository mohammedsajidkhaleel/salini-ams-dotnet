using MediatR;
using Microsoft.EntityFrameworkCore;
using salini.api.Application.Common.Interfaces;
using salini.api.Application.DTOs.EmployeePosition;
using salini.api.Domain.Entities;

namespace salini.api.Application.Features.EmployeePositions.Commands.UpdateEmployeePosition;

public record UpdateEmployeePositionCommand : IRequest<EmployeePositionDto>
{
    public string Id { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    public string? Description { get; init; }
    public salini.api.Domain.Enums.Status Status { get; init; } = salini.api.Domain.Enums.Status.Active;
}

public class UpdateEmployeePositionCommandHandler : IRequestHandler<UpdateEmployeePositionCommand, EmployeePositionDto>
{
    private readonly IApplicationDbContext _context;

    public UpdateEmployeePositionCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<EmployeePositionDto> Handle(UpdateEmployeePositionCommand request, CancellationToken cancellationToken)
    {
        var employeePosition = await _context.EmployeePositions
            .FirstOrDefaultAsync(ep => ep.Id == request.Id, cancellationToken);

        if (employeePosition == null)
        {
            throw new KeyNotFoundException($"Employee position with ID {request.Id} not found.");
        }

        employeePosition.Name = request.Name;
        employeePosition.Description = request.Description;
        employeePosition.Status = request.Status;
        employeePosition.UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc);
        employeePosition.UpdatedBy = "System";

        await _context.SaveChangesAsync(cancellationToken);

        return new EmployeePositionDto
        {
            Id = employeePosition.Id,
            Name = employeePosition.Name,
            Description = employeePosition.Description,
            Status = employeePosition.Status.ToString(),
            CreatedAt = employeePosition.CreatedAt,
            CreatedBy = employeePosition.CreatedBy,
            UpdatedAt = employeePosition.UpdatedAt,
            UpdatedBy = employeePosition.UpdatedBy
        };
    }
}
