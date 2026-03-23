using MediatR;
using Microsoft.EntityFrameworkCore;
using salini.api.Application.Common.Interfaces;
using salini.api.Application.DTOs.ItemConfiguration;
using salini.api.Domain.Entities;

namespace salini.api.Application.Features.ItemConfigurations.Commands.CreateItemConfiguration;

public record CreateItemConfigurationCommand : IRequest<ItemConfigurationDto>
{
    public string ItemTypeId { get; init; } = string.Empty;
    public string Specification { get; init; } = string.Empty;
    public string ProcessorId { get; init; } = string.Empty;
    public string ConfigurationText { get; init; } = string.Empty;
    public bool IsActive { get; init; } = true;
}

public class CreateItemConfigurationCommandHandler : IRequestHandler<CreateItemConfigurationCommand, ItemConfigurationDto>
{
    private readonly IApplicationDbContext _context;

    public CreateItemConfigurationCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ItemConfigurationDto> Handle(CreateItemConfigurationCommand request, CancellationToken cancellationToken)
    {
        var itemType = await _context.ItemTypes.FirstOrDefaultAsync(it => it.Id == request.ItemTypeId, cancellationToken);
        if (itemType == null)
        {
            throw new KeyNotFoundException($"Item type with ID {request.ItemTypeId} not found.");
        }

        var processor = await _context.Processors.FirstOrDefaultAsync(p => p.Id == request.ProcessorId, cancellationToken);
        if (processor == null)
        {
            throw new KeyNotFoundException($"Processor with ID {request.ProcessorId} not found.");
        }

        var specification = request.Specification.Trim();
        var exists = await _context.ItemConfigurations.AnyAsync(
            itc => itc.ItemTypeId == request.ItemTypeId
                && itc.ProcessorId == request.ProcessorId
                && itc.Specification.ToLower() == specification.ToLower(),
            cancellationToken);

        if (exists)
        {
            throw new InvalidOperationException("An item type configuration with the same item type, processor, and specification already exists.");
        }

        var itemConfiguration = new ItemConfiguration
        {
            Id = Guid.NewGuid().ToString(),
            ItemTypeId = request.ItemTypeId,
            Specification = specification,
            ProcessorId = request.ProcessorId,
            ConfigurationText = request.ConfigurationText,
            IsActive = request.IsActive,
            CreatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc),
            CreatedBy = "System"
        };

        _context.ItemConfigurations.Add(itemConfiguration);
        await _context.SaveChangesAsync(cancellationToken);

        return new ItemConfigurationDto
        {
            Id = itemConfiguration.Id,
            ItemTypeId = itemConfiguration.ItemTypeId,
            ItemTypeName = itemType.Name,
            Specification = itemConfiguration.Specification,
            ProcessorId = itemConfiguration.ProcessorId,
            ProcessorName = processor.Name,
            ConfigurationText = itemConfiguration.ConfigurationText,
            IsActive = itemConfiguration.IsActive,
            CreatedAt = itemConfiguration.CreatedAt,
            CreatedBy = itemConfiguration.CreatedBy
        };
    }
}
