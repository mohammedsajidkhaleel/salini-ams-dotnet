using MediatR;
using Microsoft.EntityFrameworkCore;
using salini.api.Application.Common.Interfaces;
using salini.api.Application.DTOs.ItemConfiguration;

namespace salini.api.Application.Features.ItemConfigurations.Commands.UpdateItemConfiguration;

public record UpdateItemConfigurationCommand : IRequest<ItemConfigurationDto>
{
    public string Id { get; init; } = string.Empty;
    public string ItemTypeId { get; init; } = string.Empty;
    public string Specification { get; init; } = string.Empty;
    public string ProcessorId { get; init; } = string.Empty;
    public string ConfigurationText { get; init; } = string.Empty;
    public bool IsActive { get; init; } = true;
}

public class UpdateItemConfigurationCommandHandler : IRequestHandler<UpdateItemConfigurationCommand, ItemConfigurationDto>
{
    private readonly IApplicationDbContext _context;

    public UpdateItemConfigurationCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ItemConfigurationDto> Handle(UpdateItemConfigurationCommand request, CancellationToken cancellationToken)
    {
        var itemConfiguration = await _context.ItemConfigurations
            .FirstOrDefaultAsync(itc => itc.Id == request.Id, cancellationToken);

        if (itemConfiguration == null)
        {
            throw new KeyNotFoundException($"Item type configuration with ID {request.Id} not found.");
        }

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
            itc => itc.Id != request.Id
                && itc.ItemTypeId == request.ItemTypeId
                && itc.ProcessorId == request.ProcessorId
                && itc.Specification.ToLower() == specification.ToLower(),
            cancellationToken);

        if (exists)
        {
            throw new InvalidOperationException("An item type configuration with the same item type, processor, and specification already exists.");
        }

        itemConfiguration.ItemTypeId = request.ItemTypeId;
        itemConfiguration.Specification = specification;
        itemConfiguration.ProcessorId = request.ProcessorId;
        itemConfiguration.ConfigurationText = request.ConfigurationText;
        itemConfiguration.IsActive = request.IsActive;
        itemConfiguration.UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc);
        itemConfiguration.UpdatedBy = "System";

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
            CreatedBy = itemConfiguration.CreatedBy,
            UpdatedAt = itemConfiguration.UpdatedAt,
            UpdatedBy = itemConfiguration.UpdatedBy
        };
    }
}
