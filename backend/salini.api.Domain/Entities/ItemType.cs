namespace salini.api.Domain.Entities;

public class ItemType : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;

    public virtual ICollection<ItemCategory> ItemCategories { get; set; } = new List<ItemCategory>();
    public virtual ICollection<ItemConfiguration> ItemConfigurations { get; set; } = new List<ItemConfiguration>();
}
