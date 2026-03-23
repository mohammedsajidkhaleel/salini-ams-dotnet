using MediatR;
using Microsoft.EntityFrameworkCore;
using salini.api.Application.Common.Interfaces;
using salini.api.Application.DTOs;
using salini.api.Application.DTOs.ItemConfiguration;

namespace salini.api.Application.Features.ItemConfigurations.Queries.GetItemConfigurations;

public record GetItemConfigurationsQuery : IRequest<PaginatedResult<ItemConfigurationListDto>>
{
    public int PageNumber { get; init; } = 1;
    public int PageSize { get; init; } = 10;
    public string? SearchTerm { get; init; }
    public bool? IsActive { get; init; }
    public string? SortBy { get; init; }
    public bool SortDescending { get; init; } = false;
}

public class GetItemConfigurationsQueryHandler : IRequestHandler<GetItemConfigurationsQuery, PaginatedResult<ItemConfigurationListDto>>
{
    private readonly IApplicationDbContext _context;

    public GetItemConfigurationsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PaginatedResult<ItemConfigurationListDto>> Handle(GetItemConfigurationsQuery request, CancellationToken cancellationToken)
    {
        var query = _context.ItemConfigurations
            .Include(itc => itc.ItemType)
            .Include(itc => itc.Processor)
            .AsQueryable();

        if (!string.IsNullOrEmpty(request.SearchTerm))
        {
            var searchTerm = request.SearchTerm.ToLowerInvariant();
            query = query.Where(itc =>
                itc.Specification.ToLower().Contains(searchTerm) ||
                itc.ItemType.Name.ToLower().Contains(searchTerm) ||
                itc.Processor.Name.ToLower().Contains(searchTerm) ||
                itc.ConfigurationText.ToLower().Contains(searchTerm));
        }

        if (request.IsActive.HasValue)
        {
            query = query.Where(itc => itc.IsActive == request.IsActive.Value);
        }

        query = request.SortBy?.ToLowerInvariant() switch
        {
            "itemtype" => request.SortDescending ? query.OrderByDescending(itc => itc.ItemType.Name) : query.OrderBy(itc => itc.ItemType.Name),
            "processor" => request.SortDescending ? query.OrderByDescending(itc => itc.Processor.Name) : query.OrderBy(itc => itc.Processor.Name),
            "specification" => request.SortDescending ? query.OrderByDescending(itc => itc.Specification) : query.OrderBy(itc => itc.Specification),
            "isactive" => request.SortDescending ? query.OrderByDescending(itc => itc.IsActive) : query.OrderBy(itc => itc.IsActive),
            "createdat" => request.SortDescending ? query.OrderByDescending(itc => itc.CreatedAt) : query.OrderBy(itc => itc.CreatedAt),
            _ => query.OrderBy(itc => itc.ItemType.Name).ThenBy(itc => itc.Specification)
        };

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(itc => new ItemConfigurationListDto
            {
                Id = itc.Id,
                ItemTypeId = itc.ItemTypeId,
                ItemTypeName = itc.ItemType.Name,
                Specification = itc.Specification,
                ProcessorId = itc.ProcessorId,
                ProcessorName = itc.Processor.Name,
                IsActive = itc.IsActive,
                CreatedAt = itc.CreatedAt,
                CreatedBy = itc.CreatedBy
            })
            .ToListAsync(cancellationToken);

        return new PaginatedResult<ItemConfigurationListDto>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = request.PageNumber,
            PageSize = request.PageSize
        };
    }
}
