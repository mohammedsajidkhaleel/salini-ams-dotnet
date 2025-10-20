using MediatR;
using Microsoft.EntityFrameworkCore;
using salini.api.Application.Common.Interfaces;
using salini.api.Application.DTOs;
using salini.api.Application.DTOs.EmployeeCategory;

namespace salini.api.Application.Features.EmployeeCategories.Queries.GetEmployeeCategories;

public record GetEmployeeCategoriesQuery : IRequest<PaginatedResult<EmployeeCategoryListDto>>
{
    public int PageNumber { get; init; } = 1;
    public int PageSize { get; init; } = 10;
    public string? SearchTerm { get; init; }
    public string? Status { get; init; }
    public string? SortBy { get; init; }
    public bool SortDescending { get; init; } = false;
}

public class GetEmployeeCategoriesQueryHandler : IRequestHandler<GetEmployeeCategoriesQuery, PaginatedResult<EmployeeCategoryListDto>>
{
    private readonly IApplicationDbContext _context;

    public GetEmployeeCategoriesQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PaginatedResult<EmployeeCategoryListDto>> Handle(GetEmployeeCategoriesQuery request, CancellationToken cancellationToken)
    {
        var query = _context.EmployeeCategories.AsQueryable();

        if (!string.IsNullOrEmpty(request.SearchTerm))
        {
            var searchTerm = request.SearchTerm.ToLowerInvariant();
            query = query.Where(ec => 
                ec.Name.ToLower().Contains(searchTerm) ||
                (ec.Description != null && ec.Description.ToLower().Contains(searchTerm)));
        }

        if (!string.IsNullOrEmpty(request.Status))
        {
            if (Enum.TryParse<salini.api.Domain.Enums.Status>(request.Status, true, out var statusEnum))
            {
                query = query.Where(ec => ec.Status == statusEnum);
            }
        }

        query = request.SortBy?.ToLowerInvariant() switch
        {
            "name" => request.SortDescending ? query.OrderByDescending(ec => ec.Name) : query.OrderBy(ec => ec.Name),
            "status" => request.SortDescending ? query.OrderByDescending(ec => ec.Status) : query.OrderBy(ec => ec.Status),
            "createdat" => request.SortDescending ? query.OrderByDescending(ec => ec.CreatedAt) : query.OrderBy(ec => ec.CreatedAt),
            _ => query.OrderBy(ec => ec.Name)
        };

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(ec => new EmployeeCategoryListDto
            {
                Id = ec.Id,
                Name = ec.Name,
                Description = ec.Description,
                Status = ec.Status.ToString(),
                CreatedAt = ec.CreatedAt,
                CreatedBy = ec.CreatedBy
            })
            .ToListAsync(cancellationToken);

        return new PaginatedResult<EmployeeCategoryListDto>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = request.PageNumber,
            PageSize = request.PageSize
        };
    }
}