using MediatR;
using Microsoft.EntityFrameworkCore;
using salini.api.Application.Common.Interfaces;
using salini.api.Application.DTOs.ItemConfiguration;

namespace salini.api.Application.Features.ItemConfigurations.Queries.GetItemConfigurationById;

public record GetItemConfigurationByIdQuery(string Id) : IRequest<ItemConfigurationDto?>;

public class GetItemConfigurationByIdQueryHandler : IRequestHandler<GetItemConfigurationByIdQuery, ItemConfigurationDto?>
{
    private readonly IApplicationDbContext _context;

    public GetItemConfigurationByIdQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ItemConfigurationDto?> Handle(GetItemConfigurationByIdQuery request, CancellationToken cancellationToken)
    {
        var itemTypeConfiguration = await _context.ItemConfigurations
            .Include(itc => itc.ItemType)
            .Include(itc => itc.Processor)
            .FirstOrDefaultAsync(itc => itc.Id == request.Id, cancellationToken);

        if (itemTypeConfiguration == null)
        {
            return null;
        }

        return new ItemConfigurationDto
        {
            Id = itemTypeConfiguration.Id,
            ItemTypeId = itemTypeConfiguration.ItemTypeId,
            ItemTypeName = itemTypeConfiguration.ItemType.Name,
            Specification = itemTypeConfiguration.Specification,
            ProcessorId = itemTypeConfiguration.ProcessorId,
            ProcessorName = itemTypeConfiguration.Processor.Name,
            ConfigurationText = itemTypeConfiguration.ConfigurationText,
            IsActive = itemTypeConfiguration.IsActive,
            CreatedAt = itemTypeConfiguration.CreatedAt,
            CreatedBy = itemTypeConfiguration.CreatedBy,
            UpdatedAt = itemTypeConfiguration.UpdatedAt,
            UpdatedBy = itemTypeConfiguration.UpdatedBy
        };
    }
}
