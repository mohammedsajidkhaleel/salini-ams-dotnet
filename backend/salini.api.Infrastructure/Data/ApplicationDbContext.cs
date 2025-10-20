using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using salini.api.Application.Common.Interfaces;
using salini.api.Domain.Entities;

namespace salini.api.Infrastructure.Data;

public class ApplicationDbContext : IdentityDbContext<ApplicationUser>, IApplicationDbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    // Identity
    public new DbSet<ApplicationUser> Users { get; set; }

    // Master Data Tables
    public DbSet<Company> Companies { get; set; }
    public DbSet<CostCenter> CostCenters { get; set; }
    public DbSet<Nationality> Nationalities { get; set; }
    public DbSet<Project> Projects { get; set; }
    public DbSet<Department> Departments { get; set; }
    public DbSet<SubDepartment> SubDepartments { get; set; }
    public DbSet<EmployeeCategory> EmployeeCategories { get; set; }
    public DbSet<EmployeePosition> EmployeePositions { get; set; }
    public DbSet<ItemCategory> ItemCategories { get; set; }
    public DbSet<Item> Items { get; set; }

    // Employee and Asset Tables
    public DbSet<Employee> Employees { get; set; }
    public DbSet<Asset> Assets { get; set; }
    public DbSet<Accessory> Accessories { get; set; }
    public DbSet<EmployeeAsset> EmployeeAssets { get; set; }
    public DbSet<EmployeeAccessory> EmployeeAccessories { get; set; }

    // SIM Card Tables
    public DbSet<SimCard> SimCards { get; set; }
    public DbSet<SimProvider> SimProviders { get; set; }
    public DbSet<SimType> SimTypes { get; set; }
    public DbSet<SimCardPlan> SimCardPlans { get; set; }
    public DbSet<EmployeeSimCard> EmployeeSimCards { get; set; }

    // Software License Tables
    public DbSet<SoftwareLicense> SoftwareLicenses { get; set; }
    public DbSet<EmployeeSoftwareLicense> EmployeeSoftwareLicenses { get; set; }

    // Purchase Order Tables
    public DbSet<Supplier> Suppliers { get; set; }
    public DbSet<PurchaseOrder> PurchaseOrders { get; set; }
    public DbSet<PurchaseOrderItem> PurchaseOrderItems { get; set; }

    // User Management
    public DbSet<UserPermission> UserPermissions { get; set; }
    public DbSet<UserProject> UserProjects { get; set; }

    // Audit
    public DbSet<AuditLog> AuditLogs { get; set; }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // Configure entity relationships and constraints
        ConfigureMasterData(builder);
        ConfigureEmployeeAssets(builder);
        ConfigureSimCards(builder);
        ConfigureSoftwareLicenses(builder);
        ConfigurePurchaseOrders(builder);
        ConfigureUserManagement(builder);
        ConfigureAuditLog(builder);
        ConfigureGlobalSettings(builder);
    }

    private void ConfigureGlobalSettings(ModelBuilder builder)
    {
        // Configure all entities to use string IDs
        foreach (var entityType in builder.Model.GetEntityTypes())
        {
            if (entityType.ClrType.BaseType?.Name == "BaseEntity")
            {
                builder.Entity(entityType.ClrType)
                    .Property("Id")
                    .HasMaxLength(450);
            }
        }

        // Configure decimal precision globally
        foreach (var property in builder.Model.GetEntityTypes()
            .SelectMany(t => t.GetProperties())
            .Where(p => p.ClrType == typeof(decimal) || p.ClrType == typeof(decimal?)))
        {
            property.SetColumnType("decimal(18,2)");
        }

        // Configure DateTime properties
        foreach (var property in builder.Model.GetEntityTypes()
            .SelectMany(t => t.GetProperties())
            .Where(p => p.ClrType == typeof(DateTime) || p.ClrType == typeof(DateTime?)))
        {
            property.SetColumnType("timestamp with time zone");
        }
    }

    private void ConfigureMasterData(ModelBuilder builder)
    {
        // Company
        builder.Entity<Company>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            entity.HasIndex(e => e.Name).IsUnique();
        });

        // CostCenter
        builder.Entity<CostCenter>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            entity.HasIndex(e => e.Name).IsUnique();
        });

        // Nationality
        builder.Entity<Nationality>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            entity.HasIndex(e => e.Name).IsUnique();
        });

        // Project
        builder.Entity<Project>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Code).HasMaxLength(50);
            entity.HasIndex(e => e.Code).IsUnique();
            
            entity.HasOne(e => e.Company)
                .WithMany(c => c.Projects)
                .HasForeignKey(e => e.CompanyId)
                .OnDelete(DeleteBehavior.SetNull);
                
            entity.HasOne(e => e.CostCenter)
                .WithMany(cc => cc.Projects)
                .HasForeignKey(e => e.CostCenterId)
                .OnDelete(DeleteBehavior.SetNull);
                
            entity.HasOne(e => e.Nationality)
                .WithMany(n => n.Projects)
                .HasForeignKey(e => e.NationalityId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // Department
        builder.Entity<Department>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            entity.HasIndex(e => e.Name).IsUnique();
        });

        // SubDepartment
        builder.Entity<SubDepartment>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            
            entity.HasOne(e => e.Department)
                .WithMany(d => d.SubDepartments)
                .HasForeignKey(e => e.DepartmentId)
                .OnDelete(DeleteBehavior.Cascade);
                
            entity.HasIndex(e => new { e.DepartmentId, e.Name }).IsUnique();
        });

        // EmployeeCategory
        builder.Entity<EmployeeCategory>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            entity.HasIndex(e => e.Name).IsUnique();
        });

        // EmployeePosition
        builder.Entity<EmployeePosition>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            entity.HasIndex(e => e.Name).IsUnique();
        });

        // ItemCategory
        builder.Entity<ItemCategory>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            entity.HasIndex(e => e.Name).IsUnique();
        });

        // Item
        builder.Entity<Item>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            
            entity.HasOne(e => e.ItemCategory)
                .WithMany(ic => ic.Items)
                .HasForeignKey(e => e.ItemCategoryId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }

    private void ConfigureEmployeeAssets(ModelBuilder builder)
    {
        // Employee
        builder.Entity<Employee>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.EmployeeId).IsRequired().HasMaxLength(50);
            entity.Property(e => e.FirstName).IsRequired().HasMaxLength(100);
            entity.Property(e => e.LastName).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Email).HasMaxLength(256);
            entity.Property(e => e.Phone).HasMaxLength(20);
            entity.HasIndex(e => e.EmployeeId).IsUnique();
            entity.HasIndex(e => e.Email).IsUnique();

            // Foreign key relationships
            entity.HasOne(e => e.Nationality)
                .WithMany(n => n.Employees)
                .HasForeignKey(e => e.NationalityId)
                .OnDelete(DeleteBehavior.SetNull);
                
            entity.HasOne(e => e.EmployeeCategory)
                .WithMany(ec => ec.Employees)
                .HasForeignKey(e => e.EmployeeCategoryId)
                .OnDelete(DeleteBehavior.SetNull);
                
            entity.HasOne(e => e.EmployeePosition)
                .WithMany(ep => ep.Employees)
                .HasForeignKey(e => e.EmployeePositionId)
                .OnDelete(DeleteBehavior.SetNull);
                
            entity.HasOne(e => e.Department)
                .WithMany(d => d.Employees)
                .HasForeignKey(e => e.DepartmentId)
                .OnDelete(DeleteBehavior.SetNull);
                
            entity.HasOne(e => e.SubDepartment)
                .WithMany(sd => sd.Employees)
                .HasForeignKey(e => e.SubDepartmentId)
                .OnDelete(DeleteBehavior.SetNull);
                
            entity.HasOne(e => e.Project)
                .WithMany(p => p.Employees)
                .HasForeignKey(e => e.ProjectId)
                .OnDelete(DeleteBehavior.SetNull);
                
            entity.HasOne(e => e.Company)
                .WithMany(c => c.Employees)
                .HasForeignKey(e => e.CompanyId)
                .OnDelete(DeleteBehavior.SetNull);
                
            entity.HasOne(e => e.CostCenter)
                .WithMany(cc => cc.Employees)
                .HasForeignKey(e => e.CostCenterId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // Asset
        builder.Entity<Asset>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.AssetTag).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Description).HasMaxLength(1000);
            entity.Property(e => e.SerialNumber).HasMaxLength(100);
            entity.Property(e => e.Condition).HasMaxLength(50);
            entity.Property(e => e.PoNumber).HasMaxLength(100);
            entity.Property(e => e.Location).HasMaxLength(200);
            entity.Property(e => e.Notes).HasMaxLength(1000);
            entity.HasIndex(e => e.AssetTag).IsUnique();
            entity.HasIndex(e => e.SerialNumber).IsUnique();

            entity.HasOne(e => e.Item)
                .WithMany(i => i.Assets)
                .HasForeignKey(e => e.ItemId)
                .OnDelete(DeleteBehavior.SetNull);
                
            entity.HasOne(e => e.Project)
                .WithMany(p => p.Assets)
                .HasForeignKey(e => e.ProjectId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // Accessory
        builder.Entity<Accessory>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Description).HasMaxLength(1000);
            entity.HasIndex(e => e.Name).IsUnique();
        });

        // EmployeeAsset
        builder.Entity<EmployeeAsset>(entity =>
        {
            entity.HasKey(e => e.Id);
            
            entity.HasOne(e => e.Employee)
                .WithMany(emp => emp.EmployeeAssets)
                .HasForeignKey(e => e.EmployeeId)
                .OnDelete(DeleteBehavior.Cascade);
                
            entity.HasOne(e => e.Asset)
                .WithMany(a => a.EmployeeAssets)
                .HasForeignKey(e => e.AssetId)
                .OnDelete(DeleteBehavior.Cascade);
                
            entity.HasIndex(e => new { e.EmployeeId, e.AssetId, e.Status })
                .HasFilter("\"Status\" = 1"); // Only active assignments
                
            entity.HasIndex(e => e.AssetId);
            entity.HasIndex(e => e.EmployeeId);
            entity.HasIndex(e => e.AssignedDate);
        });

        // EmployeeAccessory
        builder.Entity<EmployeeAccessory>(entity =>
        {
            entity.HasKey(e => e.Id);
            
            entity.HasOne(e => e.Employee)
                .WithMany(emp => emp.EmployeeAccessories)
                .HasForeignKey(e => e.EmployeeId)
                .OnDelete(DeleteBehavior.Cascade);
                
            entity.HasOne(e => e.Accessory)
                .WithMany(a => a.EmployeeAccessories)
                .HasForeignKey(e => e.AccessoryId)
                .OnDelete(DeleteBehavior.Cascade);
                
            entity.HasIndex(e => new { e.EmployeeId, e.AccessoryId, e.Status })
                .HasFilter("\"Status\" = 1"); // Only active assignments
                
            entity.HasIndex(e => e.AccessoryId);
            entity.HasIndex(e => e.EmployeeId);
            entity.HasIndex(e => e.AssignedDate);
        });
    }

    private void ConfigureUserManagement(ModelBuilder builder)
    {
        // UserPermission
        builder.Entity<UserPermission>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Permission).IsRequired().HasMaxLength(100);
            
            entity.HasOne(e => e.User)
                .WithMany(u => u.UserPermissions)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
                
            entity.HasIndex(e => new { e.UserId, e.Permission }).IsUnique();
        });

        // UserProject
        builder.Entity<UserProject>(entity =>
        {
            entity.HasKey(e => e.Id);
            
            entity.HasOne(e => e.User)
                .WithMany(u => u.UserProjects)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
                
            entity.HasOne(e => e.Project)
                .WithMany(p => p.UserProjects)
                .HasForeignKey(e => e.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);
                
            entity.HasIndex(e => new { e.UserId, e.ProjectId }).IsUnique();
        });
    }

    private void ConfigureAuditLog(ModelBuilder builder)
    {
        builder.Entity<AuditLog>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.TableName).IsRequired().HasMaxLength(100);
            entity.Property(e => e.RecordId).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Action).IsRequired().HasMaxLength(20);
            entity.Property(e => e.OldValues).HasColumnType("jsonb");
            entity.Property(e => e.NewValues).HasColumnType("jsonb");
            
            entity.HasOne(e => e.User)
                .WithMany(u => u.AuditLogs)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.SetNull);
                
            entity.HasIndex(e => e.TableName);
            entity.HasIndex(e => e.RecordId);
            entity.HasIndex(e => e.CreatedAt);
        });
    }

    private void ConfigureSimCards(ModelBuilder builder)
    {
        // SimProvider
        builder.Entity<SimProvider>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            entity.HasIndex(e => e.Name).IsUnique();
        });

        // SimType
        builder.Entity<SimType>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            entity.HasIndex(e => e.Name).IsUnique();
        });

        // SimCardPlan
        builder.Entity<SimCardPlan>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            entity.Property(e => e.MonthlyFee).HasColumnType("decimal(18,2)");
            
            entity.HasOne(e => e.Provider)
                .WithMany(sp => sp.SimCardPlans)
                .HasForeignKey(e => e.ProviderId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // SimCard
        builder.Entity<SimCard>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.SimAccountNo).IsRequired().HasMaxLength(100);
            entity.Property(e => e.SimServiceNo).IsRequired().HasMaxLength(100);
            entity.Property(e => e.SimSerialNo).HasMaxLength(100);
            entity.HasIndex(e => new { e.SimAccountNo, e.SimServiceNo }).IsUnique();

            entity.HasOne(e => e.Project)
                .WithMany(p => p.SimCards)
                .HasForeignKey(e => e.ProjectId)
                .OnDelete(DeleteBehavior.SetNull);
                
            entity.HasOne(e => e.SimType)
                .WithMany(st => st.SimCards)
                .HasForeignKey(e => e.SimTypeId)
                .OnDelete(DeleteBehavior.SetNull);
                
            entity.HasOne(e => e.SimCardPlan)
                .WithMany(scp => scp.SimCards)
                .HasForeignKey(e => e.SimCardPlanId)
                .OnDelete(DeleteBehavior.SetNull);
                
            entity.HasOne(e => e.SimProvider)
                .WithMany(sp => sp.SimCards)
                .HasForeignKey(e => e.SimProviderId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // EmployeeSimCard
        builder.Entity<EmployeeSimCard>(entity =>
        {
            entity.HasKey(e => e.Id);
            
            entity.HasOne(e => e.Employee)
                .WithMany(emp => emp.EmployeeSimCards)
                .HasForeignKey(e => e.EmployeeId)
                .OnDelete(DeleteBehavior.Cascade);
                
            entity.HasOne(e => e.SimCard)
                .WithMany(sc => sc.EmployeeSimCards)
                .HasForeignKey(e => e.SimCardId)
                .OnDelete(DeleteBehavior.Cascade);
                
            entity.HasIndex(e => new { e.EmployeeId, e.SimCardId, e.Status })
                .HasFilter("\"Status\" = 1"); // Only active assignments
                
            entity.HasIndex(e => e.SimCardId);
            entity.HasIndex(e => e.EmployeeId);
            entity.HasIndex(e => e.AssignedDate);
        });
    }

    private void ConfigureSoftwareLicenses(ModelBuilder builder)
    {
        // SoftwareLicense
        builder.Entity<SoftwareLicense>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.SoftwareName).IsRequired().HasMaxLength(200);
            entity.Property(e => e.LicenseKey).HasMaxLength(500);
            entity.Property(e => e.LicenseType).HasMaxLength(100);
            entity.Property(e => e.Vendor).HasMaxLength(200);
            entity.Property(e => e.Cost).HasColumnType("decimal(18,2)");
            entity.Property(e => e.PoNumber).HasMaxLength(100);

            entity.HasOne(e => e.Project)
                .WithMany(p => p.SoftwareLicenses)
                .HasForeignKey(e => e.ProjectId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // EmployeeSoftwareLicense
        builder.Entity<EmployeeSoftwareLicense>(entity =>
        {
            entity.HasKey(e => e.Id);
            
            entity.HasOne(e => e.Employee)
                .WithMany(emp => emp.EmployeeSoftwareLicenses)
                .HasForeignKey(e => e.EmployeeId)
                .OnDelete(DeleteBehavior.Cascade);
                
            entity.HasOne(e => e.SoftwareLicense)
                .WithMany(sl => sl.EmployeeSoftwareLicenses)
                .HasForeignKey(e => e.SoftwareLicenseId)
                .OnDelete(DeleteBehavior.Cascade);
                
            entity.HasIndex(e => new { e.EmployeeId, e.SoftwareLicenseId, e.Status })
                .HasFilter("\"Status\" = 1"); // Only active assignments
                
            entity.HasIndex(e => e.SoftwareLicenseId);
            entity.HasIndex(e => e.EmployeeId);
            entity.HasIndex(e => e.AssignedDate);
        });
    }

    private void ConfigurePurchaseOrders(ModelBuilder builder)
    {
        // Supplier
        builder.Entity<Supplier>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            entity.Property(e => e.ContactPerson).HasMaxLength(200);
            entity.Property(e => e.Email).HasMaxLength(256);
            entity.Property(e => e.Phone).HasMaxLength(20);
            entity.Property(e => e.Address).HasMaxLength(500);
            entity.HasIndex(e => e.Name).IsUnique();
        });

        // PurchaseOrder
        builder.Entity<PurchaseOrder>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.PoNumber).IsRequired().HasMaxLength(100);
            entity.Property(e => e.PoDate).IsRequired();
            entity.Property(e => e.TotalAmount).HasColumnType("decimal(18,2)");
            entity.HasIndex(e => e.PoNumber).IsUnique();

            entity.HasOne(e => e.Project)
                .WithMany(p => p.PurchaseOrders)
                .HasForeignKey(e => e.ProjectId)
                .OnDelete(DeleteBehavior.SetNull);
                
            entity.HasOne(e => e.Supplier)
                .WithMany(s => s.PurchaseOrders)
                .HasForeignKey(e => e.SupplierId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // PurchaseOrderItem
        builder.Entity<PurchaseOrderItem>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.ItemId).IsRequired().HasMaxLength(450);
            entity.Property(e => e.Quantity).IsRequired();
            entity.Property(e => e.UnitPrice).IsRequired().HasColumnType("decimal(18,2)");
            
            entity.HasOne(e => e.PurchaseOrder)
                .WithMany(po => po.Items)
                .HasForeignKey(e => e.PurchaseOrderId)
                .OnDelete(DeleteBehavior.Cascade);
                
            entity.HasOne(e => e.Item)
                .WithMany()
                .HasForeignKey(e => e.ItemId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }
}
