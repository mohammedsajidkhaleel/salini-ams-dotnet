using MediatR;
using Microsoft.EntityFrameworkCore;
using salini.api.Application.Common.Interfaces;
using salini.api.Application.DTOs;
using salini.api.Application.DTOs.PurchaseOrder;

namespace salini.api.Application.Features.PurchaseOrders.Queries.GetPurchaseOrders;

public record GetPurchaseOrdersQuery : IRequest<PaginatedResult<PurchaseOrderListDto>>
{
    public int PageNumber { get; init; } = 1;
    public int PageSize { get; init; } = 10;
    public string? SearchTerm { get; init; }
    public string? SupplierId { get; init; }
    public string? ProjectId { get; init; }
    public int? Status { get; init; }
    public string? SortBy { get; init; }
    public bool SortDescending { get; init; } = false;
}

public class GetPurchaseOrdersQueryHandler : IRequestHandler<GetPurchaseOrdersQuery, PaginatedResult<PurchaseOrderListDto>>
{
    private readonly IApplicationDbContext _context;

    public GetPurchaseOrdersQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PaginatedResult<PurchaseOrderListDto>> Handle(GetPurchaseOrdersQuery request, CancellationToken cancellationToken)
    {
        var query = _context.PurchaseOrders
            .Include(po => po.Supplier)
            .Include(po => po.Project)
            .Include(po => po.RequestedBy)
            .Include(po => po.Items)
            .AsQueryable();

        // Apply filters
        if (!string.IsNullOrEmpty(request.SearchTerm))
        {
            var searchTerm = request.SearchTerm.ToLower();
            query = query.Where(po => 
                po.PoNumber.ToLower().Contains(searchTerm) ||
                po.Notes != null && po.Notes.ToLower().Contains(searchTerm) ||
                po.Supplier != null && po.Supplier.Name.ToLower().Contains(searchTerm) ||
                po.Project != null && po.Project.Name.ToLower().Contains(searchTerm));
        }

        if (!string.IsNullOrEmpty(request.SupplierId))
        {
            query = query.Where(po => po.SupplierId == request.SupplierId);
        }

        if (!string.IsNullOrEmpty(request.ProjectId))
        {
            query = query.Where(po => po.ProjectId == request.ProjectId);
        }

        if (request.Status.HasValue)
        {
            query = query.Where(po => (int)po.Status == request.Status.Value);
        }

        // Apply sorting
        query = request.SortBy?.ToLower() switch
        {
            "ponumber" => request.SortDescending ? query.OrderByDescending(po => po.PoNumber) : query.OrderBy(po => po.PoNumber),
            "podate" => request.SortDescending ? query.OrderByDescending(po => po.PoDate) : query.OrderBy(po => po.PoDate),
            "status" => request.SortDescending ? query.OrderByDescending(po => po.Status) : query.OrderBy(po => po.Status),
            "supplier" => request.SortDescending ? query.OrderByDescending(po => po.Supplier != null ? po.Supplier.Name : "") : query.OrderBy(po => po.Supplier != null ? po.Supplier.Name : ""),
            "project" => request.SortDescending ? query.OrderByDescending(po => po.Project != null ? po.Project.Name : "") : query.OrderBy(po => po.Project != null ? po.Project.Name : ""),
            _ => query.OrderByDescending(po => po.CreatedAt)
        };

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(po => new PurchaseOrderListDto
            {
                Id = po.Id,
                PoNumber = po.PoNumber,
                PoDate = po.PoDate,
                ExpectedDeliveryDate = po.ExpectedDeliveryDate,
                ActualDeliveryDate = po.ActualDeliveryDate,
                Status = po.Status,
                TotalAmount = po.Items.Sum(i => i.Quantity * i.UnitPrice),
                RequestedByName = po.RequestedBy != null ? $"{po.RequestedBy.FirstName} {po.RequestedBy.LastName}" : null,
                SupplierName = po.Supplier != null ? po.Supplier.Name : "",
                ProjectName = po.Project != null ? po.Project.Name : "",
                ItemCount = po.Items.Count
            })
            .ToListAsync(cancellationToken);

        return new PaginatedResult<PurchaseOrderListDto>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = request.PageNumber,
            PageSize = request.PageSize
        };
    }
}
