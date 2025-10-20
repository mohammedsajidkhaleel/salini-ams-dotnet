using salini.api.Domain.Enums;

namespace salini.api.Domain.Entities;

public class Project : BaseEntity
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Status Status { get; set; } = Status.Active;
    
    // Foreign Keys
    public string? CompanyId { get; set; }
    public string? CostCenterId { get; set; }
    public string? NationalityId { get; set; }
    
    // Navigation properties
    public virtual Company? Company { get; set; }
    public virtual CostCenter? CostCenter { get; set; }
    public virtual Nationality? Nationality { get; set; }
    public virtual ICollection<Employee> Employees { get; set; } = new List<Employee>();
    public virtual ICollection<Asset> Assets { get; set; } = new List<Asset>();
    public virtual ICollection<SimCard> SimCards { get; set; } = new List<SimCard>();
    public virtual ICollection<SoftwareLicense> SoftwareLicenses { get; set; } = new List<SoftwareLicense>();
    public virtual ICollection<PurchaseOrder> PurchaseOrders { get; set; } = new List<PurchaseOrder>();
    public virtual ICollection<UserProject> UserProjects { get; set; } = new List<UserProject>();
}
