# Salini AMS Backend API

ASP.NET Core 8.0 Web API for the IT Asset Management System using Clean Architecture.

## Architecture

This project follows Clean Architecture principles with the following layers:

- **salini.api.API** - Web API layer (Controllers, Middleware, Configuration)
- **salini.api.Application** - Application layer (Services, DTOs, Validators, Commands/Queries)
- **salini.api.Domain** - Domain layer (Entities, Enums, Interfaces)
- **salini.api.Infrastructure** - Infrastructure layer (Data Access, Repositories, External Services)
- **salini.api.Shared** - Shared layer (DTOs, Constants, Extensions)

## Technology Stack

- **.NET 8.0** - Framework
- **ASP.NET Core Web API** - Web framework
- **Entity Framework Core 8.0** - ORM
- **PostgreSQL** - Database
- **ASP.NET Core Identity** - Authentication & Authorization
- **JWT Bearer Tokens** - Token-based authentication
- **AutoMapper** - Object mapping
- **FluentValidation** - Input validation
- **MediatR** - CQRS pattern (optional)
- **Serilog** - Logging
- **Swagger/OpenAPI** - API documentation

## Getting Started

### Prerequisites

- .NET 8.0 SDK
- PostgreSQL 15+
- Visual Studio 2022 or VS Code

### Database Setup

1. **Install PostgreSQL** and ensure it's running
2. **Set up the database**:
   ```bash
   # Option 1: Use the setup script (recommended)
   .\setup-database.ps1
   
   # Option 2: Manual setup
   dotnet ef database update --project salini.api.Infrastructure --startup-project salini.api.API
   ```
3. **Update connection strings** in `appsettings.json` and `appsettings.Development.json` if needed

See [DATABASE_SETUP.md](DATABASE_SETUP.md) for detailed setup instructions.

### Default Users
- **Super Admin**: admin@salini.com / Admin@123
- **Admin User**: admin.user@salini.com / Admin@123  
- **Regular User**: user@salini.com / User@123

### Running the Application

1. Navigate to the backend directory:
```bash
cd backend
```

2. Restore packages:
```bash
dotnet restore
```

3. Build the solution:
```bash
dotnet build
```

4. Run the API:
```bash
dotnet run --project salini.api.API
```

The API will be available at:
- HTTP: `http://localhost:5000`
- HTTPS: `https://localhost:5001`
- Swagger UI: `http://localhost:5000` (in development)

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout

### Test
- `GET /api/test` - Public test endpoint
- `GET /api/test/auth` - Authenticated test endpoint

### Health Check
- `GET /health` - Application health status

## Configuration

### JWT Settings
```json
{
  "JwtSettings": {
    "Secret": "YourSuperSecretKeyThatIsAtLeast32CharactersLong!",
    "Issuer": "SaliniAMS.API",
    "Audience": "SaliniAMS.Client",
    "ExpiryMinutes": 60
  }
}
```

### CORS Settings
```json
{
  "Cors": {
    "AllowedOrigins": [
      "http://localhost:3000",
      "https://localhost:3000"
    ]
  }
}
```

## Database Schema

The application includes the following main entities:

### Master Data
- **Companies** - Company information and organization
- **Cost Centers** - Financial cost center tracking
- **Nationalities** - Employee nationality reference data
- **Projects** - Project management and organization
- **Departments** - Organizational department structure
- **Sub Departments** - Sub-department hierarchy
- **Employee Categories** - Employee classification
- **Employee Positions** - Job position definitions
- **Item Categories** - Asset item categorization
- **Items** - Asset item definitions

### Core Entities
- **Employees** - Employee information and assignments
- **Assets** - IT assets with tracking and assignment
- **Accessories** - Asset accessories and peripherals
- **SIM Cards** - Mobile SIM card management
- **Software Licenses** - Software license tracking
- **Purchase Orders** - Procurement and purchasing

### SIM Card Management
- **SimProviders** - SIM card service providers
- **SimTypes** - SIM card type definitions
- **SimCardPlans** - Data and service plans
- **SimCards** - Individual SIM card instances

### Purchase Management
- **Suppliers** - Vendor and supplier information
- **PurchaseOrders** - Purchase order management
- **PurchaseOrderItems** - Individual line items

### Assignment Entities
- **EmployeeAssets** - Asset assignment tracking
- **EmployeeAccessories** - Accessory assignment tracking
- **EmployeeSimCards** - SIM card assignment tracking
- **EmployeeSoftwareLicenses** - Software license assignment tracking

### User Management
- **ApplicationUsers** - ASP.NET Identity users
- **UserPermissions** - Granular permission system
- **UserProjects** - Project access control
- **AuditLogs** - Complete audit trail

## Domain Layer Features

### Value Objects
- **Email** - Type-safe email validation
- **PhoneNumber** - International phone number handling
- **Money** - Currency-aware monetary values

### Domain Events
- **AssetAssignedEvent** - Asset assignment notifications
- **AssetReturnedEvent** - Asset return notifications
- **IDomainEvent** - Base domain event interface

### Specifications
- **EmployeeSpecifications** - Employee query specifications
- **AssetSpecifications** - Asset query specifications
- **BaseSpecification** - Generic specification pattern

### Domain Exceptions
- **DomainException** - Base domain exception
- **ValidationException** - Business rule violations
- **NotFoundException** - Entity not found errors
- **DuplicateException** - Duplicate entity errors

### Constants & Enums
- **SystemConstants** - Application-wide constants
- **ValidationMessages** - Standardized error messages
- **Status Enums** - Entity status definitions
- **UserRole** - Role-based access control
- **UserPermissions** - Granular permission system

## Development

### Adding New Entities

1. Create entity in `salini.api.Domain/Entities/`
2. Add DbSet to `ApplicationDbContext`
3. Configure relationships in `OnModelCreating`
4. Create migration: `dotnet ef migrations add <MigrationName> --project salini.api.Infrastructure --startup-project salini.api.API`
5. Update database: `dotnet ef database update --project salini.api.Infrastructure --startup-project salini.api.API`

### Adding New Controllers

1. Create controller in `salini.api.API/Controllers/`
2. Add authorization attributes as needed
3. Implement CRUD operations
4. Add to Swagger documentation

## Security

- JWT Bearer token authentication
- Role-based authorization
- Permission-based authorization
- CORS configured for frontend
- Input validation with FluentValidation
- SQL injection protection via EF Core

## Logging

- Serilog configured for structured logging
- Console and file logging enabled
- Logs written to `logs/` directory
- Request/response logging middleware

## Next Steps

This completes **Phase 1.1: Project Setup**. The next phases will include:

1. **Phase 1.2**: Domain Layer - Complete entity definitions
2. **Phase 1.3**: Database Migration - Convert Supabase schema to EF Core
3. **Phase 1.4**: Authentication & Authorization - Complete user management
4. **Phase 2**: Application Layer - Services and business logic
5. **Phase 3**: Infrastructure Layer - Repositories and data access
6. **Phase 4**: API Layer - Complete REST API controllers
7. **Phase 5**: Frontend Updates - Update Next.js to call new API

## Troubleshooting

### Common Issues

1. **Database Connection**: Ensure PostgreSQL is running and connection string is correct
2. **JWT Secret**: Make sure JWT secret is at least 32 characters long
3. **CORS**: Verify allowed origins match your frontend URL
4. **Port Conflicts**: Change ports in `launchSettings.json` if needed

### Logs

Check the `logs/` directory for detailed application logs.
