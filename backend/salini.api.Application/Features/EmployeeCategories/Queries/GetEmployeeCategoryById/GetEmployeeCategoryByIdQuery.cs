using MediatR;
using Microsoft.EntityFrameworkCore;
using salini.api.Application.Common.Interfaces;
using salini.api.Application.DTOs.EmployeeCategory;
using salini.api.Domain.Entities;

namespace salini.api.Application.Features.EmployeeCategories.Queries.GetEmployeeCategoryById;

public record GetEmployeeCategoryByIdQuery(string Id) : IRequest<EmployeeCategoryDto?>;

public class GetEmployeeCategoryByIdQueryHandler : IRequestHandler<GetEmployeeCategoryByIdQuery, EmployeeCategoryDto?>
{
    private readonly IApplicationDbContext _context;

    public GetEmployeeCategoryByIdQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<EmployeeCategoryDto?> Handle(GetEmployeeCategoryByIdQuery request, CancellationToken cancellationToken)
    {
        var employeeCategory = await _context.EmployeeCategories
            .FirstOrDefaultAsync(ec => ec.Id == request.Id, cancellationToken);

        if (employeeCategory == null)
        {
            return null;
        }

        return new EmployeeCategoryDto
        {
            Id = employeeCategory.Id,
            Name = employeeCategory.Name,
            Description = employeeCategory.Description,
            Status = employeeCategory.Status.ToString(),
            CreatedAt = employeeCategory.CreatedAt,
            CreatedBy = employeeCategory.CreatedBy,
            UpdatedAt = employeeCategory.UpdatedAt,
            UpdatedBy = employeeCategory.UpdatedBy
        };
    }
}