using MediatR;
using Microsoft.EntityFrameworkCore;
using salini.api.Application.Common.Interfaces;
using salini.api.Application.DTOs.EmployeeCategory;
using salini.api.Domain.Entities;

namespace salini.api.Application.Features.EmployeeCategories.Commands.CreateEmployeeCategory;

public record CreateEmployeeCategoryCommand : IRequest<EmployeeCategoryDto>
{
    public string Name { get; init; } = string.Empty;
    public string? Description { get; init; }
    public salini.api.Domain.Enums.Status Status { get; init; } = salini.api.Domain.Enums.Status.Active;
}

public class CreateEmployeeCategoryCommandHandler : IRequestHandler<CreateEmployeeCategoryCommand, EmployeeCategoryDto>
{
    private readonly IApplicationDbContext _context;

    public CreateEmployeeCategoryCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<EmployeeCategoryDto> Handle(CreateEmployeeCategoryCommand request, CancellationToken cancellationToken)
    {
        var employeeCategory = new EmployeeCategory
        {
            Id = Guid.NewGuid().ToString(),
            Name = request.Name,
            Description = request.Description,
            Status = request.Status,
            CreatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc),
            CreatedBy = "System"
        };

        _context.EmployeeCategories.Add(employeeCategory);
        await _context.SaveChangesAsync(cancellationToken);

        return new EmployeeCategoryDto
        {
            Id = employeeCategory.Id,
            Name = employeeCategory.Name,
            Description = employeeCategory.Description,
            Status = employeeCategory.Status.ToString(),
            CreatedAt = employeeCategory.CreatedAt,
            CreatedBy = employeeCategory.CreatedBy
        };
    }
}