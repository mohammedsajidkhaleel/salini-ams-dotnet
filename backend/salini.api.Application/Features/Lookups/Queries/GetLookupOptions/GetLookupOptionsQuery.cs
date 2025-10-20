using salini.api.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace salini.api.Application.Features.Lookups.Queries.GetLookupOptions;

public record GetLookupOptionsQuery : IQuery<List<LookupOptionDto>>
{
    public string LookupType { get; init; } = string.Empty;
    public bool IncludeInactive { get; init; } = false;
}

public class GetLookupOptionsQueryHandler : IRequestHandler<GetLookupOptionsQuery, List<LookupOptionDto>>
{
    private readonly IApplicationDbContext _context;

    public GetLookupOptionsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<LookupOptionDto>> Handle(GetLookupOptionsQuery request, CancellationToken cancellationToken)
    {
        return request.LookupType.ToLower() switch
        {
            "companies" => await GetCompanies(request.IncludeInactive, cancellationToken),
            "departments" => await GetDepartments(request.IncludeInactive, cancellationToken),
            "subdepartments" => await GetSubDepartments(request.IncludeInactive, cancellationToken),
            "projects" => await GetProjects(request.IncludeInactive, cancellationToken),
            "costcenters" => await GetCostCenters(request.IncludeInactive, cancellationToken),
            "nationalities" => await GetNationalities(request.IncludeInactive, cancellationToken),
            "employeecategories" => await GetEmployeeCategories(request.IncludeInactive, cancellationToken),
            "employeepositions" => await GetEmployeePositions(request.IncludeInactive, cancellationToken),
            "itemcategories" => await GetItemCategories(request.IncludeInactive, cancellationToken),
            "items" => await GetItems(request.IncludeInactive, cancellationToken),
            "suppliers" => await GetSuppliers(request.IncludeInactive, cancellationToken),
            "simproviders" => await GetSimProviders(request.IncludeInactive, cancellationToken),
            "simtypes" => await GetSimTypes(request.IncludeInactive, cancellationToken),
            "simcardplans" => await GetSimCardPlans(request.IncludeInactive, cancellationToken),
            _ => new List<LookupOptionDto>()
        };
    }

    private async Task<List<LookupOptionDto>> GetCompanies(bool includeInactive, CancellationToken cancellationToken)
    {
        var query = _context.Companies.AsQueryable();
        if (!includeInactive)
            query = query.Where(c => c.Status == salini.api.Domain.Enums.Status.Active);

        return await query
            .Select(c => new LookupOptionDto { Id = c.Id, Name = c.Name })
            .OrderBy(c => c.Name)
            .ToListAsync(cancellationToken);
    }

    private async Task<List<LookupOptionDto>> GetDepartments(bool includeInactive, CancellationToken cancellationToken)
    {
        var query = _context.Departments.AsQueryable();
        if (!includeInactive)
            query = query.Where(d => d.Status == salini.api.Domain.Enums.Status.Active);

        return await query
            .Select(d => new LookupOptionDto { Id = d.Id, Name = d.Name })
            .OrderBy(d => d.Name)
            .ToListAsync(cancellationToken);
    }

    private async Task<List<LookupOptionDto>> GetSubDepartments(bool includeInactive, CancellationToken cancellationToken)
    {
        var query = _context.SubDepartments.AsQueryable();
        if (!includeInactive)
            query = query.Where(sd => sd.Status == salini.api.Domain.Enums.Status.Active);

        return await query
            .Select(sd => new LookupOptionDto { Id = sd.Id, Name = sd.Name })
            .OrderBy(sd => sd.Name)
            .ToListAsync(cancellationToken);
    }

    private async Task<List<LookupOptionDto>> GetProjects(bool includeInactive, CancellationToken cancellationToken)
    {
        var query = _context.Projects.AsQueryable();
        if (!includeInactive)
            query = query.Where(p => p.Status == salini.api.Domain.Enums.Status.Active);

        return await query
            .Select(p => new LookupOptionDto { Id = p.Id, Name = p.Name })
            .OrderBy(p => p.Name)
            .ToListAsync(cancellationToken);
    }

    private async Task<List<LookupOptionDto>> GetCostCenters(bool includeInactive, CancellationToken cancellationToken)
    {
        var query = _context.CostCenters.AsQueryable();
        if (!includeInactive)
            query = query.Where(cc => cc.Status == salini.api.Domain.Enums.Status.Active);

        return await query
            .Select(cc => new LookupOptionDto { Id = cc.Id, Name = cc.Name })
            .OrderBy(cc => cc.Name)
            .ToListAsync(cancellationToken);
    }

