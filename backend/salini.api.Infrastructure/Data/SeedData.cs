using Microsoft.AspNetCore.Identity;
using salini.api.Domain.Entities;
using salini.api.Domain.Enums;

namespace salini.api.Infrastructure.Data;

public static class SeedData
{
    public static async Task SeedAsync(ApplicationDbContext context, UserManager<ApplicationUser> userManager)
    {
        // Ensure database is created
        await context.Database.EnsureCreatedAsync();

        // Seed master data
       // await SeedMasterDataAsync(context);
        
        // Seed default users
        await SeedDefaultUsersAsync(userManager);
        
        // Save changes
        await context.SaveChangesAsync();
    }

    private static async Task SeedMasterDataAsync(ApplicationDbContext context)
    {
        // Seed Companies
        if (!context.Companies.Any())
        {
            var companies = new[]
            {
                new Company { Id = "COMP_001", Name = "Salini Construction", Description = "Main construction company", Status = Status.Active, CreatedAt = DateTime.UtcNow },
                new Company { Id = "COMP_002", Name = "Salini Engineering", Description = "Engineering division", Status = Status.Active, CreatedAt = DateTime.UtcNow }
            };
            await context.Companies.AddRangeAsync(companies);
        }

        // Seed Cost Centers
        if (!context.CostCenters.Any())
        {
            var costCenters = new[]
            {
                new CostCenter { Id = "CC_001", Code = "IT", Name = "IT Department", Description = "Information Technology", Status = Status.Active, CreatedAt = DateTime.UtcNow },
                new CostCenter { Id = "CC_002", Code = "OPS", Name = "Operations", Description = "Operations and Maintenance", Status = Status.Active, CreatedAt = DateTime.UtcNow },
                new CostCenter { Id = "CC_003", Code = "ADMIN", Name = "Administration", Description = "Administrative Functions", Status = Status.Active, CreatedAt = DateTime.UtcNow }
            };
            await context.CostCenters.AddRangeAsync(costCenters);
        }

        // Seed Nationalities
        if (!context.Nationalities.Any())
        {
            var nationalities = new[]
            {
                new Nationality { Id = "NAT_001", Name = "Saudi Arabian", Description = "Saudi Arabia", Status = Status.Active, CreatedAt = DateTime.UtcNow },
                new Nationality { Id = "NAT_002", Name = "Indian", Description = "India", Status = Status.Active, CreatedAt = DateTime.UtcNow },
                new Nationality { Id = "NAT_003", Name = "Pakistani", Description = "Pakistan", Status = Status.Active, CreatedAt = DateTime.UtcNow },
                new Nationality { Id = "NAT_004", Name = "Filipino", Description = "Philippines", Status = Status.Active, CreatedAt = DateTime.UtcNow },
                new Nationality { Id = "NAT_005", Name = "Egyptian", Description = "Egypt", Status = Status.Active, CreatedAt = DateTime.UtcNow }
            };
            await context.Nationalities.AddRangeAsync(nationalities);
        }

        // Seed Departments
        if (!context.Departments.Any())
        {
            var departments = new[]
            {
                new Department { Id = "DEPT_001", Name = "Information Technology", Description = "IT Department", Status = Status.Active, CreatedAt = DateTime.UtcNow },
                new Department { Id = "DEPT_002", Name = "Human Resources", Description = "HR Department", Status = Status.Active, CreatedAt = DateTime.UtcNow },
                new Department { Id = "DEPT_003", Name = "Finance", Description = "Finance Department", Status = Status.Active, CreatedAt = DateTime.UtcNow },
                new Department { Id = "DEPT_004", Name = "Operations", Description = "Operations Department", Status = Status.Active, CreatedAt = DateTime.UtcNow },
                new Department { Id = "DEPT_005", Name = "Procurement", Description = "Procurement Department", Status = Status.Active, CreatedAt = DateTime.UtcNow }
            };
            await context.Departments.AddRangeAsync(departments);
        }

        // Seed Sub Departments
        if (!context.SubDepartments.Any())
        {
            var subDepartments = new[]
            {
                new SubDepartment { Id = "SUBDEPT_001", Name = "Software Development", DepartmentId = "DEPT_001", Description = "Software Development Team", Status = Status.Active, CreatedAt = DateTime.UtcNow },
                new SubDepartment { Id = "SUBDEPT_002", Name = "Infrastructure", DepartmentId = "DEPT_001", Description = "IT Infrastructure Team", Status = Status.Active, CreatedAt = DateTime.UtcNow },
                new SubDepartment { Id = "SUBDEPT_003", Name = "Support", DepartmentId = "DEPT_001", Description = "IT Support Team", Status = Status.Active, CreatedAt = DateTime.UtcNow },
                new SubDepartment { Id = "SUBDEPT_004", Name = "Recruitment", DepartmentId = "DEPT_002", Description = "Recruitment Team", Status = Status.Active, CreatedAt = DateTime.UtcNow },
                new SubDepartment { Id = "SUBDEPT_005", Name = "Payroll", DepartmentId = "DEPT_002", Description = "Payroll Team", Status = Status.Active, CreatedAt = DateTime.UtcNow }
            };
            await context.SubDepartments.AddRangeAsync(subDepartments);
        }

        // Seed Employee Categories
        if (!context.EmployeeCategories.Any())
        {
            var employeeCategories = new[]
            {
                new EmployeeCategory { Id = "ECAT_001", Name = "Management", Description = "Management Level", Status = Status.Active, CreatedAt = DateTime.UtcNow },
                new EmployeeCategory { Id = "ECAT_002", Name = "Professional", Description = "Professional Level", Status = Status.Active, CreatedAt = DateTime.UtcNow },
                new EmployeeCategory { Id = "ECAT_003", Name = "Technical", Description = "Technical Level", Status = Status.Active, CreatedAt = DateTime.UtcNow },
                new EmployeeCategory { Id = "ECAT_004", Name = "Administrative", Description = "Administrative Level", Status = Status.Active, CreatedAt = DateTime.UtcNow },
                new EmployeeCategory { Id = "ECAT_005", Name = "Support", Description = "Support Level", Status = Status.Active, CreatedAt = DateTime.UtcNow }
            };
            await context.EmployeeCategories.AddRangeAsync(employeeCategories);
        }

        // Seed Employee Positions
        if (!context.EmployeePositions.Any())
        {
            var employeePositions = new[]
            {
                new EmployeePosition { Id = "EPOS_001", Name = "IT Manager", Description = "IT Department Manager", Status = Status.Active, CreatedAt = DateTime.UtcNow },
                new EmployeePosition { Id = "EPOS_002", Name = "Software Developer", Description = "Software Developer", Status = Status.Active, CreatedAt = DateTime.UtcNow },
                new EmployeePosition { Id = "EPOS_003", Name = "System Administrator", Description = "System Administrator", Status = Status.Active, CreatedAt = DateTime.UtcNow },
                new EmployeePosition { Id = "EPOS_004", Name = "HR Manager", Description = "Human Resources Manager", Status = Status.Active, CreatedAt = DateTime.UtcNow },
                new EmployeePosition { Id = "EPOS_005", Name = "Finance Manager", Description = "Finance Manager", Status = Status.Active, CreatedAt = DateTime.UtcNow }
            };
            await context.EmployeePositions.AddRangeAsync(employeePositions);
        }

        // Seed Item Categories
        if (!context.ItemCategories.Any())
        {
            var itemCategories = new[]
            {
                new ItemCategory { Id = "ICAT_001", Name = "Laptops", Description = "Laptop Computers", Status = Status.Active, CreatedAt = DateTime.UtcNow },
                new ItemCategory { Id = "ICAT_002", Name = "Desktops", Description = "Desktop Computers", Status = Status.Active, CreatedAt = DateTime.UtcNow },
                new ItemCategory { Id = "ICAT_003", Name = "Mobile Devices", Description = "Mobile Phones and Tablets", Status = Status.Active, CreatedAt = DateTime.UtcNow },
                new ItemCategory { Id = "ICAT_004", Name = "Network Equipment", Description = "Network Switches, Routers, etc.", Status = Status.Active, CreatedAt = DateTime.UtcNow },
                new ItemCategory { Id = "ICAT_005", Name = "Accessories", Description = "Computer Accessories", Status = Status.Active, CreatedAt = DateTime.UtcNow }
            };
            await context.ItemCategories.AddRangeAsync(itemCategories);
        }

        // Seed Items
        if (!context.Items.Any())
        {
            var items = new[]
            {
                new Item { Id = "ITEM_001", Name = "Dell Latitude 5520", Description = "Dell Latitude 5520 Laptop", ItemCategoryId = "ICAT_001", Status = Status.Active, CreatedAt = DateTime.UtcNow },
                new Item { Id = "ITEM_002", Name = "HP EliteBook 850", Description = "HP EliteBook 850 Laptop", ItemCategoryId = "ICAT_001", Status = Status.Active, CreatedAt = DateTime.UtcNow },
                new Item { Id = "ITEM_003", Name = "Dell OptiPlex 7090", Description = "Dell OptiPlex 7090 Desktop", ItemCategoryId = "ICAT_002", Status = Status.Active, CreatedAt = DateTime.UtcNow },
                new Item { Id = "ITEM_004", Name = "iPhone 14", Description = "Apple iPhone 14", ItemCategoryId = "ICAT_003", Status = Status.Active, CreatedAt = DateTime.UtcNow },
                new Item { Id = "ITEM_005", Name = "Cisco Catalyst 2960", Description = "Cisco Catalyst 2960 Switch", ItemCategoryId = "ICAT_004", Status = Status.Active, CreatedAt = DateTime.UtcNow }
            };
            await context.Items.AddRangeAsync(items);
        }

        // Seed Projects
        if (!context.Projects.Any())
        {
            var projects = new[]
            {
                new Project { Id = "PROJ_001", Code = "PROJ001", Name = "Head Office IT Infrastructure", Description = "IT Infrastructure for Head Office", Status = Status.Active, CompanyId = "COMP_001", CostCenterId = "CC_001", NationalityId = "NAT_001", CreatedAt = DateTime.UtcNow },
                new Project { Id = "PROJ_002", Code = "PROJ002", Name = "Construction Site Network", Description = "Network setup for construction sites", Status = Status.Active, CompanyId = "COMP_001", CostCenterId = "CC_002", NationalityId = "NAT_001", CreatedAt = DateTime.UtcNow },
                new Project { Id = "PROJ_003", Code = "PROJ003", Name = "Engineering Department", Description = "IT setup for Engineering Department", Status = Status.Active, CompanyId = "COMP_002", CostCenterId = "CC_001", NationalityId = "NAT_001", CreatedAt = DateTime.UtcNow }
            };
            await context.Projects.AddRangeAsync(projects);
        }

        // Seed Accessories
        if (!context.Accessories.Any())
        {
            var accessories = new[]
            {
                new Accessory { Id = "ACC_001", Name = "Mouse", Description = "Computer Mouse", Status = Status.Active, CreatedAt = DateTime.UtcNow },
                new Accessory { Id = "ACC_002", Name = "Keyboard", Description = "Computer Keyboard", Status = Status.Active, CreatedAt = DateTime.UtcNow },
                new Accessory { Id = "ACC_003", Name = "Monitor", Description = "Computer Monitor", Status = Status.Active, CreatedAt = DateTime.UtcNow },
                new Accessory { Id = "ACC_004", Name = "Headphones", Description = "Audio Headphones", Status = Status.Active, CreatedAt = DateTime.UtcNow },
                new Accessory { Id = "ACC_005", Name = "Webcam", Description = "USB Webcam", Status = Status.Active, CreatedAt = DateTime.UtcNow }
            };
            await context.Accessories.AddRangeAsync(accessories);
        }

        // Seed SIM Providers
        if (!context.SimProviders.Any())
        {
            var simProviders = new[]
            {
                new SimProvider { Id = "SP_001", Name = "STC", Description = "Saudi Telecom Company", ContactInfo = "www.stc.com.sa", IsActive = true, CreatedAt = DateTime.UtcNow },
                new SimProvider { Id = "SP_002", Name = "Mobily", Description = "Etihad Etisalat", ContactInfo = "www.mobily.com.sa", IsActive = true, CreatedAt = DateTime.UtcNow },
                new SimProvider { Id = "SP_003", Name = "Zain", Description = "Zain Saudi Arabia", ContactInfo = "www.sa.zain.com", IsActive = true, CreatedAt = DateTime.UtcNow }
            };
            await context.SimProviders.AddRangeAsync(simProviders);
        }

        // Seed SIM Types
        if (!context.SimTypes.Any())
        {
            var simTypes = new[]
            {
                new SimType { Id = "ST_001", Name = "Data SIM", Description = "Data-only SIM card", IsActive = true, CreatedAt = DateTime.UtcNow },
                new SimType { Id = "ST_002", Name = "Voice SIM", Description = "Voice and SMS SIM card", IsActive = true, CreatedAt = DateTime.UtcNow },
                new SimType { Id = "ST_003", Name = "IoT SIM", Description = "Internet of Things SIM card", IsActive = true, CreatedAt = DateTime.UtcNow }
            };
            await context.SimTypes.AddRangeAsync(simTypes);
        }

        // Seed SIM Card Plans
        if (!context.SimCardPlans.Any())
        {
            var simCardPlans = new[]
            {
                new SimCardPlan { Id = "SCP_001", Name = "STC Data 10GB", Description = "10GB Data Plan", DataLimit = "10GB", MonthlyFee = 100, ProviderId = "SP_001", IsActive = true, CreatedAt = DateTime.UtcNow },
                new SimCardPlan { Id = "SCP_002", Name = "Mobily Data 20GB", Description = "20GB Data Plan", DataLimit = "20GB", MonthlyFee = 150, ProviderId = "SP_002", IsActive = true, CreatedAt = DateTime.UtcNow },
                new SimCardPlan { Id = "SCP_003", Name = "Zain Voice Unlimited", Description = "Unlimited Voice Plan", DataLimit = "5GB", MonthlyFee = 200, ProviderId = "SP_003", IsActive = true, CreatedAt = DateTime.UtcNow }
            };
            await context.SimCardPlans.AddRangeAsync(simCardPlans);
        }

        // Seed Suppliers
        if (!context.Suppliers.Any())
        {
            var suppliers = new[]
            {
                new Supplier { Id = "SUP_001", Name = "Dell Technologies", ContactPerson = "John Smith", Email = "sales@dell.com", Phone = "+966-11-123-4567", Address = "Riyadh, Saudi Arabia", Status = Status.Active, CreatedAt = DateTime.UtcNow },
                new Supplier { Id = "SUP_002", Name = "HP Inc.", ContactPerson = "Sarah Johnson", Email = "sales@hp.com", Phone = "+966-11-234-5678", Address = "Jeddah, Saudi Arabia", Status = Status.Active, CreatedAt = DateTime.UtcNow },
                new Supplier { Id = "SUP_003", Name = "Cisco Systems", ContactPerson = "Ahmed Al-Rashid", Email = "sales@cisco.com", Phone = "+966-11-345-6789", Address = "Dammam, Saudi Arabia", Status = Status.Active, CreatedAt = DateTime.UtcNow }
            };
            await context.Suppliers.AddRangeAsync(suppliers);
        }
    }

