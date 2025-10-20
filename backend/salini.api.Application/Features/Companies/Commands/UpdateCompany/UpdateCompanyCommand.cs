using salini.api.Application.Common.Interfaces;
using salini.api.Application.DTOs.Company;
using salini.api.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace salini.api.Application.Features.Companies.Commands.UpdateCompany;

public record UpdateCompanyCommand : ICommand<CompanyDto>
{
    public string Id { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    public string? Description { get; init; }
    public Status Status { get; init; }
}

public class UpdateCompanyCommandHandler : IRequestHandler<UpdateCompanyCommand, CompanyDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public UpdateCompanyCommandHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<CompanyDto> Handle(UpdateCompanyCommand request, CancellationToken cancellationToken)
    {
        var company = await _context.Companies
            .FirstOrDefaultAsync(c => c.Id == request.Id, cancellationToken);

        if (company == null)
            throw new ArgumentException($"Company with ID {request.Id} not found");

        company.Name = request.Name;
        company.Description = request.Description;
        company.Status = request.Status;
        company.UpdatedAt = DateTime.UtcNow;
        company.UpdatedBy = _currentUserService.UserId;

        await _context.SaveChangesAsync(cancellationToken);

        return new CompanyDto
        {
            Id = company.Id,
            Name = company.Name,
            Description = company.Description,
            Status = company.Status,
            CreatedAt = company.CreatedAt,
            CreatedBy = company.CreatedBy,
            UpdatedAt = company.UpdatedAt,
            UpdatedBy = company.UpdatedBy
        };
    }
}
