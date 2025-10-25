using Microsoft.EntityFrameworkCore;
using salini.api.Domain.Entities;

namespace salini.api.Application.Common.Interfaces;

public interface IApplicationDbContext
{
    // Identity
    DbSet<ApplicationUser> Users { get; }
    
    // Master Data
    DbSet<Company> Companies { get; }
    DbSet<CostCenter> CostCenters { get; }
    DbSet<Nationality> Nationalities { get; }
    DbSet<Department> Departments { get; }
    DbSet<SubDepartment> SubDepartments { get; }
    DbSet<Project> Projects { get; }
    
    // Employee Management
    DbSet<Employee> Employees { get; }
    DbSet<EmployeeCategory> EmployeeCategories { get; }
    DbSet<EmployeePosition> EmployeePositions { get; }
    
    // Asset Management
    DbSet<Asset> Assets { get; }
    DbSet<Item> Items { get; }
    DbSet<ItemCategory> ItemCategories { get; }
    DbSet<Accessory> Accessories { get; }
    DbSet<Supplier> Suppliers { get; }
    DbSet<EmployeeAsset> EmployeeAssets { get; }
    DbSet<EmployeeAccessory> EmployeeAccessories { get; }
    
    // SIM Card Management
    DbSet<SimCard> SimCards { get; }
    DbSet<SimCardPlan> SimCardPlans { get; }
    DbSet<SimProvider> SimProviders { get; }
    DbSet<SimType> SimTypes { get; }
    DbSet<EmployeeSimCard> EmployeeSimCards { get; }
    
    // Software License Management
    DbSet<SoftwareLicense> SoftwareLicenses { get; }
    DbSet<EmployeeSoftwareLicense> EmployeeSoftwareLicenses { get; }
    
    // Purchase Orders
    DbSet<PurchaseOrder> PurchaseOrders { get; }
    DbSet<PurchaseOrderItem> PurchaseOrderItems { get; }
    
    // System
    DbSet<AuditLog> AuditLogs { get; }
    DbSet<UserPermission> UserPermissions { get; }
    DbSet<UserProject> UserProjects { get; }
    DbSet<RefreshToken> RefreshTokens { get; }
    
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