    private async Task<List<LookupOptionDto>> GetNationalities(bool includeInactive, CancellationToken cancellationToken)
    {
        var query = _context.Nationalities.AsQueryable();
        if (!includeInactive)
            query = query.Where(n => n.Status == salini.api.Domain.Enums.Status.Active);

        return await query
            .Select(n => new LookupOptionDto { Id = n.Id, Name = n.Name })
            .OrderBy(n => n.Name)
            .ToListAsync(cancellationToken);
    }

    private async Task<List<LookupOptionDto>> GetEmployeeCategories(bool includeInactive, CancellationToken cancellationToken)
    {
        var query = _context.EmployeeCategories.AsQueryable();
        if (!includeInactive)
            query = query.Where(ec => ec.Status == salini.api.Domain.Enums.Status.Active);

        return await query
            .Select(ec => new LookupOptionDto { Id = ec.Id, Name = ec.Name })
            .OrderBy(ec => ec.Name)
            .ToListAsync(cancellationToken);
    }

    private async Task<List<LookupOptionDto>> GetEmployeePositions(bool includeInactive, CancellationToken cancellationToken)
    {
        var query = _context.EmployeePositions.AsQueryable();
        if (!includeInactive)
            query = query.Where(ep => ep.Status == salini.api.Domain.Enums.Status.Active);

        return await query
            .Select(ep => new LookupOptionDto { Id = ep.Id, Name = ep.Name })
            .OrderBy(ep => ep.Name)
            .ToListAsync(cancellationToken);
    }

    private async Task<List<LookupOptionDto>> GetItemCategories(bool includeInactive, CancellationToken cancellationToken)
    {
        var query = _context.ItemCategories.AsQueryable();
        if (!includeInactive)
            query = query.Where(ic => ic.Status == salini.api.Domain.Enums.Status.Active);

        return await query
            .Select(ic => new LookupOptionDto { Id = ic.Id, Name = ic.Name })
            .OrderBy(ic => ic.Name)
            .ToListAsync(cancellationToken);
    }

    private async Task<List<LookupOptionDto>> GetItems(bool includeInactive, CancellationToken cancellationToken)
    {
        var query = _context.Items.AsQueryable();
        if (!includeInactive)
            query = query.Where(i => i.Status == salini.api.Domain.Enums.Status.Active);

        return await query
            .Select(i => new LookupOptionDto { Id = i.Id, Name = i.Name })
            .OrderBy(i => i.Name)
            .ToListAsync(cancellationToken);
    }

    private async Task<List<LookupOptionDto>> GetSuppliers(bool includeInactive, CancellationToken cancellationToken)
    {
        var query = _context.Suppliers.AsQueryable();
        if (!includeInactive)
            query = query.Where(s => s.Status == salini.api.Domain.Enums.Status.Active);

        return await query
            .Select(s => new LookupOptionDto { Id = s.Id, Name = s.Name })
            .OrderBy(s => s.Name)
            .ToListAsync(cancellationToken);
    }

    private async Task<List<LookupOptionDto>> GetSimProviders(bool includeInactive, CancellationToken cancellationToken)
    {
        var query = _context.SimProviders.AsQueryable();
        if (!includeInactive)
            query = query.Where(sp => sp.IsActive);

        return await query
            .Select(sp => new LookupOptionDto { Id = sp.Id, Name = sp.Name })
            .OrderBy(sp => sp.Name)
            .ToListAsync(cancellationToken);
    }

    private async Task<List<LookupOptionDto>> GetSimTypes(bool includeInactive, CancellationToken cancellationToken)
    {
        var query = _context.SimTypes.AsQueryable();
        if (!includeInactive)
            query = query.Where(st => st.IsActive);

        return await query
            .Select(st => new LookupOptionDto { Id = st.Id, Name = st.Name })
            .OrderBy(st => st.Name)
            .ToListAsync(cancellationToken);
    }

    private async Task<List<LookupOptionDto>> GetSimCardPlans(bool includeInactive, CancellationToken cancellationToken)
    {
        var query = _context.SimCardPlans.AsQueryable();
        if (!includeInactive)
            query = query.Where(scp => scp.IsActive);

        return await query
            .Select(scp => new LookupOptionDto { Id = scp.Id, Name = scp.Name })
            .OrderBy(scp => scp.Name)
            .ToListAsync(cancellationToken);
    }
}

public class LookupOptionDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
}
