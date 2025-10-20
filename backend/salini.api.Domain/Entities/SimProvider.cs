using salini.api.Domain.Enums;

namespace salini.api.Domain.Entities;

public class SimProvider : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? ContactInfo { get; set; }
    public bool IsActive { get; set; } = true;
    
    // Navigation properties
    public virtual ICollection<SimCardPlan> SimCardPlans { get; set; } = new List<SimCardPlan>();
    public virtual ICollection<SimCard> SimCards { get; set; } = new List<SimCard>();
}
