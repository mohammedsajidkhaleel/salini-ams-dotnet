using salini.api.Domain.Enums;

namespace salini.api.Domain.Entities;

public class Employee : BaseEntity
{
    public string EmployeeId { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public Status Status { get; set; } = Status.Active;
    
    // Foreign Keys
    public string? NationalityId { get; set; }
    public string? EmployeeCategoryId { get; set; }
    public string? EmployeePositionId { get; set; }
    public string? DepartmentId { get; set; }
    public string? SubDepartmentId { get; set; }
    public string? ProjectId { get; set; }
    public string? CompanyId { get; set; }
    public string? CostCenterId { get; set; }
    
    // Navigation properties
    public virtual Nationality? Nationality { get; set; }
    public virtual EmployeeCategory? EmployeeCategory { get; set; }
    public virtual EmployeePosition? EmployeePosition { get; set; }
    public virtual Department? Department { get; set; }
    public virtual SubDepartment? SubDepartment { get; set; }
    public virtual Project? Project { get; set; }
    public virtual Company? Company { get; set; }
    public virtual CostCenter? CostCenter { get; set; }
    
    // Assignment relationships
    public virtual ICollection<EmployeeAsset> EmployeeAssets { get; set; } = new List<EmployeeAsset>();
    public virtual ICollection<EmployeeAccessory> EmployeeAccessories { get; set; } = new List<EmployeeAccessory>();
    public virtual ICollection<EmployeeSimCard> EmployeeSimCards { get; set; } = new List<EmployeeSimCard>();
    public virtual ICollection<EmployeeSoftwareLicense> EmployeeSoftwareLicenses { get; set; } = new List<EmployeeSoftwareLicense>();
}
