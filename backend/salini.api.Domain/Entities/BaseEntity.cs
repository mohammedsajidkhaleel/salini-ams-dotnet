using System.ComponentModel.DataAnnotations;

namespace salini.api.Domain.Entities;

public abstract class BaseEntity
{
    [Key]
    public string Id { get; set; } = string.Empty;
    
    public DateTime CreatedAt { get; set; } = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc);
    
    public DateTime? UpdatedAt { get; set; }
    
    public string? CreatedBy { get; set; }
    
    public string? UpdatedBy { get; set; }
}
