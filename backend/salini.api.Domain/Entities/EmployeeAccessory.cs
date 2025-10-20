using salini.api.Domain.Enums;

namespace salini.api.Domain.Entities;

public class EmployeeAccessory : BaseEntity
{
    public int Quantity { get; set; } = 1;
    public DateTime AssignedDate { get; set; } = DateTime.UtcNow;
    public DateTime? ReturnedDate { get; set; }
    public AssignmentStatus Status { get; set; } = AssignmentStatus.Assigned;
    public string? Notes { get; set; }
    
    // Foreign Keys
    public string EmployeeId { get; set; } = string.Empty;
    public string AccessoryId { get; set; } = string.Empty;
    
    // Navigation properties
    public virtual Employee Employee { get; set; } = null!;
    public virtual Accessory Accessory { get; set; } = null!;
}
