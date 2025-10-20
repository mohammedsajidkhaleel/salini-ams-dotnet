using MediatR;
using Microsoft.EntityFrameworkCore;
using salini.api.Application.Common.Interfaces;
using salini.api.Application.DTOs.SubDepartment;
using salini.api.Domain.Entities;

namespace salini.api.Application.Features.SubDepartments.Queries.GetSubDepartmentById;

public record GetSubDepartmentByIdQuery(string Id) : IRequest<SubDepartmentDto?>;

public class GetSubDepartmentByIdQueryHandler : IRequestHandler<GetSubDepartmentByIdQuery, SubDepartmentDto?>
{
    private readonly IApplicationDbContext _context;

    public GetSubDepartmentByIdQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<SubDepartmentDto?> Handle(GetSubDepartmentByIdQuery request, CancellationToken cancellationToken)
    {
        var subDepartment = await _context.SubDepartments
            .Include(sd => sd.Department)
            .FirstOrDefaultAsync(sd => sd.Id == request.Id, cancellationToken);

        if (subDepartment == null)
        {
            return null;
        }

        return new SubDepartmentDto
        {
            Id = subDepartment.Id,
            Name = subDepartment.Name,
            Description = subDepartment.Description,
            Status = subDepartment.Status.ToString(),
            DepartmentId = subDepartment.DepartmentId,
            DepartmentName = subDepartment.Department.Name,
            CreatedAt = subDepartment.CreatedAt,
            CreatedBy = subDepartment.CreatedBy,
            UpdatedAt = subDepartment.UpdatedAt,
            UpdatedBy = subDepartment.UpdatedBy
        };
    }
}
