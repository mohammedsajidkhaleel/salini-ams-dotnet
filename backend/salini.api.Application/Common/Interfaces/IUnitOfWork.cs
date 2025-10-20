using salini.api.Application.Common.Interfaces;
using salini.api.Domain.Entities;

namespace salini.api.Application.Common.Interfaces;

public interface IUnitOfWork : IDisposable
{
    IEmployeeRepository Employees { get; }
    IAssetRepository Assets { get; }
    ISimCardRepository SimCards { get; }
    ISoftwareLicenseRepository SoftwareLicenses { get; }
    IRepository<Company> Companies { get; }
    IRepository<CostCenter> CostCenters { get; }
    IRepository<Nationality> Nationalities { get; }
    IRepository<Department> Departments { get; }
    IRepository<SubDepartment> SubDepartments { get; }
    IRepository<Project> Projects { get; }
    IRepository<EmployeeCategory> EmployeeCategories { get; }
    IRepository<EmployeePosition> EmployeePositions { get; }
    IRepository<Item> Items { get; }
    IRepository<ItemCategory> ItemCategories { get; }
    IRepository<Accessory> Accessories { get; }
    IRepository<SimProvider> SimProviders { get; }
    IRepository<SimType> SimTypes { get; }
    IRepository<SimCardPlan> SimCardPlans { get; }
    IRepository<Supplier> Suppliers { get; }
    IRepository<PurchaseOrder> PurchaseOrders { get; }
    IRepository<PurchaseOrderItem> PurchaseOrderItems { get; }
    IRepository<EmployeeAsset> EmployeeAssets { get; }
    IRepository<EmployeeAccessory> EmployeeAccessories { get; }
    IRepository<EmployeeSimCard> EmployeeSimCards { get; }
    IRepository<EmployeeSoftwareLicense> EmployeeSoftwareLicenses { get; }
    IApplicationUserRepository Users { get; }
    IRepository<UserPermission> UserPermissions { get; }
    IRepository<UserProject> UserProjects { get; }
    IRepository<AuditLog> AuditLogs { get; }
    
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
    Task BeginTransactionAsync(CancellationToken cancellationToken = default);
    Task CommitTransactionAsync(CancellationToken cancellationToken = default);
    Task RollbackTransactionAsync(CancellationToken cancellationToken = default);
}
