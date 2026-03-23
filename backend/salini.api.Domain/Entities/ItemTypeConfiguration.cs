namespace salini.api.Domain.Entities;

public class ItemConfiguration : BaseEntity
{
    public string ItemTypeId { get; set; } = string.Empty;
    public string Specification { get; set; } = string.Empty;
    public string ProcessorId { get; set; } = string.Empty;
    public string ConfigurationText { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;

    public virtual ItemType ItemType { get; set; } = null!;
    public virtual Processor Processor { get; set; } = null!;
}
