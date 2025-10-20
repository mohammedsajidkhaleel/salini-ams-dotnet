using MediatR;
using Microsoft.EntityFrameworkCore;
using salini.api.Application.Common.Interfaces;
using salini.api.Application.DTOs.SubDepartment;
using salini.api.Domain.Entities;

namespace salini.api.Application.Features.SubDepartments.Commands.UpdateSubDepartment;

public record UpdateSubDepartmentCommand : IRequest<SubDepartmentDto>
{
    public string Id { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    public string? Description { get; init; }
    public salini.api.Domain.Enums.Status Status { get; init; } = salini.api.Domain.Enums.Status.Active;
    public string DepartmentId { get; init; } = string.Empty;
}

public class UpdateSubDepartmentCommandHandler : IRequestHandler<UpdateSubDepartmentCommand, SubDepartmentDto>
{
    private readonly IApplicationDbContext _context;

    public UpdateSubDepartmentCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<SubDepartmentDto> Handle(UpdateSubDepartmentCommand request, CancellationToken cancellationToken)
    {
        var subDepartment = await _context.SubDepartments
            .Include(sd => sd.Department)
            .FirstOrDefaultAsync(sd => sd.Id == request.Id, cancellationToken);

        if (subDepartment == null)
        {
            throw new KeyNotFoundException($"SubDepartment with ID {request.Id} not found.");
        }

        // Verify that the Department exists
        var department = await _context.Departments
            .FirstOrDefaultAsync(d => d.Id == request.DepartmentId, cancellationToken);

        if (department == null)
        {
            throw new KeyNotFoundException($"Department with ID {request.DepartmentId} not found.");
        }

        subDepartment.Name = request.Name;
        subDepartment.Description = request.Description;
        subDepartment.Status = request.Status;
        subDepartment.DepartmentId = request.DepartmentId;
        subDepartment.UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc);
        subDepartment.UpdatedBy = "System"; // TODO: Get from current user context

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
            CreatedBy = subDepartment.CreatedBy,
            UpdatedAt = subDepartment.UpdatedAt,
            UpdatedBy = subDepartment.UpdatedBy
        };
    }
}
