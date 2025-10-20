namespace salini.api.Domain.Entities;

public class AuditLog : BaseEntity
{
    public string TableName { get; set; } = string.Empty;
    public string RecordId { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty; // INSERT, UPDATE, DELETE
    public string? OldValues { get; set; } // JSON
    public string? NewValues { get; set; } // JSON
    
    // Foreign Key
    public string? UserId { get; set; }
    
    // Navigation properties
    public virtual ApplicationUser? User { get; set; }
}
