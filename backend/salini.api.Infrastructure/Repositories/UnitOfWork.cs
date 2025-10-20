using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore.Storage;
using salini.api.Application.Common.Interfaces;
using salini.api.Domain.Entities;
using salini.api.Infrastructure.Data;

namespace salini.api.Infrastructure.Repositories;

public class UnitOfWork : IUnitOfWork
{
    private readonly ApplicationDbContext _context;
    private readonly UserManager<ApplicationUser> _userManager;
    private IDbContextTransaction? _transaction;

    public UnitOfWork(ApplicationDbContext context, UserManager<ApplicationUser> userManager)
    {
        _context = context;
        _userManager = userManager;
        
        // Initialize repositories
        Employees = new EmployeeRepository(_context);
        Assets = new AssetRepository(_context);
        SimCards = new SimCardRepository(_context);
        SoftwareLicenses = new SoftwareLicenseRepository(_context);
        Companies = new BaseRepository<Company>(_context);
        CostCenters = new BaseRepository<CostCenter>(_context);
        Nationalities = new BaseRepository<Nationality>(_context);
        Departments = new BaseRepository<Department>(_context);
        SubDepartments = new BaseRepository<SubDepartment>(_context);
        Projects = new BaseRepository<Project>(_context);
        EmployeeCategories = new BaseRepository<EmployeeCategory>(_context);
        EmployeePositions = new BaseRepository<EmployeePosition>(_context);
        Items = new BaseRepository<Item>(_context);
        ItemCategories = new BaseRepository<ItemCategory>(_context);
        Accessories = new BaseRepository<Accessory>(_context);
        SimProviders = new BaseRepository<SimProvider>(_context);
        SimTypes = new BaseRepository<SimType>(_context);
        SimCardPlans = new BaseRepository<SimCardPlan>(_context);
        Suppliers = new BaseRepository<Supplier>(_context);
        PurchaseOrders = new BaseRepository<PurchaseOrder>(_context);
        PurchaseOrderItems = new BaseRepository<PurchaseOrderItem>(_context);
        EmployeeAssets = new BaseRepository<EmployeeAsset>(_context);
        EmployeeAccessories = new BaseRepository<EmployeeAccessory>(_context);
        EmployeeSimCards = new BaseRepository<EmployeeSimCard>(_context);
        EmployeeSoftwareLicenses = new BaseRepository<EmployeeSoftwareLicense>(_context);
        Users = new ApplicationUserRepository(_context, _userManager);
        UserPermissions = new BaseRepository<UserPermission>(_context);
        UserProjects = new BaseRepository<UserProject>(_context);
        AuditLogs = new BaseRepository<AuditLog>(_context);
    }

    public IEmployeeRepository Employees { get; }
    public IAssetRepository Assets { get; }
    public ISimCardRepository SimCards { get; }
    public ISoftwareLicenseRepository SoftwareLicenses { get; }
    public IRepository<Company> Companies { get; }
    public IRepository<CostCenter> CostCenters { get; }
    public IRepository<Nationality> Nationalities { get; }
    public IRepository<Department> Departments { get; }
    public IRepository<SubDepartment> SubDepartments { get; }
    public IRepository<Project> Projects { get; }
    public IRepository<EmployeeCategory> EmployeeCategories { get; }
    public IRepository<EmployeePosition> EmployeePositions { get; }
    public IRepository<Item> Items { get; }
    public IRepository<ItemCategory> ItemCategories { get; }
    public IRepository<Accessory> Accessories { get; }
    public IRepository<SimProvider> SimProviders { get; }
    public IRepository<SimType> SimTypes { get; }
    public IRepository<SimCardPlan> SimCardPlans { get; }
    public IRepository<Supplier> Suppliers { get; }
    public IRepository<PurchaseOrder> PurchaseOrders { get; }
    public IRepository<PurchaseOrderItem> PurchaseOrderItems { get; }
    public IRepository<EmployeeAsset> EmployeeAssets { get; }
    public IRepository<EmployeeAccessory> EmployeeAccessories { get; }
    public IRepository<EmployeeSimCard> EmployeeSimCards { get; }
    public IRepository<EmployeeSoftwareLicense> EmployeeSoftwareLicenses { get; }
    public IApplicationUserRepository Users { get; }
    public IRepository<UserPermission> UserPermissions { get; }
    public IRepository<UserProject> UserProjects { get; }
    public IRepository<AuditLog> AuditLogs { get; }

    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task BeginTransactionAsync(CancellationToken cancellationToken = default)
    {
        _transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
    }

    public async Task CommitTransactionAsync(CancellationToken cancellationToken = default)
    {
        if (_transaction != null)
        {
            await _transaction.CommitAsync(cancellationToken);
            await _transaction.DisposeAsync();
            _transaction = null;
        }
    }

    public async Task RollbackTransactionAsync(CancellationToken cancellationToken = default)
    {
        if (_transaction != null)
        {
            await _transaction.RollbackAsync(cancellationToken);
            await _transaction.DisposeAsync();
            _transaction = null;
        }
    }

    public void Dispose()
    {
        _transaction?.Dispose();
        _context.Dispose();
    }
}
