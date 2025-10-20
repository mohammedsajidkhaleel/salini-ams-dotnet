using salini.api.Domain.Enums;

namespace salini.api.Domain.Entities;

public class Nationality : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Status Status { get; set; } = Status.Active;
    
    // Navigation properties
    public virtual ICollection<Project> Projects { get; set; } = new List<Project>();
    public virtual ICollection<Employee> Employees { get; set; } = new List<Employee>();
}
