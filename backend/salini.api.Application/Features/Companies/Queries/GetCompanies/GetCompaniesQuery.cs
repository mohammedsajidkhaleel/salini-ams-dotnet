using salini.api.Application.Common.Interfaces;
using salini.api.Application.DTOs;
using salini.api.Application.DTOs.Company;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace salini.api.Application.Features.Companies.Queries.GetCompanies;

public record GetCompaniesQuery : IQuery<PaginatedResult<CompanyListDto>>
{
    public int PageNumber { get; init; } = 1;
    public int PageSize { get; init; } = 10;
    public string? SearchTerm { get; init; }
    public string? SortBy { get; init; }
    public bool SortDescending { get; init; } = false;
}

public class GetCompaniesQueryHandler : IRequestHandler<GetCompaniesQuery, PaginatedResult<CompanyListDto>>
{
    private readonly IApplicationDbContext _context;

    public GetCompaniesQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PaginatedResult<CompanyListDto>> Handle(GetCompaniesQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Companies.AsQueryable();

        // Apply search filter
        if (!string.IsNullOrWhiteSpace(request.SearchTerm))
        {
            query = query.Where(c => c.Name.Contains(request.SearchTerm) || 
                                   (c.Description != null && c.Description.Contains(request.SearchTerm)));
        }

        // Apply sorting
        query = request.SortBy?.ToLower() switch
        {
            "name" => request.SortDescending ? query.OrderByDescending(c => c.Name) : query.OrderBy(c => c.Name),
            "status" => request.SortDescending ? query.OrderByDescending(c => c.Status) : query.OrderBy(c => c.Status),
            "createdat" => request.SortDescending ? query.OrderByDescending(c => c.CreatedAt) : query.OrderBy(c => c.CreatedAt),
            _ => query.OrderBy(c => c.Name)
        };

        // Get total count
        var totalCount = await query.CountAsync(cancellationToken);

        // Apply pagination
        var companies = await query
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(c => new CompanyListDto
            {
                Id = c.Id,
                Name = c.Name,
                Description = c.Description,
                Status = c.Status,
                ProjectCount = _context.Projects.Count(p => p.CompanyId == c.Id),
                EmployeeCount = _context.Employees.Count(e => e.CompanyId == c.Id)
            })
            .ToListAsync(cancellationToken);

        return new PaginatedResult<CompanyListDto>
        {
            Items = companies,
            TotalCount = totalCount,
            PageNumber = request.PageNumber,
            PageSize = request.PageSize
        };
    }
}
