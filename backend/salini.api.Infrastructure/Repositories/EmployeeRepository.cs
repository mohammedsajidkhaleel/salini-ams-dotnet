using Microsoft.EntityFrameworkCore;
using salini.api.Application.Common.Interfaces;
using salini.api.Domain.Entities;
using salini.api.Domain.Enums;
using salini.api.Infrastructure.Data;

namespace salini.api.Infrastructure.Repositories;

public class EmployeeRepository : BaseRepository<Employee>, IEmployeeRepository
{
    public EmployeeRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<Employee?> GetByEmployeeIdAsync(string employeeId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(e => e.Nationality)
            .Include(e => e.EmployeeCategory)
            .Include(e => e.EmployeePosition)
            .Include(e => e.Department)
            .Include(e => e.SubDepartment)
            .Include(e => e.Project)
            .Include(e => e.Company)
            .Include(e => e.CostCenter)
            .FirstOrDefaultAsync(e => e.EmployeeId == employeeId, cancellationToken);
    }

    public async Task<Employee?> GetByEmailAsync(string email, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(e => e.Nationality)
            .Include(e => e.EmployeeCategory)
            .Include(e => e.EmployeePosition)
            .Include(e => e.Department)
            .Include(e => e.SubDepartment)
            .Include(e => e.Project)
            .Include(e => e.Company)
            .Include(e => e.CostCenter)
            .FirstOrDefaultAsync(e => e.Email == email, cancellationToken);
    }

    public async Task<IEnumerable<Employee>> GetByDepartmentAsync(string departmentId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(e => e.Department)
            .Include(e => e.Project)
            .Include(e => e.Company)
            .Where(e => e.DepartmentId == departmentId)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<Employee>> GetByProjectAsync(string projectId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(e => e.Department)
            .Include(e => e.Project)
            .Include(e => e.Company)
            .Where(e => e.ProjectId == projectId)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<Employee>> GetByStatusAsync(Status status, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(e => e.Department)
            .Include(e => e.Project)
            .Include(e => e.Company)
            .Where(e => e.Status == status)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<Employee>> GetActiveEmployeesAsync(CancellationToken cancellationToken = default)
    {
        return await GetByStatusAsync(Status.Active, cancellationToken);
    }

    public async Task<bool> EmployeeIdExistsAsync(string employeeId, CancellationToken cancellationToken = default)
    {
        return await _dbSet.AnyAsync(e => e.EmployeeId == employeeId, cancellationToken);
    }

    public async Task<bool> EmailExistsAsync(string email, CancellationToken cancellationToken = default)
    {
        return await _dbSet.AnyAsync(e => e.Email == email, cancellationToken);
    }

    public async Task<IEnumerable<Employee>> SearchEmployeesAsync(string searchTerm, CancellationToken cancellationToken = default)
    {
        var term = searchTerm.ToLower();
        return await _dbSet
            .Include(e => e.Department)
            .Include(e => e.Project)
            .Include(e => e.Company)
            .Where(e => 
                e.EmployeeId.ToLower().Contains(term) ||
                e.FirstName.ToLower().Contains(term) ||
                e.LastName.ToLower().Contains(term) ||
                (e.Email != null && e.Email.ToLower().Contains(term)))
            .ToListAsync(cancellationToken);
    }
}