    private static async Task SeedDefaultUsersAsync(UserManager<ApplicationUser> userManager)
    {
        // Create Super Admin user
        if (await userManager.FindByEmailAsync("admin@salini.com") == null)
        {
            var superAdmin = new ApplicationUser
            {
                UserName = "admin@salini.com",
                Email = "admin@salini.com",
                FirstName = "Super",
                LastName = "Admin",
                Department = "IT Department",
                Role = UserRole.SuperAdmin,
                IsActive = true,
                EmailConfirmed = true
            };

            var result = await userManager.CreateAsync(superAdmin, "Admin@123");
            if (result.Succeeded)
            {
                // Add all permissions for super admin
                var permissions = new[]
                {
                    UserPermissions.MasterDataRead, UserPermissions.MasterDataCreate, UserPermissions.MasterDataUpdate, UserPermissions.MasterDataDelete,
                    UserPermissions.EmployeesRead, UserPermissions.EmployeesCreate, UserPermissions.EmployeesUpdate, UserPermissions.EmployeesDelete, UserPermissions.EmployeesImport, UserPermissions.EmployeesExport,
                    UserPermissions.AssetsRead, UserPermissions.AssetsCreate, UserPermissions.AssetsUpdate, UserPermissions.AssetsDelete, UserPermissions.AssetsAssign, UserPermissions.AssetsUnassign,
                    UserPermissions.AccessoriesRead, UserPermissions.AccessoriesCreate, UserPermissions.AccessoriesUpdate, UserPermissions.AccessoriesDelete, UserPermissions.AccessoriesAssign, UserPermissions.AccessoriesUnassign,
                    UserPermissions.SimCardsRead, UserPermissions.SimCardsCreate, UserPermissions.SimCardsUpdate, UserPermissions.SimCardsDelete, UserPermissions.SimCardsAssign, UserPermissions.SimCardsUnassign,
                    UserPermissions.SoftwareLicensesRead, UserPermissions.SoftwareLicensesCreate, UserPermissions.SoftwareLicensesUpdate, UserPermissions.SoftwareLicensesDelete, UserPermissions.SoftwareLicensesAssign, UserPermissions.SoftwareLicensesUnassign,
                    UserPermissions.PurchaseOrdersRead, UserPermissions.PurchaseOrdersCreate, UserPermissions.PurchaseOrdersUpdate, UserPermissions.PurchaseOrdersDelete, UserPermissions.PurchaseOrdersApprove,
                    UserPermissions.ReportsRead, UserPermissions.ReportsGenerate, UserPermissions.ReportsExport,
                    UserPermissions.UsersRead, UserPermissions.UsersCreate, UserPermissions.UsersUpdate, UserPermissions.UsersDelete, UserPermissions.UsersAssignRoles, UserPermissions.UsersManagePermissions,
                    UserPermissions.SystemAdmin, UserPermissions.SystemAuditLogs, UserPermissions.SystemBackup, UserPermissions.SystemRestore
                };

                foreach (var permission in permissions)
                {
                    await userManager.AddClaimAsync(superAdmin, new System.Security.Claims.Claim("permission", permission));
                }
            }
        }

        // Create regular admin user
        if (await userManager.FindByEmailAsync("admin.user@salini.com") == null)
        {
            var admin = new ApplicationUser
            {
                UserName = "admin.user@salini.com",
                Email = "admin.user@salini.com",
                FirstName = "Admin",
                LastName = "User",
                Department = "IT Department",
                Role = UserRole.Admin,
                IsActive = true,
                EmailConfirmed = true
            };

            var result = await userManager.CreateAsync(admin, "Admin@123");
            if (result.Succeeded)
            {
                // Add admin permissions (excluding system admin)
                var permissions = new[]
                {
                    UserPermissions.MasterDataRead, UserPermissions.MasterDataCreate, UserPermissions.MasterDataUpdate, UserPermissions.MasterDataDelete,
                    UserPermissions.EmployeesRead, UserPermissions.EmployeesCreate, UserPermissions.EmployeesUpdate, UserPermissions.EmployeesDelete, UserPermissions.EmployeesImport, UserPermissions.EmployeesExport,
                    UserPermissions.AssetsRead, UserPermissions.AssetsCreate, UserPermissions.AssetsUpdate, UserPermissions.AssetsDelete, UserPermissions.AssetsAssign, UserPermissions.AssetsUnassign,
                    UserPermissions.AccessoriesRead, UserPermissions.AccessoriesCreate, UserPermissions.AccessoriesUpdate, UserPermissions.AccessoriesDelete, UserPermissions.AccessoriesAssign, UserPermissions.AccessoriesUnassign,
                    UserPermissions.SimCardsRead, UserPermissions.SimCardsCreate, UserPermissions.SimCardsUpdate, UserPermissions.SimCardsDelete, UserPermissions.SimCardsAssign, UserPermissions.SimCardsUnassign,
                    UserPermissions.SoftwareLicensesRead, UserPermissions.SoftwareLicensesCreate, UserPermissions.SoftwareLicensesUpdate, UserPermissions.SoftwareLicensesDelete, UserPermissions.SoftwareLicensesAssign, UserPermissions.SoftwareLicensesUnassign,
                    UserPermissions.PurchaseOrdersRead, UserPermissions.PurchaseOrdersCreate, UserPermissions.PurchaseOrdersUpdate, UserPermissions.PurchaseOrdersDelete, UserPermissions.PurchaseOrdersApprove,
                    UserPermissions.ReportsRead, UserPermissions.ReportsGenerate, UserPermissions.ReportsExport,
                    UserPermissions.UsersRead, UserPermissions.UsersCreate, UserPermissions.UsersUpdate, UserPermissions.UsersDelete, UserPermissions.UsersAssignRoles
                };

                foreach (var permission in permissions)
                {
                    await userManager.AddClaimAsync(admin, new System.Security.Claims.Claim("permission", permission));
                }
            }
        }

        // Create regular user
        if (await userManager.FindByEmailAsync("user@salini.com") == null)
        {
            var user = new ApplicationUser
            {
                UserName = "user@salini.com",
                Email = "user@salini.com",
                FirstName = "Regular",
                LastName = "User",
                Department = "IT Department",
                Role = UserRole.User,
                IsActive = true,
                EmailConfirmed = true
            };

            var result = await userManager.CreateAsync(user, "User@123");
            if (result.Succeeded)
            {
                // Add basic read permissions
                var permissions = new[]
                {
                    UserPermissions.MasterDataRead,
                    UserPermissions.EmployeesRead,
                    UserPermissions.AssetsRead,
                    UserPermissions.AccessoriesRead,
                    UserPermissions.SimCardsRead,
                    UserPermissions.SoftwareLicensesRead,
                    UserPermissions.PurchaseOrdersRead,
                    UserPermissions.ReportsRead
                };

                foreach (var permission in permissions)
                {
                    await userManager.AddClaimAsync(user, new System.Security.Claims.Claim("permission", permission));
                }
            }
        }
    }
}
