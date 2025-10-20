using System.ComponentModel.DataAnnotations;
using salini.api.Application.DTOs;
using salini.api.Domain.Enums;

namespace salini.api.Application.DTOs.Asset;

public class AssetDto : BaseDto
{
    public string AssetTag { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? SerialNumber { get; set; }
    public AssetStatus Status { get; set; } = AssetStatus.Available;
    public string? Condition { get; set; }
    public string? PoNumber { get; set; }
    public string? Location { get; set; }
    public string? Notes { get; set; }
    
    // Foreign Keys
    public string? ItemId { get; set; }
    public string? ProjectId { get; set; }
    
    // Navigation properties
    public string? ItemName { get; set; }
    public string? ProjectName { get; set; }
    public string? AssignedEmployeeId { get; set; }
    public string? AssignedEmployeeName { get; set; }
    public DateTime? AssignmentDate { get; set; }
}

public class AssetCreateDto
{
    [Required]
    [StringLength(100)]
    public string AssetTag { get; set; } = string.Empty;
    
    [Required]
    [StringLength(200)]
    public string Name { get; set; } = string.Empty;
    
    [StringLength(1000)]
    public string? Description { get; set; }
    
    [StringLength(200)]
    public string? SerialNumber { get; set; }
    
    public AssetStatus Status { get; set; } = AssetStatus.Available;
    
    [StringLength(50)]
    public string? Condition { get; set; }
    
    [StringLength(100)]
    public string? PoNumber { get; set; }
    
    [StringLength(200)]
    public string? Location { get; set; }
    
    public string? ItemId { get; set; }
    
    [Required]
    public string ProjectId { get; set; } = string.Empty;
    
    public string? Notes { get; set; }
}

public class AssetUpdateDto
{
    [Required]
    public string Id { get; set; } = string.Empty;
    
    [Required]
    [StringLength(100)]
    public string AssetTag { get; set; } = string.Empty;
    
    [Required]
    [StringLength(200)]
    public string Name { get; set; } = string.Empty;
    
    [StringLength(1000)]
    public string? Description { get; set; }
    
    [StringLength(200)]
    public string? SerialNumber { get; set; }
    
    public AssetStatus Status { get; set; }
    
    [StringLength(50)]
    public string? Condition { get; set; }
    
    [StringLength(100)]
    public string? PoNumber { get; set; }
    
    [StringLength(200)]
    public string? Location { get; set; }
    
    public string? ItemId { get; set; }
    
    [Required]
    public string ProjectId { get; set; } = string.Empty;
    
    public string? Notes { get; set; }
}

public class AssetListDto
{
    public string Id { get; set; } = string.Empty;
    public string AssetTag { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? SerialNumber { get; set; }
    public AssetStatus Status { get; set; }
    public string? Condition { get; set; }
    public string? Location { get; set; }
    public string? PoNumber { get; set; }
    public string? ItemName { get; set; }
    public string? ProjectName { get; set; }
    public string? AssignedEmployeeName { get; set; }
    public DateTime? AssignmentDate { get; set; }
}

public class AssetAssignmentDto
{
    [Required]
    public string AssetId { get; set; } = string.Empty;
    
    [Required]
    public string EmployeeId { get; set; } = string.Empty;
    
    public string? Notes { get; set; }
}

public class AssetUnassignmentDto
{
    [Required]
    public string AssetId { get; set; } = string.Empty;
    
    public string? Notes { get; set; }
}
