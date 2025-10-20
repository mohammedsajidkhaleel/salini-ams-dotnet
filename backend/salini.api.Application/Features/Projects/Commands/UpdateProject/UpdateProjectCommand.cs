using salini.api.Application.Common.Interfaces;
using salini.api.Application.DTOs.Project;
using salini.api.Domain.Entities;
using salini.api.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace salini.api.Application.Features.Projects.Commands.UpdateProject;

public record UpdateProjectCommand : ICommand<ProjectDto>
{
    public string Id { get; init; } = string.Empty;
    public string Code { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    public string? Description { get; init; }
    public Status Status { get; init; } = Status.Active;
    public string CompanyId { get; init; } = string.Empty;
    public string? CostCenterId { get; init; }
    public string? NationalityId { get; init; }
}

public class UpdateProjectCommandHandler : IRequestHandler<UpdateProjectCommand, ProjectDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public UpdateProjectCommandHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<ProjectDto> Handle(UpdateProjectCommand request, CancellationToken cancellationToken)
    {
        var project = await _context.Projects
            .Include(p => p.Company)
            .FirstOrDefaultAsync(p => p.Id == request.Id, cancellationToken);

        if (project == null)
        {
            throw new KeyNotFoundException($"Project with ID {request.Id} not found.");
        }

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

        // Update project properties
        project.Code = request.Code;
        project.Name = request.Name;
        project.Description = request.Description;
        project.Status = request.Status;
        project.CompanyId = request.CompanyId;
        project.CostCenterId = request.CostCenterId;
        project.NationalityId = request.NationalityId;
        project.UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc);
        project.UpdatedBy = _currentUserService.UserId;

        await _context.SaveChangesAsync(cancellationToken);

        return new ProjectDto
        {
            Id = project.Id,
            Code = project.Code,
            Name = project.Name,
            Description = project.Description,
            Status = project.Status,
            CompanyId = project.CompanyId,
            CompanyName = project.Company?.Name ?? string.Empty,
            CreatedAt = project.CreatedAt,
            CreatedBy = project.CreatedBy,
            UpdatedAt = project.UpdatedAt,
            UpdatedBy = project.UpdatedBy
        };
    }
}
