using salini.api.Domain.Enums;

namespace salini.api.Domain.Entities;

public class Asset : BaseEntity
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
    public virtual Item? Item { get; set; }
    public virtual Project? Project { get; set; }
    public virtual ICollection<EmployeeAsset> EmployeeAssets { get; set; } = new List<EmployeeAsset>();
}
