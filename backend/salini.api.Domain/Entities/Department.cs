using salini.api.Domain.Enums;

namespace salini.api.Domain.Entities;

public class Department : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Status Status { get; set; } = Status.Active;
    
    // Navigation properties
    public virtual ICollection<SubDepartment> SubDepartments { get; set; } = new List<SubDepartment>();
    public virtual ICollection<Employee> Employees { get; set; } = new List<Employee>();
}
