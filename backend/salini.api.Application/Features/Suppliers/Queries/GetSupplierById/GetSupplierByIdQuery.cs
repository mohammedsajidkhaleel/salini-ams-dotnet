using MediatR;
using Microsoft.EntityFrameworkCore;
using salini.api.Application.Common.Interfaces;
using salini.api.Application.DTOs.Supplier;
using salini.api.Domain.Entities;

namespace salini.api.Application.Features.Suppliers.Queries.GetSupplierById;

public record GetSupplierByIdQuery(string Id) : IRequest<SupplierDto?>;

public class GetSupplierByIdQueryHandler : IRequestHandler<GetSupplierByIdQuery, SupplierDto?>
{
    private readonly IApplicationDbContext _context;

    public GetSupplierByIdQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<SupplierDto?> Handle(GetSupplierByIdQuery request, CancellationToken cancellationToken)
    {
        var supplier = await _context.Suppliers
            .FirstOrDefaultAsync(s => s.Id == request.Id, cancellationToken);

        if (supplier == null)
        {
            return null;
        }

        return new SupplierDto
        {
            Id = supplier.Id,
            Name = supplier.Name,
            ContactPerson = supplier.ContactPerson,
            Email = supplier.Email,
            Phone = supplier.Phone,
            Address = supplier.Address,
            Status = supplier.Status.ToString(),
            CreatedAt = supplier.CreatedAt,
            CreatedBy = supplier.CreatedBy,
            UpdatedAt = supplier.UpdatedAt,
            UpdatedBy = supplier.UpdatedBy
        };
    }
}
