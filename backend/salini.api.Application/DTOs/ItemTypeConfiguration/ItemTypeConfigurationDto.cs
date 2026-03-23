using System.ComponentModel.DataAnnotations;

namespace salini.api.Application.DTOs.ItemConfiguration;

public class ItemConfigurationDto
{
    public string Id { get; set; } = string.Empty;
    public string ItemTypeId { get; set; } = string.Empty;
    public string ItemTypeName { get; set; } = string.Empty;
    public string Specification { get; set; } = string.Empty;
    public string ProcessorId { get; set; } = string.Empty;
    public string ProcessorName { get; set; } = string.Empty;
    public string ConfigurationText { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }
    public string? CreatedBy { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public string? UpdatedBy { get; set; }
}

public class ItemConfigurationListDto
{
    public string Id { get; set; } = string.Empty;
    public string ItemTypeId { get; set; } = string.Empty;
    public string ItemTypeName { get; set; } = string.Empty;
    public string Specification { get; set; } = string.Empty;
    public string ProcessorId { get; set; } = string.Empty;
    public string ProcessorName { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }
    public string? CreatedBy { get; set; }
}

public class ItemConfigurationCreateDto
{
    [Required]
    public string ItemTypeId { get; set; } = string.Empty;

    [Required]
    [StringLength(200)]
    public string Specification { get; set; } = string.Empty;

    [Required]
    public string ProcessorId { get; set; } = string.Empty;

    [Required]
    public string ConfigurationText { get; set; } = string.Empty;

    public bool IsActive { get; set; } = true;
}

public class ItemConfigurationUpdateDto
{
    [Required]
    public string Id { get; set; } = string.Empty;

    [Required]
    public string ItemTypeId { get; set; } = string.Empty;

    [Required]
    [StringLength(200)]
    public string Specification { get; set; } = string.Empty;

    [Required]
    public string ProcessorId { get; set; } = string.Empty;

    [Required]
    public string ConfigurationText { get; set; } = string.Empty;

    public bool IsActive { get; set; } = true;
}
