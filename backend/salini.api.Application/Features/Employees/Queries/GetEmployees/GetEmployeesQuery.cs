using salini.api.Application.Common.Interfaces;
using salini.api.Application.DTOs;
using salini.api.Application.DTOs.Employee;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace salini.api.Application.Features.Employees.Queries.GetEmployees;

public record GetEmployeesQuery : IQuery<PaginatedResult<EmployeeListDto>>
{
    public int PageNumber { get; init; } = 1;
    public int PageSize { get; init; } = 10;
    public string? SearchTerm { get; init; }
    public string? SortBy { get; init; }
    public bool SortDescending { get; init; } = false;
    public string? DepartmentId { get; init; }
    public string? ProjectId { get; init; }
    public string? CompanyId { get; init; }
    public salini.api.Domain.Enums.Status? Status { get; init; }
}

public class GetEmployeesQueryHandler : IRequestHandler<GetEmployeesQuery, PaginatedResult<EmployeeListDto>>
{
    private readonly IApplicationDbContext _context;

    public GetEmployeesQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PaginatedResult<EmployeeListDto>> Handle(GetEmployeesQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Employees
            .Include(e => e.Department)
            .Include(e => e.SubDepartment)
            .Include(e => e.Project)
            .Include(e => e.Company)
            .Include(e => e.EmployeeCategory)
            .Include(e => e.EmployeePosition)
            .Include(e => e.EmployeeAssets)
            .Include(e => e.EmployeeSimCards)
            .Include(e => e.EmployeeSoftwareLicenses)
            .AsQueryable();

        // Apply filters
        if (!string.IsNullOrEmpty(request.SearchTerm))
        {
            var searchTerm = request.SearchTerm.ToLower();
            query = query.Where(e => 
                e.EmployeeId.ToLower().Contains(searchTerm) ||
                e.FirstName.ToLower().Contains(searchTerm) ||
                e.LastName.ToLower().Contains(searchTerm) ||
                (e.Email != null && e.Email.ToLower().Contains(searchTerm)));
        }

        if (!string.IsNullOrEmpty(request.DepartmentId))
        {
            query = query.Where(e => e.DepartmentId == request.DepartmentId);
        }

        if (!string.IsNullOrEmpty(request.ProjectId))
        {
            query = query.Where(e => e.ProjectId == request.ProjectId);
        }

        if (!string.IsNullOrEmpty(request.CompanyId))
        {
            query = query.Where(e => e.CompanyId == request.CompanyId);
        }

        if (request.Status.HasValue)
        {
            query = query.Where(e => e.Status == request.Status.Value);
        }

        // Apply sorting
        query = request.SortBy?.ToLower() switch
        {
            "employeeid" => request.SortDescending ? query.OrderByDescending(e => e.EmployeeId) : query.OrderBy(e => e.EmployeeId),
            "firstname" => request.SortDescending ? query.OrderByDescending(e => e.FirstName) : query.OrderBy(e => e.FirstName),
            "lastname" => request.SortDescending ? query.OrderByDescending(e => e.LastName) : query.OrderBy(e => e.LastName),
            "email" => request.SortDescending ? query.OrderByDescending(e => e.Email) : query.OrderBy(e => e.Email),
            "status" => request.SortDescending ? query.OrderByDescending(e => e.Status) : query.OrderBy(e => e.Status),
            _ => query.OrderBy(e => e.EmployeeId)
        };

        var totalCount = await query.CountAsync(cancellationToken);

        var employees = await query
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(e => new EmployeeListDto
            {
                Id = e.Id,
                EmployeeId = e.EmployeeId,
                FullName = $"{e.FirstName} {e.LastName}",
                Email = e.Email,
                Phone = e.Phone,
                DepartmentName = e.Department != null ? e.Department.Name : null,
                SubDepartmentName = e.SubDepartment != null ? e.SubDepartment.Name : null,
                EmployeePositionName = e.EmployeePosition != null ? e.EmployeePosition.Name : null,
                ProjectName = e.Project != null ? e.Project.Name : null,
                CompanyName = e.Company != null ? e.Company.Name : null,
                Status = e.Status,
                AssetCount = e.EmployeeAssets.Count,
                SimCardCount = e.EmployeeSimCards.Count,
                SoftwareLicenseCount = e.EmployeeSoftwareLicenses.Count
            })
            .ToListAsync(cancellationToken);

        return new PaginatedResult<EmployeeListDto>
        {
            Items = employees,
            TotalCount = totalCount,
            PageNumber = request.PageNumber,
            PageSize = request.PageSize
        };
    }
}
