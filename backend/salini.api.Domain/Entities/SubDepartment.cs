using salini.api.Domain.Enums;

namespace salini.api.Domain.Entities;

public class SubDepartment : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Status Status { get; set; } = Status.Active;
    
    // Foreign Key
    public string DepartmentId { get; set; } = string.Empty;
    
    // Navigation properties
    public virtual Department Department { get; set; } = null!;
    public virtual ICollection<Employee> Employees { get; set; } = new List<Employee>();
}
