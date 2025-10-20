using MediatR;
using Microsoft.EntityFrameworkCore;
using salini.api.Application.Common.Interfaces;
using salini.api.Application.DTOs.Department;
using salini.api.Domain.Entities;

namespace salini.api.Application.Features.Departments.Queries.GetDepartmentById;

public record GetDepartmentByIdQuery(string Id) : IRequest<DepartmentDto?>;

public class GetDepartmentByIdQueryHandler : IRequestHandler<GetDepartmentByIdQuery, DepartmentDto?>
{
    private readonly IApplicationDbContext _context;

    public GetDepartmentByIdQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<DepartmentDto?> Handle(GetDepartmentByIdQuery request, CancellationToken cancellationToken)
    {
        var department = await _context.Departments
            .FirstOrDefaultAsync(d => d.Id == request.Id, cancellationToken);

        if (department == null)
        {
            return null;
        }

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
