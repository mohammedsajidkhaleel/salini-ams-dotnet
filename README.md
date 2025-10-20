# Salini AMS - IT Asset Management System

A comprehensive IT Asset Management System built with modern technologies.

## Project Structure

This project follows a clean separation between frontend and backend:

```
salini-ams-dotnet/
├── backend/           # ASP.NET Core 8.0 Web API
├── client/            # Next.js 15 Frontend Application
├── docs/              # Project documentation
├── scripts/           # Database and utility scripts
└── supabase/          # Supabase migrations (legacy)
```

## Quick Start

### Backend API

```bash
cd backend
dotnet restore
dotnet build
dotnet run --project salini.api.API
```

The API will be available at:
- HTTP: http://localhost:5000
- HTTPS: https://localhost:5001
- Swagger: http://localhost:5000

### Frontend Client

```bash
cd client
npm install
npm run dev
```

The application will be available at:
- http://localhost:3000

## Technology Stack

### Backend
- **.NET 8.0** - Framework
- **ASP.NET Core Web API** - Web framework
- **Entity Framework Core 8.0** - ORM
- **PostgreSQL** - Database
- **ASP.NET Core Identity** - Authentication
- **JWT Bearer Tokens** - Token authentication
- **AutoMapper** - Object mapping
- **FluentValidation** - Input validation
- **MediatR** - CQRS pattern
- **Serilog** - Logging
- **Swagger/OpenAPI** - API documentation

### Frontend
- **Next.js 15** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Shadcn/ui** - UI components
- **React Hook Form** - Form management
- **Zod** - Schema validation
- **Sonner** - Toast notifications

## Architecture

### Backend - Clean Architecture
- **API Layer** - Controllers, middleware, filters
- **Application Layer** - Services, DTOs, commands/queries
- **Domain Layer** - Entities, value objects, domain logic
- **Infrastructure Layer** - Data access, repositories, external services
- **Shared Layer** - Common utilities and constants

### Frontend - Feature-Based
- **Pages** - Next.js app router pages
- **Components** - Reusable UI components
- **Services** - API client and service layer
- **Contexts** - React context providers
- **Hooks** - Custom React hooks
- **Lib** - Utilities and helpers

## Features

- ✅ Employee Management
- ✅ Asset Tracking & Assignment
- ✅ SIM Card Management
- ✅ Software License Tracking
- ✅ Purchase Order Management
- ✅ Comprehensive Reporting
- ✅ User Management & Permissions
- ✅ Role-Based Access Control
- ✅ Audit Logging
- ✅ CSV Import/Export
- ✅ Real-time Notifications

## Getting Started

### Prerequisites

- **.NET 8.0 SDK** - [Download](https://dotnet.microsoft.com/download/dotnet/8.0)
- **Node.js 18+** - [Download](https://nodejs.org/)
- **PostgreSQL 15+** - [Download](https://www.postgresql.org/download/)

### Database Setup

1. Install PostgreSQL and ensure it's running
2. Navigate to the backend directory:
   ```bash
   cd backend
   ```
3. Run the database setup script:
   ```bash
   .\setup-database.ps1
   ```

### Configuration

#### Backend
Edit `backend/salini.api.API/appsettings.json`:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Database=salini_ams;Username=postgres;Password=your_password"
  },
  "JwtSettings": {
    "Secret": "YourSuperSecretKeyThatIsAtLeast32CharactersLong!",
    "Issuer": "SaliniAMS.API",
    "Audience": "SaliniAMS.Client",
    "ExpiryMinutes": 60
  }
}
```

#### Frontend
The frontend is configured to connect to the backend API at `http://localhost:5000` by default. This can be changed in `client/lib/config.ts`.

### Default Users

After database setup, you can use these credentials:

- **Super Admin**: admin@salini.com / Admin@123
- **Admin User**: admin.user@salini.com / Admin@123
- **Regular User**: user@salini.com / User@123

## Development

### Backend Development

```bash
cd backend

# Build the solution
dotnet build

# Run the API
dotnet run --project salini.api.API

# Run tests
dotnet test

# Create a new migration
dotnet ef migrations add MigrationName --project salini.api.Infrastructure --startup-project salini.api.API

# Update database
dotnet ef database update --project salini.api.Infrastructure --startup-project salini.api.API
```

### Frontend Development

```bash
cd client

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## API Documentation

Once the backend is running, visit:
- Swagger UI: http://localhost:5000

The Swagger UI provides:
- Complete API endpoint documentation
- Interactive API testing
- Request/response schemas
- Authentication testing

## Documentation

Detailed documentation is available in the `docs/` directory:

- [Development Guidelines](docs/DEVELOPMENT_GUIDELINES.md)
- [Technical Documentation](docs/TECHNICAL_DOCUMENTATION.md)
- [Database Setup](docs/DATABASE_SETUP.md)
- [Migration Guide](docs/MIGRATION_GUIDE.md)

## Project Status

- ✅ Phase 1: Project Setup & Domain Layer
- ✅ Phase 2: Application Layer - Services & Business Logic
- ✅ Phase 3: Infrastructure Layer - Data Access & Repositories
- ✅ Phase 4: API Layer - REST API Controllers
- ✅ Phase 5: Frontend Migration - Supabase to Custom API
- ✅ Phase 6: Performance Optimization & Error Handling
- ✅ Phase 7: UI/UX Enhancements & Documentation

## Recent Updates

### ✅ Complete Supabase Migration (Phase 5)
- **Removed all Supabase dependencies** from the frontend
- **Migrated to custom API architecture** with full CRUD operations
- **Implemented project-based filtering** at the API level
- **Enhanced authentication** with JWT tokens and role-based access control
- **Added comprehensive error handling** with user-friendly messages

### ✅ Performance & Quality Improvements (Phase 6)
- **Implemented intelligent caching** with TTL and invalidation strategies
- **Added performance monitoring** and optimization utilities
- **Enhanced error handling** with structured logging and error boundaries
- **Fixed TypeScript errors** and improved type safety
- **Added React hooks** for optimized data fetching and error handling

### ✅ UI/UX Enhancements (Phase 7)
- **Enhanced loading states** with multiple spinner variants and skeleton components
- **Improved toast notifications** with better styling and actions
- **Added animation utilities** and progress indicators
- **Created reusable UI components** for better consistency
- **Implemented responsive design** improvements

## Contributing

1. Follow the coding standards in `docs/DEVELOPMENT_GUIDELINES.md`
2. Create feature branches from `main`
3. Write meaningful commit messages
4. Test thoroughly before submitting PRs

## License

Proprietary - Salini Construction

## Support

For issues or questions, contact the development team at dev@salini.com