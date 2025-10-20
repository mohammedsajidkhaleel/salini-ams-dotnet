using salini.api.Domain.Entities;

namespace salini.api.Domain.Interfaces;

public interface IUnitOfWork : IDisposable
{
    IRepository<Company> Companies { get; }
    IRepository<CostCenter> CostCenters { get; }
    IRepository<Nationality> Nationalities { get; }
    IRepository<Project> Projects { get; }
    IRepository<Department> Departments { get; }
    IRepository<SubDepartment> SubDepartments { get; }
    IRepository<EmployeeCategory> EmployeeCategories { get; }
    IRepository<EmployeePosition> EmployeePositions { get; }
    IRepository<ItemCategory> ItemCategories { get; }
    IRepository<Item> Items { get; }
    IRepository<Employee> Employees { get; }
    IRepository<Asset> Assets { get; }
    IRepository<Accessory> Accessories { get; }
    IRepository<SimCard> SimCards { get; }
    IRepository<SimProvider> SimProviders { get; }
    IRepository<SimType> SimTypes { get; }
    IRepository<SimCardPlan> SimCardPlans { get; }
    IRepository<SoftwareLicense> SoftwareLicenses { get; }
    IRepository<Supplier> Suppliers { get; }
    IRepository<PurchaseOrder> PurchaseOrders { get; }
    IRepository<PurchaseOrderItem> PurchaseOrderItems { get; }
    IRepository<EmployeeAsset> EmployeeAssets { get; }
    IRepository<EmployeeAccessory> EmployeeAccessories { get; }
    IRepository<EmployeeSimCard> EmployeeSimCards { get; }
    IRepository<EmployeeSoftwareLicense> EmployeeSoftwareLicenses { get; }
    IRepository<UserPermission> UserPermissions { get; }
    IRepository<UserProject> UserProjects { get; }
    IRepository<AuditLog> AuditLogs { get; }

    Task<int> SaveChangesAsync();
    Task BeginTransactionAsync();
    Task CommitTransactionAsync();
    Task RollbackTransactionAsync();
}
