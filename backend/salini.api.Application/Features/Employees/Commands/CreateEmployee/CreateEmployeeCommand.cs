using salini.api.Application.Common.Interfaces;
using salini.api.Application.DTOs.Employee;
using salini.api.Domain.Entities;
using salini.api.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace salini.api.Application.Features.Employees.Commands.CreateEmployee;

public record CreateEmployeeCommand : ICommand<EmployeeDto>
{
    public string EmployeeId { get; init; } = string.Empty;
    public string FirstName { get; init; } = string.Empty;
    public string LastName { get; init; } = string.Empty;
    public string? Email { get; init; }
    public string? Phone { get; init; }
    public Status Status { get; init; } = Status.Active;
    public string? NationalityId { get; init; }
    public string? EmployeeCategoryId { get; init; }
    public string? EmployeePositionId { get; init; }
    public string? DepartmentId { get; init; }
    public string? SubDepartmentId { get; init; }
    public string? ProjectId { get; init; }
    public string? CompanyId { get; init; }
    public string? CostCenterId { get; init; }
}

public class CreateEmployeeCommandHandler : IRequestHandler<CreateEmployeeCommand, EmployeeDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public CreateEmployeeCommandHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<EmployeeDto> Handle(CreateEmployeeCommand request, CancellationToken cancellationToken)
    {
        // Check if employee ID already exists
        var existingEmployee = await _context.Employees
            .FirstOrDefaultAsync(e => e.EmployeeId == request.EmployeeId, cancellationToken);
            
        if (existingEmployee != null)
        {
            throw new Domain.Exceptions.DuplicateException($"Employee with ID '{request.EmployeeId}' already exists.");
        }

        var employee = new Employee
        {
            Id = Guid.NewGuid().ToString(),
            EmployeeId = request.EmployeeId,
            FirstName = request.FirstName,
            LastName = request.LastName,
            Email = request.Email,
            Phone = request.Phone,
            Status = request.Status,
            NationalityId = request.NationalityId,
            DepartmentId = request.DepartmentId,
            SubDepartmentId = request.SubDepartmentId,
            EmployeeCategoryId = request.EmployeeCategoryId,
            EmployeePositionId = request.EmployeePositionId,
            ProjectId = request.ProjectId,
            CompanyId = request.CompanyId,
            CostCenterId = request.CostCenterId,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = _currentUserService.UserId
        };

        _context.Employees.Add(employee);
        await _context.SaveChangesAsync(cancellationToken);

        // Load the employee with related data for mapping
        var createdEmployee = await _context.Employees
            .Include(e => e.Nationality)
            .Include(e => e.Department)
            .Include(e => e.SubDepartment)
            .Include(e => e.EmployeeCategory)
            .Include(e => e.EmployeePosition)
            .Include(e => e.Project)
            .Include(e => e.Company)
            .Include(e => e.CostCenter)
            .FirstOrDefaultAsync(e => e.Id == employee.Id, cancellationToken);

        return new EmployeeDto
        {
            Id = createdEmployee!.Id,
            EmployeeId = createdEmployee.EmployeeId,
            FirstName = createdEmployee.FirstName,
            LastName = createdEmployee.LastName,
            Email = createdEmployee.Email,
            Phone = createdEmployee.Phone,
            Status = createdEmployee.Status,
            NationalityId = createdEmployee.NationalityId,
            NationalityName = createdEmployee.Nationality?.Name,
            DepartmentId = createdEmployee.DepartmentId,
            DepartmentName = createdEmployee.Department?.Name,
            SubDepartmentId = createdEmployee.SubDepartmentId,
            SubDepartmentName = createdEmployee.SubDepartment?.Name,
            EmployeeCategoryId = createdEmployee.EmployeeCategoryId,
            EmployeeCategoryName = createdEmployee.EmployeeCategory?.Name,
            EmployeePositionId = createdEmployee.EmployeePositionId,
            EmployeePositionName = createdEmployee.EmployeePosition?.Name,
            ProjectId = createdEmployee.ProjectId,
            ProjectName = createdEmployee.Project?.Name,
            CompanyId = createdEmployee.CompanyId,
            CompanyName = createdEmployee.Company?.Name,
            CostCenterId = createdEmployee.CostCenterId,
            CostCenterName = createdEmployee.CostCenter?.Name,
            CreatedAt = createdEmployee.CreatedAt,
            CreatedBy = createdEmployee.CreatedBy
        };
    }
}
