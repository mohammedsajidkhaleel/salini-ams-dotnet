using salini.api.Domain.Enums;

namespace salini.api.Domain.Entities;

public class SimCardPlan : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? DataLimit { get; set; }
    public decimal? MonthlyFee { get; set; }
    public bool IsActive { get; set; } = true;
    
    // Foreign Key
    public string? ProviderId { get; set; }
    
    // Navigation properties
    public virtual SimProvider? Provider { get; set; }
    public virtual ICollection<SimCard> SimCards { get; set; } = new List<SimCard>();
}
