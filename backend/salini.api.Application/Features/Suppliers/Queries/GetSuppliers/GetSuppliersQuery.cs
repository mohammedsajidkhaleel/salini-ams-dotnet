using MediatR;
using Microsoft.EntityFrameworkCore;
using salini.api.Application.Common.Interfaces;
using salini.api.Application.DTOs;
using salini.api.Application.DTOs.Supplier;

namespace salini.api.Application.Features.Suppliers.Queries.GetSuppliers;

public record GetSuppliersQuery : IRequest<PaginatedResult<SupplierListDto>>
{
    public int PageNumber { get; init; } = 1;
    public int PageSize { get; init; } = 10;
    public string? SearchTerm { get; init; }
    public string? Status { get; init; }
    public string? SortBy { get; init; }
    public bool SortDescending { get; init; } = false;
}

public class GetSuppliersQueryHandler : IRequestHandler<GetSuppliersQuery, PaginatedResult<SupplierListDto>>
{
    private readonly IApplicationDbContext _context;

    public GetSuppliersQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PaginatedResult<SupplierListDto>> Handle(GetSuppliersQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Suppliers.AsQueryable();

        if (!string.IsNullOrEmpty(request.SearchTerm))
        {
            var searchTerm = request.SearchTerm.ToLowerInvariant();
            query = query.Where(s => 
                s.Name.ToLower().Contains(searchTerm) ||
                (s.ContactPerson != null && s.ContactPerson.ToLower().Contains(searchTerm)) ||
                (s.Email != null && s.Email.ToLower().Contains(searchTerm)) ||
                (s.Phone != null && s.Phone.Contains(searchTerm)));
        }

        if (!string.IsNullOrEmpty(request.Status))
        {
            if (Enum.TryParse<salini.api.Domain.Enums.Status>(request.Status, true, out var statusEnum))
            {
                query = query.Where(s => s.Status == statusEnum);
            }
        }

        query = request.SortBy?.ToLowerInvariant() switch
        {
            "name" => request.SortDescending ? query.OrderByDescending(s => s.Name) : query.OrderBy(s => s.Name),
            "contactperson" => request.SortDescending ? query.OrderByDescending(s => s.ContactPerson) : query.OrderBy(s => s.ContactPerson),
            "email" => request.SortDescending ? query.OrderByDescending(s => s.Email) : query.OrderBy(s => s.Email),
            "status" => request.SortDescending ? query.OrderByDescending(s => s.Status) : query.OrderBy(s => s.Status),
            "createdat" => request.SortDescending ? query.OrderByDescending(s => s.CreatedAt) : query.OrderBy(s => s.CreatedAt),
            _ => query.OrderBy(s => s.Name)
        };

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(s => new SupplierListDto
            {
                Id = s.Id,
                Name = s.Name,
                ContactPerson = s.ContactPerson,
                Email = s.Email,
                Phone = s.Phone,
                Address = s.Address,
                Status = s.Status.ToString(),
                CreatedAt = s.CreatedAt,
                CreatedBy = s.CreatedBy
            })
            .ToListAsync(cancellationToken);

        return new PaginatedResult<SupplierListDto>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = request.PageNumber,
            PageSize = request.PageSize
        };
    }
}
