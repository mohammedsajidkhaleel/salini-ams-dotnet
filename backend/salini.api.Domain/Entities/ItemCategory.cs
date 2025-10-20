using salini.api.Domain.Enums;

namespace salini.api.Domain.Entities;

public class ItemCategory : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Status Status { get; set; } = Status.Active;
    
    // Navigation properties
    public virtual ICollection<Item> Items { get; set; } = new List<Item>();
}
