namespace salini.api.Domain.Entities;

public class UserPermission : BaseEntity
{
    public string UserId { get; set; } = string.Empty;
    public string Permission { get; set; } = string.Empty;
    public bool IsGranted { get; set; } = true; // true = granted, false = explicitly denied
    
    // Navigation properties
    public ApplicationUser User { get; set; } = null!;
}