using salini.api.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace salini.api.Application.Features.Companies.Commands.DeleteCompany;

public record DeleteCompanyCommand : ICommand
{
    public string Id { get; init; } = string.Empty;
}

public class DeleteCompanyCommandHandler : IRequestHandler<DeleteCompanyCommand>
{
    private readonly IApplicationDbContext _context;

    public DeleteCompanyCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task Handle(DeleteCompanyCommand request, CancellationToken cancellationToken)
    {
        var company = await _context.Companies
            .FirstOrDefaultAsync(c => c.Id == request.Id, cancellationToken);

        if (company == null)
            throw new ArgumentException($"Company with ID {request.Id} not found");

        // Check if company has associated projects or employees
        var hasProjects = await _context.Projects.AnyAsync(p => p.CompanyId == request.Id, cancellationToken);
        var hasEmployees = await _context.Employees.AnyAsync(e => e.CompanyId == request.Id, cancellationToken);

        if (hasProjects || hasEmployees)
            throw new InvalidOperationException("Cannot delete company with associated projects or employees");

        _context.Companies.Remove(company);
        await _context.SaveChangesAsync(cancellationToken);
    }
}
