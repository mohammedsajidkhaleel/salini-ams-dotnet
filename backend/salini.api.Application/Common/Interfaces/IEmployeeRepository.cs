using salini.api.Domain.Entities;
using salini.api.Domain.Enums;

namespace salini.api.Application.Common.Interfaces;

public interface IEmployeeRepository : IRepository<Employee>
{
    Task<Employee?> GetByEmployeeIdAsync(string employeeId, CancellationToken cancellationToken = default);
    Task<Employee?> GetByEmailAsync(string email, CancellationToken cancellationToken = default);
    Task<IEnumerable<Employee>> GetByDepartmentAsync(string departmentId, CancellationToken cancellationToken = default);
    Task<IEnumerable<Employee>> GetByProjectAsync(string projectId, CancellationToken cancellationToken = default);
    Task<IEnumerable<Employee>> GetByStatusAsync(Status status, CancellationToken cancellationToken = default);
    Task<IEnumerable<Employee>> GetActiveEmployeesAsync(CancellationToken cancellationToken = default);
    Task<bool> EmployeeIdExistsAsync(string employeeId, CancellationToken cancellationToken = default);
    Task<bool> EmailExistsAsync(string email, CancellationToken cancellationToken = default);
    Task<IEnumerable<Employee>> SearchEmployeesAsync(string searchTerm, CancellationToken cancellationToken = default);
}
