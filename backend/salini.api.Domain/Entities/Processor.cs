namespace salini.api.Domain.Entities;

public class Processor : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;

    public virtual ICollection<ItemConfiguration> ItemConfigurations { get; set; } = new List<ItemConfiguration>();
}
