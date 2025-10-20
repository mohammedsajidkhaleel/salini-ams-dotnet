using System.ComponentModel.DataAnnotations;
using salini.api.Application.DTOs;
using salini.api.Domain.Enums;

namespace salini.api.Application.DTOs.SoftwareLicense;

public class SoftwareLicenseDto : BaseDto
{
    public string SoftwareName { get; set; } = string.Empty;
    public string? LicenseKey { get; set; }
    public string? LicenseType { get; set; }
    public int? Seats { get; set; }
    public string? Vendor { get; set; }
    public DateTime? PurchaseDate { get; set; }
    public DateTime? ExpiryDate { get; set; }
    public decimal? Cost { get; set; }
    public SoftwareLicenseStatus Status { get; set; } = SoftwareLicenseStatus.Active;
    public string? Notes { get; set; }
    public string? PoNumber { get; set; }
    
    // Foreign Keys
    public string? ProjectId { get; set; }
    
    // Navigation properties
    public string? ProjectName { get; set; }
    public string? AssignedEmployeeId { get; set; }
    public string? AssignedEmployeeName { get; set; }
    public DateTime? AssignmentDate { get; set; }
}

public class SoftwareLicenseCreateDto
{
    [Required]
    [StringLength(200)]
    public string SoftwareName { get; set; } = string.Empty;
    
    [StringLength(500)]
    public string? LicenseKey { get; set; }
    
    [StringLength(100)]
    public string? LicenseType { get; set; }
    
    [Range(1, int.MaxValue, ErrorMessage = "Seats must be greater than 0")]
    public int? Seats { get; set; }
    
    [StringLength(200)]
    public string? Vendor { get; set; }
    
    public DateTime? PurchaseDate { get; set; }
    
    public DateTime? ExpiryDate { get; set; }
    
    [Range(0, double.MaxValue, ErrorMessage = "Cost cannot be negative")]
    public decimal? Cost { get; set; }
    
    public SoftwareLicenseStatus Status { get; set; } = SoftwareLicenseStatus.Active;
    
    [StringLength(1000)]
    public string? Notes { get; set; }
    
    [StringLength(100)]
    public string? PoNumber { get; set; }
    
    [Required]
    public string ProjectId { get; set; } = string.Empty;
}

public class SoftwareLicenseUpdateDto
{
    [Required]
    public string Id { get; set; } = string.Empty;
    
    [Required]
    [StringLength(200)]
    public string SoftwareName { get; set; } = string.Empty;
    
    [StringLength(500)]
    public string? LicenseKey { get; set; }
    
    [StringLength(100)]
    public string? LicenseType { get; set; }
    
    [Range(1, int.MaxValue, ErrorMessage = "Seats must be greater than 0")]
    public int? Seats { get; set; }
    
    [StringLength(200)]
    public string? Vendor { get; set; }
    
    public DateTime? PurchaseDate { get; set; }
    
    public DateTime? ExpiryDate { get; set; }
    
    [Range(0, double.MaxValue, ErrorMessage = "Cost cannot be negative")]
    public decimal? Cost { get; set; }
    
    public SoftwareLicenseStatus Status { get; set; }
    
    [StringLength(1000)]
    public string? Notes { get; set; }
    
    [StringLength(100)]
    public string? PoNumber { get; set; }
    
    [Required]
    public string ProjectId { get; set; } = string.Empty;
}

public class SoftwareLicenseListDto
{
    public string Id { get; set; } = string.Empty;
    public string SoftwareName { get; set; } = string.Empty;
    public string? LicenseKey { get; set; }
    public string? LicenseType { get; set; }
    public int? Seats { get; set; }
    public string? Vendor { get; set; }
    public DateTime? PurchaseDate { get; set; }
    public DateTime? ExpiryDate { get; set; }
    public decimal? Cost { get; set; }
    public SoftwareLicenseStatus Status { get; set; }
    public string? PoNumber { get; set; }
    public string? ProjectName { get; set; }
    public string? AssignedEmployeeName { get; set; }
    public DateTime? AssignmentDate { get; set; }
}

public class SoftwareLicenseAssignmentDto
{
    [Required]
    public string EmployeeId { get; set; } = string.Empty;
    
    public string? Notes { get; set; }
}

public class SoftwareLicenseUnassignmentDto
{
    public string? Notes { get; set; }
}
