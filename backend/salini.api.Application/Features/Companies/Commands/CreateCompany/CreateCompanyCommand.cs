using salini.api.Application.Common.Interfaces;
using salini.api.Application.DTOs.Company;
using salini.api.Domain.Entities;
using salini.api.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace salini.api.Application.Features.Companies.Commands.CreateCompany;

public record CreateCompanyCommand : ICommand<CompanyDto>
{
    public string Name { get; init; } = string.Empty;
    public string? Description { get; init; }
    public Status Status { get; init; } = Status.Active;
}

public class CreateCompanyCommandHandler : IRequestHandler<CreateCompanyCommand, CompanyDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public CreateCompanyCommandHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<CompanyDto> Handle(CreateCompanyCommand request, CancellationToken cancellationToken)
    {
        var company = new Company
        {
            Id = Guid.NewGuid().ToString(),
            Name = request.Name,
            Description = request.Description,
            Status = request.Status,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = _currentUserService.UserId
        };

        _context.Companies.Add(company);
        await _context.SaveChangesAsync(cancellationToken);

        return new CompanyDto
        {
            Id = company.Id,
            Name = company.Name,
            Description = company.Description,
            Status = company.Status,
            CreatedAt = company.CreatedAt,
            CreatedBy = company.CreatedBy
        };
    }
}
