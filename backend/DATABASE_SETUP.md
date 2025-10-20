# Database Setup Guide

This guide explains how to set up the PostgreSQL database for the Salini AMS backend.

## Prerequisites

1. **PostgreSQL 12+** installed and running
2. **.NET 8.0 SDK** installed
3. **Entity Framework Core Tools** installed globally:
   ```bash
   dotnet tool install --global dotnet-ef
   ```

## Database Configuration

### Connection String

The default connection string is configured in `appsettings.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=salini_ams_db;Username=postgres;Password=your_password"
  }
}
```

### Environment Variables

You can override the connection string using environment variables:

```bash
# Windows
set ConnectionStrings__DefaultConnection="Host=localhost;Port=5432;Database=salini_ams_db;Username=postgres;Password=your_password"

# Linux/Mac
export ConnectionStrings__DefaultConnection="Host=localhost;Port=5432;Database=salini_ams_db;Username=postgres;Password=your_password"
```

## Database Setup Steps

### Option 1: Using the Setup Script (Recommended)

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Run the setup script:
   ```powershell
   .\setup-database.ps1
   ```

   Or with custom connection string:
   ```powershell
   .\setup-database.ps1 -ConnectionString "Host=localhost;Port=5432;Database=salini_ams_db;Username=postgres;Password=your_password"
   ```

### Option 2: Manual Setup

1. Create the database (if it doesn't exist):
   ```sql
   CREATE DATABASE salini_ams_db;
   ```

2. Run the migration:
   ```bash
   cd backend
   dotnet ef database update --project salini.api.Infrastructure --startup-project salini.api.API
   ```

## Database Schema

The database includes the following main tables:

### Core Tables
- **AspNetUsers** - User accounts (extends Identity)
- **AspNetRoles** - User roles
- **Companies** - Company information
- **CostCenters** - Cost center definitions
- **Nationalities** - Nationality lookup
- **Departments** - Department definitions
- **SubDepartments** - Sub-department definitions
- **Projects** - Project information

### Employee Management
- **Employees** - Employee records
- **EmployeeCategories** - Employee category lookup
- **EmployeePositions** - Employee position lookup
- **EmployeeAssets** - Asset assignments to employees
- **EmployeeAccessories** - Accessory assignments to employees
- **EmployeeSimCards** - SIM card assignments to employees
- **EmployeeSoftwareLicenses** - Software license assignments to employees

### Asset Management
- **Assets** - Asset inventory
- **Items** - Item catalog
- **ItemCategories** - Item category lookup
- **Accessories** - Accessory inventory
- **Suppliers** - Supplier information

### SIM Card Management
- **SimCards** - SIM card inventory
- **SimCardPlans** - SIM card plan definitions
- **SimProviders** - SIM provider information
- **SimTypes** - SIM type lookup

### Software License Management
- **SoftwareLicenses** - Software license inventory

### Purchase Orders
- **PurchaseOrders** - Purchase order records
- **PurchaseOrderItems** - Purchase order line items

### System Tables
- **AuditLogs** - System audit trail
- **UserPermissions** - User permission assignments
- **UserProjects** - User-project associations

## Seeded Data

The database is automatically seeded with:

### Master Data
- 2 Companies (Salini Construction, Salini Engineering)
- 3 Cost Centers (IT Department, Operations, Administration)
- 5 Nationalities (Saudi Arabian, Indian, Pakistani, Filipino, Egyptian)
- 5 Departments (IT, HR, Finance, Operations, Procurement)
- 5 Sub-departments (Software Development, Infrastructure, Support, Recruitment, Payroll)
- 5 Employee Categories (Management, Professional, Technical, Administrative, Support)
- 5 Employee Positions (IT Manager, Software Developer, System Administrator, HR Manager, Finance Manager)
- 5 Item Categories (Laptops, Desktops, Mobile Devices, Network Equipment, Accessories)
- 5 Sample Items (Dell Latitude 5520, HP EliteBook 850, etc.)
- 3 Projects (Head Office IT Infrastructure, Construction Site Network, Engineering Department)
- 3 SIM Providers (STC, Mobily, Zain)
- 3 SIM Types (Data SIM, Voice SIM, IoT SIM)
- 3 SIM Card Plans (STC Data 10GB, Mobily Data 20GB, Zain Voice Unlimited)
- 3 Suppliers (Dell Technologies, HP Inc., Cisco Systems)

### Default Users
- **Super Admin** (admin@salini.com / Admin@123) - Full system access
- **Admin User** (admin.user@salini.com / Admin@123) - Administrative access
- **Regular User** (user@salini.com / User@123) - Basic read access

## Migration Commands

### Create a new migration
```bash
dotnet ef migrations add MigrationName --project salini.api.Infrastructure --startup-project salini.api.API
```

### Update database
```bash
dotnet ef database update --project salini.api.Infrastructure --startup-project salini.api.API
```

### Remove last migration
```bash
dotnet ef migrations remove --project salini.api.Infrastructure --startup-project salini.api.API
```

### Generate SQL script
```bash
dotnet ef migrations script --project salini.api.Infrastructure --startup-project salini.api.API
```

## Troubleshooting

### Common Issues

1. **Connection refused**
   - Ensure PostgreSQL is running
   - Check the connection string
   - Verify firewall settings

2. **Authentication failed**
   - Check username and password
   - Ensure the user has sufficient permissions

3. **Database does not exist**
   - Create the database manually or let EF create it
   - Check database name in connection string

4. **Migration errors**
   - Check for syntax errors in entity models
   - Ensure all required packages are installed
   - Verify database permissions

### Reset Database

To completely reset the database:

1. Drop the database:
   ```sql
   DROP DATABASE salini_ams_db;
   ```

2. Recreate and migrate:
   ```bash
   dotnet ef database update --project salini.api.Infrastructure --startup-project salini.api.API
   ```

## Security Considerations

1. **Change default passwords** for all seeded users
2. **Use strong connection strings** in production
3. **Enable SSL** for database connections in production
4. **Regular backups** of the database
5. **Monitor audit logs** for security events

## Production Deployment

For production deployment:

1. Use environment variables for connection strings
2. Enable SSL/TLS for database connections
3. Use managed database services (Azure Database for PostgreSQL, AWS RDS, etc.)
4. Implement proper backup and recovery procedures
5. Monitor database performance and security
