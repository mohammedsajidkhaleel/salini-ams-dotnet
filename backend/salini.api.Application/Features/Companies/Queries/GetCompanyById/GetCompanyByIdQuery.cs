using salini.api.Application.Common.Interfaces;
using salini.api.Application.DTOs.Company;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace salini.api.Application.Features.Companies.Queries.GetCompanyById;

public record GetCompanyByIdQuery : IQuery<CompanyDto?>
{
    public string Id { get; init; } = string.Empty;
}

public class GetCompanyByIdQueryHandler : IRequestHandler<GetCompanyByIdQuery, CompanyDto?>
{
    private readonly IApplicationDbContext _context;

    public GetCompanyByIdQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<CompanyDto?> Handle(GetCompanyByIdQuery request, CancellationToken cancellationToken)
    {
        var company = await _context.Companies
            .FirstOrDefaultAsync(c => c.Id == request.Id, cancellationToken);

        if (company == null)
            return null;

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
