using salini.api.Application.Common.Interfaces;
using salini.api.Application.DTOs.Department;
using salini.api.Domain.Entities;
using salini.api.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace salini.api.Application.Features.Departments.Commands.CreateDepartment;

public record CreateDepartmentCommand : ICommand<DepartmentDto>
{
    public string Name { get; init; } = string.Empty;
    public string? Description { get; init; }
    public Status Status { get; init; } = Status.Active;
}

public class CreateDepartmentCommandHandler : IRequestHandler<CreateDepartmentCommand, DepartmentDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public CreateDepartmentCommandHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<DepartmentDto> Handle(CreateDepartmentCommand request, CancellationToken cancellationToken)
    {
        var department = new Department
        {
            Id = Guid.NewGuid().ToString(),
            Name = request.Name,
            Description = request.Description,
            Status = request.Status,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = _currentUserService.UserId
        };

        _context.Departments.Add(department);
        await _context.SaveChangesAsync(cancellationToken);

        return new DepartmentDto
        {
            Id = department.Id,
            Name = department.Name,
            Description = department.Description,
            Status = department.Status.ToString(),
            CreatedAt = department.CreatedAt,
            CreatedBy = department.CreatedBy
        };
    }
}
