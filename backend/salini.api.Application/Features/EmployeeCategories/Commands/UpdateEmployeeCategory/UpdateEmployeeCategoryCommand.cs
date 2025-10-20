using MediatR;
using Microsoft.EntityFrameworkCore;
using salini.api.Application.Common.Interfaces;
using salini.api.Application.DTOs.EmployeeCategory;
using salini.api.Domain.Entities;

namespace salini.api.Application.Features.EmployeeCategories.Commands.UpdateEmployeeCategory;

public record UpdateEmployeeCategoryCommand : IRequest<EmployeeCategoryDto>
{
    public string Id { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    public string? Description { get; init; }
    public salini.api.Domain.Enums.Status Status { get; init; } = salini.api.Domain.Enums.Status.Active;
}

public class UpdateEmployeeCategoryCommandHandler : IRequestHandler<UpdateEmployeeCategoryCommand, EmployeeCategoryDto>
{
    private readonly IApplicationDbContext _context;

    public UpdateEmployeeCategoryCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<EmployeeCategoryDto> Handle(UpdateEmployeeCategoryCommand request, CancellationToken cancellationToken)
    {
        var employeeCategory = await _context.EmployeeCategories
            .FirstOrDefaultAsync(ec => ec.Id == request.Id, cancellationToken);

        if (employeeCategory == null)
        {
            throw new KeyNotFoundException($"Employee category with ID {request.Id} not found.");
        }

        employeeCategory.Name = request.Name;
        employeeCategory.Description = request.Description;
        employeeCategory.Status = request.Status;
        employeeCategory.UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc);
        employeeCategory.UpdatedBy = "System";

        await _context.SaveChangesAsync(cancellationToken);

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