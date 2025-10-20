using salini.api.Application.Common.Interfaces;
using salini.api.Application.DTOs.Employee;
using salini.api.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace salini.api.Application.Features.Employees.Commands.UpdateEmployee;

public record UpdateEmployeeCommand : ICommand<EmployeeDto>
{
    public string Id { get; init; } = string.Empty;
    public string EmployeeId { get; init; } = string.Empty;
    public string FirstName { get; init; } = string.Empty;
    public string LastName { get; init; } = string.Empty;
    public string? Email { get; init; }
    public string? Phone { get; init; }
    public salini.api.Domain.Enums.Status Status { get; init; }
    public string? NationalityId { get; init; }
    public string? EmployeeCategoryId { get; init; }
    public string? EmployeePositionId { get; init; }
    public string? DepartmentId { get; init; }
    public string? SubDepartmentId { get; init; }
    public string? ProjectId { get; init; }
    public string? CompanyId { get; init; }
    public string? CostCenterId { get; init; }
}

public class UpdateEmployeeCommandHandler : IRequestHandler<UpdateEmployeeCommand, EmployeeDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public UpdateEmployeeCommandHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<EmployeeDto> Handle(UpdateEmployeeCommand request, CancellationToken cancellationToken)
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

        // Check if employee ID already exists for another employee
        var existingEmployee = await _context.Employees
            .FirstOrDefaultAsync(e => e.EmployeeId == request.EmployeeId && e.Id != request.Id, cancellationToken);
            
        if (existingEmployee != null)
        {
            throw new DuplicateException($"Employee with ID '{request.EmployeeId}' already exists.");
        }

        employee.EmployeeId = request.EmployeeId;
        employee.FirstName = request.FirstName;
        employee.LastName = request.LastName;
        employee.Email = request.Email;
        employee.Phone = request.Phone;
        employee.Status = request.Status;
        employee.NationalityId = request.NationalityId;
        employee.DepartmentId = request.DepartmentId;
        employee.SubDepartmentId = request.SubDepartmentId;
        employee.EmployeeCategoryId = request.EmployeeCategoryId;
        employee.EmployeePositionId = request.EmployeePositionId;
        employee.ProjectId = request.ProjectId;
        employee.CompanyId = request.CompanyId;
        employee.CostCenterId = request.CostCenterId;
        employee.UpdatedAt = DateTime.UtcNow;
        employee.UpdatedBy = _currentUserService.UserId;

        await _context.SaveChangesAsync(cancellationToken);

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
