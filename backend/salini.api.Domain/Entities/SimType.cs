using salini.api.Domain.Enums;

namespace salini.api.Domain.Entities;

public class SimType : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
    
    // Navigation properties
    public virtual ICollection<SimCard> SimCards { get; set; } = new List<SimCard>();
}
