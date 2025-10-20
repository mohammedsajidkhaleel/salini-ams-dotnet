using salini.api.Domain.Enums;

namespace salini.api.Domain.Entities;

public class SimCard : BaseEntity
{
    public string SimAccountNo { get; set; } = string.Empty;
    public string SimServiceNo { get; set; } = string.Empty;
    public DateTime? SimStartDate { get; set; }
    public string? SimTypeId { get; set; }
    public string? SimCardPlanId { get; set; }
    public string? SimProviderId { get; set; }
    public SimCardStatus SimStatus { get; set; } = SimCardStatus.Active;
    public string? SimSerialNo { get; set; }
    public string? AssignedTo { get; set; }
    
    // Foreign Keys
    public string? ProjectId { get; set; }
    
    // Navigation properties
    public virtual Project? Project { get; set; }
    public virtual SimType? SimType { get; set; }
    public virtual SimCardPlan? SimCardPlan { get; set; }
    public virtual SimProvider? SimProvider { get; set; }
    public virtual ICollection<EmployeeSimCard> EmployeeSimCards { get; set; } = new List<EmployeeSimCard>();
}
