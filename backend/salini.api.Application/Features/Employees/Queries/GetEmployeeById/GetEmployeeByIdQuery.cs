using salini.api.Application.Common.Interfaces;
using salini.api.Application.DTOs.Employee;
using salini.api.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace salini.api.Application.Features.Employees.Queries.GetEmployeeById;

public record GetEmployeeByIdQuery(string Id) : IQuery<EmployeeDto>;

public class GetEmployeeByIdQueryHandler : IRequestHandler<GetEmployeeByIdQuery, EmployeeDto>
{
    private readonly IApplicationDbContext _context;

    public GetEmployeeByIdQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<EmployeeDto> Handle(GetEmployeeByIdQuery request, CancellationToken cancellationToken)
    {
        var employee = await _context.Employees
            .Include(e => e.Nationality)
            .Include(e => e.Department)
            .Include(e => e.SubDepartment)
            .Include(e => e.EmployeeCategory)
            .Include(e => e.EmployeePosition)
            .Include(e => e.Project)
            .Include(e => e.Company)
            .Include(e => e.CostCenter)
            .FirstOrDefaultAsync(e => e.Id == request.Id, cancellationToken);

        if (employee == null)
        {
            throw new NotFoundException($"Employee with ID '{request.Id}' not found.");
        }

        return new EmployeeDto
        {
            Id = employee.Id,
            EmployeeId = employee.EmployeeId,
            FirstName = employee.FirstName,
            LastName = employee.LastName,
            Email = employee.Email,
            Phone = employee.Phone,
            Status = employee.Status,
            NationalityId = employee.NationalityId,
            NationalityName = employee.Nationality?.Name,
            DepartmentId = employee.DepartmentId,
            DepartmentName = employee.Department?.Name,
            SubDepartmentId = employee.SubDepartmentId,
            SubDepartmentName = employee.SubDepartment?.Name,
            EmployeeCategoryId = employee.EmployeeCategoryId,
            EmployeeCategoryName = employee.EmployeeCategory?.Name,
            EmployeePositionId = employee.EmployeePositionId,
            EmployeePositionName = employee.EmployeePosition?.Name,
            ProjectId = employee.ProjectId,
            ProjectName = employee.Project?.Name,
            CompanyId = employee.CompanyId,
            CompanyName = employee.Company?.Name,
            CostCenterId = employee.CostCenterId,
            CostCenterName = employee.CostCenter?.Name,
            CreatedAt = employee.CreatedAt,
            CreatedBy = employee.CreatedBy,
            UpdatedAt = employee.UpdatedAt,
            UpdatedBy = employee.UpdatedBy
        };
    }
}
