namespace salini.api.Domain.Entities;

public class UserProject : BaseEntity
{
    // Foreign Keys
    public string UserId { get; set; } = string.Empty;
    public string ProjectId { get; set; } = string.Empty;
    
    // Navigation properties
    public virtual ApplicationUser User { get; set; } = null!;
    public virtual Project Project { get; set; } = null!;
}
