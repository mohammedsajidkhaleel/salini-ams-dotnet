using MediatR;
using Microsoft.EntityFrameworkCore;
using salini.api.Application.Common.Interfaces;
using salini.api.Application.DTOs.Department;
using salini.api.Domain.Entities;

namespace salini.api.Application.Features.Departments.Commands.UpdateDepartment;

public record UpdateDepartmentCommand : IRequest<DepartmentDto>
{
    public string Id { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    public string? Description { get; init; }
    public salini.api.Domain.Enums.Status Status { get; init; } = salini.api.Domain.Enums.Status.Active;
}

public class UpdateDepartmentCommandHandler : IRequestHandler<UpdateDepartmentCommand, DepartmentDto>
{
    private readonly IApplicationDbContext _context;

    public UpdateDepartmentCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<DepartmentDto> Handle(UpdateDepartmentCommand request, CancellationToken cancellationToken)
    {
        var department = await _context.Departments
            .FirstOrDefaultAsync(d => d.Id == request.Id, cancellationToken);

        if (department == null)
        {
            throw new KeyNotFoundException($"Department with ID {request.Id} not found.");
        }

        department.Name = request.Name;
        department.Description = request.Description;
        department.Status = request.Status;
        department.UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc);
        department.UpdatedBy = "System"; // TODO: Get from current user context

        await _context.SaveChangesAsync(cancellationToken);

        return new DepartmentDto
        {
            Id = department.Id,
            Name = department.Name,
            Description = department.Description,
            Status = department.Status.ToString(),
            CreatedAt = department.CreatedAt,
            CreatedBy = department.CreatedBy,
            UpdatedAt = department.UpdatedAt,
            UpdatedBy = department.UpdatedBy
        };
    }
}
