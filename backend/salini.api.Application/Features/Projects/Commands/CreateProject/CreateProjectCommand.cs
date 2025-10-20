using salini.api.Application.Common.Interfaces;
using salini.api.Application.DTOs.Project;
using salini.api.Domain.Entities;
using salini.api.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace salini.api.Application.Features.Projects.Commands.CreateProject;

public record CreateProjectCommand : ICommand<ProjectDto>
{
    public string Code { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    public string? Description { get; init; }
    public Status Status { get; init; } = Status.Active;
    public string CompanyId { get; init; } = string.Empty;
    public string? CostCenterId { get; init; }
    public string? NationalityId { get; init; }
}

public class CreateProjectCommandHandler : IRequestHandler<CreateProjectCommand, ProjectDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public CreateProjectCommandHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<ProjectDto> Handle(CreateProjectCommand request, CancellationToken cancellationToken)
    {
        // Validate that referenced entities exist
        var companyExists = await _context.Companies.AnyAsync(c => c.Id == request.CompanyId, cancellationToken);
        if (!companyExists)
            throw new ArgumentException($"Company with ID {request.CompanyId} not found");

        // Only validate CostCenter if provided
        if (!string.IsNullOrEmpty(request.CostCenterId))
        {
            var costCenterExists = await _context.CostCenters.AnyAsync(cc => cc.Id == request.CostCenterId, cancellationToken);
            if (!costCenterExists)
                throw new ArgumentException($"Cost Center with ID {request.CostCenterId} not found");
        }

        // Only validate Nationality if provided
        if (!string.IsNullOrEmpty(request.NationalityId))
        {
            var nationalityExists = await _context.Nationalities.AnyAsync(n => n.Id == request.NationalityId, cancellationToken);
            if (!nationalityExists)
                throw new ArgumentException($"Nationality with ID {request.NationalityId} not found");
        }

        var project = new Project
        {
            Id = Guid.NewGuid().ToString(),
            Code = request.Code,
            Name = request.Name,
            Description = request.Description,
            Status = request.Status,
            CompanyId = request.CompanyId,
            CostCenterId = request.CostCenterId,
            NationalityId = request.NationalityId,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = _currentUserService.UserId
        };

        _context.Projects.Add(project);
        await _context.SaveChangesAsync(cancellationToken);

        return new ProjectDto
        {
            Id = project.Id,
            Code = project.Code,
            Name = project.Name,
            Description = project.Description,
            Status = project.Status,
            CompanyId = project.CompanyId,
            CreatedAt = project.CreatedAt,
            CreatedBy = project.CreatedBy
        };
    }
}
