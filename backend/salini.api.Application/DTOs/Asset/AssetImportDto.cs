using salini.api.Application.Features.Employees.Commands.ImportEmployees;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace salini.api.Application.DTOs.Asset;

public class AssetImportDto
{
    [JsonPropertyName("AssetTag")]
    [Required]
    public string AssetTag { get; set; } = string.Empty;
    
    [JsonPropertyName("AssetName")]
    [Required]
    public string AssetName { get; set; } = string.Empty;
    
    [JsonPropertyName("ItemCategory")]
    [Required]
    public string ItemCategory { get; set; } = string.Empty;
    
    [JsonPropertyName("Item")]
    [Required]
    public string Item { get; set; } = string.Empty;
    
    [JsonPropertyName("SerialNo")]
    // SerialNo is optional - no Required attribute
    public string? SerialNo { get; set; }
    
    [JsonPropertyName("AssignedTo")]
    public string? AssignedTo { get; set; }
    
    [JsonPropertyName("Condition")]
    public string Condition { get; set; } = "excellent";
}

public class ImportAssetsRequest
{
    [JsonPropertyName("Assets")]
    [Required]
    public List<AssetImportDto> Assets { get; set; } = new();
    
    [JsonPropertyName("ProjectId")]
    // ProjectId is optional
    public string? ProjectId { get; set; }
}

public class ImportAssetsResult
{
    public bool Success { get; set; }
    public int Imported { get; set; }
    public int Updated { get; set; }
    public List<ImportError> Errors { get; set; } = new();
}

