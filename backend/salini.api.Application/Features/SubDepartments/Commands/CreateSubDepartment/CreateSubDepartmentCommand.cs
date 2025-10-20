using MediatR;
using Microsoft.EntityFrameworkCore;
using salini.api.Application.Common.Interfaces;
using salini.api.Application.DTOs.SubDepartment;
using salini.api.Domain.Entities;

namespace salini.api.Application.Features.SubDepartments.Commands.CreateSubDepartment;

public record CreateSubDepartmentCommand : IRequest<SubDepartmentDto>
{
    public string Name { get; init; } = string.Empty;
    public string? Description { get; init; }
    public salini.api.Domain.Enums.Status Status { get; init; } = salini.api.Domain.Enums.Status.Active;
    public string DepartmentId { get; init; } = string.Empty;
}

public class CreateSubDepartmentCommandHandler : IRequestHandler<CreateSubDepartmentCommand, SubDepartmentDto>
{
    private readonly IApplicationDbContext _context;

    public CreateSubDepartmentCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<SubDepartmentDto> Handle(CreateSubDepartmentCommand request, CancellationToken cancellationToken)
    {
        // Verify that the Department exists
        var department = await _context.Departments
            .FirstOrDefaultAsync(d => d.Id == request.DepartmentId, cancellationToken);

        if (department == null)
        {
            throw new KeyNotFoundException($"Department with ID {request.DepartmentId} not found.");
        }

        var subDepartment = new SubDepartment
        {
            Id = Guid.NewGuid().ToString(),
            Name = request.Name,
            Description = request.Description,
            Status = request.Status,
            DepartmentId = request.DepartmentId,
            CreatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc),
            CreatedBy = "System" // TODO: Get from current user context
        };

        _context.SubDepartments.Add(subDepartment);
        await _context.SaveChangesAsync(cancellationToken);

        return new SubDepartmentDto
        {
            Id = subDepartment.Id,
            Name = subDepartment.Name,
            Description = subDepartment.Description,
            Status = subDepartment.Status.ToString(),
            DepartmentId = subDepartment.DepartmentId,
            DepartmentName = department.Name,
            CreatedAt = subDepartment.CreatedAt,
            CreatedBy = subDepartment.CreatedBy
        };
    }
}
