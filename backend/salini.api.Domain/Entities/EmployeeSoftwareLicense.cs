using salini.api.Domain.Enums;

namespace salini.api.Domain.Entities;

public class EmployeeSoftwareLicense : BaseEntity
{
    public DateTime AssignedDate { get; set; } = DateTime.UtcNow;
    public DateTime? ReturnedDate { get; set; }
    public AssignmentStatus Status { get; set; } = AssignmentStatus.Assigned;
    public string? Notes { get; set; }
    
    // Foreign Keys
    public string EmployeeId { get; set; } = string.Empty;
    public string SoftwareLicenseId { get; set; } = string.Empty;
    
    // Navigation properties
    public virtual Employee Employee { get; set; } = null!;
    public virtual SoftwareLicense SoftwareLicense { get; set; } = null!;
}
