using salini.api.Domain.Enums;

namespace salini.api.Domain.Entities;

public class Item : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Status Status { get; set; } = Status.Active;
    
    // Foreign Key
    public string ItemCategoryId { get; set; } = string.Empty;
    
    // Navigation properties
    public virtual ItemCategory ItemCategory { get; set; } = null!;
    public virtual ICollection<Asset> Assets { get; set; } = new List<Asset>();
}
