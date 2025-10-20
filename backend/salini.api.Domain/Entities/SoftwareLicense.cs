using salini.api.Domain.Enums;

namespace salini.api.Domain.Entities;

public class SoftwareLicense : BaseEntity
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
    public virtual Project? Project { get; set; }
    public virtual ICollection<EmployeeSoftwareLicense> EmployeeSoftwareLicenses { get; set; } = new List<EmployeeSoftwareLicense>();
}
