# IT Asset Management System - Technical Documentation

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [Database Schema](#database-schema)
5. [Core Features](#core-features)
6. [Security & Authentication](#security--authentication)
7. [API Services](#api-services)
8. [Frontend Components](#frontend-components)
9. [Deployment](#deployment)
10. [Development Setup](#development-setup)
11. [Database Migrations](#database-migrations)
12. [User Management](#user-management)
13. [Audit & Logging](#audit--logging)
14. [Performance Considerations](#performance-considerations)
15. [Troubleshooting](#troubleshooting)

## Overview

The IT Asset Management System is a comprehensive web application built with Next.js 15 and Supabase, designed to manage IT assets, employees, purchase orders, SIM cards, and software licenses within an organization. The system provides role-based access control, project-based data filtering, and comprehensive audit trails.

### Key Capabilities
- **Asset Management**: Track IT assets with assignment capabilities
- **Employee Management**: Manage employee information and asset assignments
- **Purchase Order Management**: Handle procurement workflows
- **SIM Card Management**: Track mobile device SIM cards and plans
- **Software License Management**: Manage software licenses and assignments
- **Master Data Management**: Centralized management of reference data
- **Reporting & Analytics**: Generate reports and view system statistics
- **User Management**: Role-based access control with project-level permissions

## Architecture

### System Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (Next.js)     │◄──►│   (Supabase)    │◄──►│   (PostgreSQL)  │
│                 │    │                 │    │                 │
│ • React 18      │    │ • Auth          │    │ • Tables        │
│ • TypeScript    │    │ • API           │    │ • RLS Policies  │
│ • Tailwind CSS  │    │ • Real-time     │    │ • Functions     │
│ • Radix UI      │    │ • Storage       │    │ • Triggers      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Application Structure
```
app/
├── (pages)/
│   ├── assets/           # Asset management
│   ├── employees/        # Employee management
│   ├── inventory/        # Inventory overview
│   ├── purchase-orders/  # Purchase order management
│   ├── sim-cards/        # SIM card management
│   ├── software-licenses/# Software license management
│   ├── reports/          # Reporting module
│   ├── user-management/  # User administration
│   └── master-data/      # Master data management
├── login/                # Authentication
├── layout.tsx            # Root layout
└── page.tsx              # Dashboard

components/
├── ui/                   # Reusable UI components
├── *-table.tsx          # Data table components
├── *-form.tsx           # Form components
├── *-modal.tsx          # Modal components
└── sidebar.tsx          # Navigation

lib/
├── supabaseClient.ts    # Database client
├── types.ts             # TypeScript interfaces
├── userService.ts       # User management service
├── masterDataService.ts # Master data service
└── utils.ts             # Utility functions
```

## Technology Stack

### Frontend
- **Framework**: Next.js 15.1.3 (App Router)
- **Language**: TypeScript 5.7.2
- **UI Library**: React 18.3.1
- **Styling**: Tailwind CSS 4.1.9
- **UI Components**: Radix UI primitives
- **Icons**: Lucide React
- **Forms**: React Hook Form with Zod validation
- **Charts**: Recharts
- **Theme**: Next Themes (dark/light mode support)

### Backend & Database
- **Backend**: Supabase (PostgreSQL 15)
- **Authentication**: Supabase Auth
- **Real-time**: Supabase Realtime
- **Storage**: Supabase Storage
- **API**: Supabase REST API with Row Level Security

### Development Tools
- **Package Manager**: npm/pnpm
- **Linting**: ESLint
- **Type Checking**: TypeScript
- **Database CLI**: Supabase CLI
- **Deployment**: Vercel

## Database Schema

### Core Tables

#### Master Data Tables
- `projects` - Project definitions
- `companies` - Company information
- `cost_centers` - Cost center definitions
- `nationalities` - Nationality reference data
- `departments` - Department structure
- `sub_departments` - Sub-department hierarchy
- `employee_categories` - Employee classification
- `employee_positions` - Job positions
- `item_categories` - Asset item categories
- `items` - Asset item definitions
- `vendors` - Vendor information
- `asset_models` - Asset model definitions

#### SIM Card Management
- `sim_providers` - SIM card providers
- `sim_types` - SIM card types
- `sim_card_plans` - Data plans
- `sim_cards` - Individual SIM cards

#### Main Entity Tables
- `employees` - Employee information
- `assets` - IT assets
- `accessories` - Asset accessories
- `software_licenses` - Software licenses
- `purchase_orders` - Purchase orders
- `purchase_order_items` - PO line items
- `suppliers` - Supplier information

#### Assignment Tables
- `employee_assets` - Asset assignments
- `employee_accessories` - Accessory assignments
- `employee_sim_cards` - SIM card assignments
- `employee_software_licenses` - License assignments

#### User Management
- `user_profiles` - Extended user profiles
- `user_permissions` - User permissions
- `user_projects` - Project assignments
- `user_roles` - Role definitions
- `user_role_assignments` - Role assignments

#### Audit & Logging
- `audit_log` - System audit trail

### Key Relationships
```sql
-- Employee to Project relationship
employees.project_id → projects.id

-- Asset assignment relationships
employee_assets.employee_id → employees.id
employee_assets.asset_id → assets.id

-- Master data relationships
employees.department_id → departments.id
employees.sub_department_id → sub_departments.id
sub_departments.department_id → departments.id

-- User management relationships
user_profiles.id → auth.users.id
user_permissions.user_id → user_profiles.id
user_projects.user_id → user_profiles.id
```

## Core Features

### 1. Asset Management
- **Asset Registration**: Create and register new IT assets
- **Asset Assignment**: Assign assets to employees
- **Asset Tracking**: Track asset status (available, assigned, maintenance, retired)
- **Asset History**: View assignment history and changes
- **Bulk Operations**: Import/export asset data

### 2. Employee Management
- **Employee Profiles**: Comprehensive employee information
- **Department Assignment**: Link employees to departments and projects
- **Asset Assignments**: View all assets assigned to an employee
- **Bulk Import**: Import employee data from CSV files
- **Employee Reports**: Generate employee asset reports

### 3. Purchase Order Management
- **PO Creation**: Create purchase orders with line items
- **Approval Workflow**: Multi-stage approval process
- **Supplier Management**: Manage supplier information
- **Status Tracking**: Track PO status from draft to received
- **Cost Tracking**: Monitor purchase costs and budgets

### 4. SIM Card Management
- **SIM Registration**: Register SIM cards with provider information
- **Plan Management**: Manage data plans and billing
- **Assignment Tracking**: Track SIM card assignments to employees
- **Usage Monitoring**: Monitor data usage and plan limits
- **Provider Management**: Manage SIM card providers

### 5. Software License Management
- **License Registration**: Register software licenses
- **Seat Management**: Track available and used seats
- **Assignment Tracking**: Assign licenses to employees
- **Expiry Monitoring**: Track license expiration dates
- **Cost Tracking**: Monitor license costs and renewals

### 6. Master Data Management
- **Centralized Configuration**: Manage all reference data
- **Hierarchical Data**: Support for department hierarchies
- **Bulk Operations**: Bulk create/update master data
- **Data Validation**: Ensure data consistency
- **Import/Export**: CSV import/export capabilities

### 7. Reporting & Analytics
- **Dashboard Statistics**: Key metrics and KPIs
- **Asset Reports**: Asset utilization and status reports
- **Employee Reports**: Employee asset assignments
- **Cost Reports**: Purchase and license cost analysis
- **Audit Reports**: System activity and change logs

## Security & Authentication

### Authentication System
- **Supabase Auth**: Email/password authentication
- **Session Management**: Persistent sessions with auto-refresh
- **Password Security**: Secure password handling
- **User Registration**: Controlled user registration process

### Authorization & Access Control
- **Role-Based Access Control (RBAC)**: Hierarchical role system
- **Permission-Based Access**: Granular permission system
- **Project-Based Filtering**: Data access limited by project assignments
- **Row Level Security (RLS)**: Database-level access control

### User Roles
1. **Super Administrator**: Full system access
2. **Administrator**: Most permissions except system admin
3. **Manager**: Management access with read/write permissions
4. **Standard User**: Basic read-only access

### Permissions System
```typescript
// Available permissions
const permissions = [
  'master_data:read', 'master_data:create', 'master_data:update', 'master_data:delete',
  'employees:read', 'employees:create', 'employees:update', 'employees:delete',
  'assets:read', 'assets:create', 'assets:update', 'assets:delete', 'assets:assign',
  'purchase_orders:read', 'purchase_orders:create', 'purchase_orders:update',
  'reports:read', 'reports:generate', 'reports:export',
  'users:read', 'users:create', 'users:update', 'users:delete',
  'system:admin', 'system:audit_logs'
]
```

### Security Features
- **HTTPS Only**: All communications encrypted
- **CORS Protection**: Configured CORS policies
- **Input Validation**: Zod schema validation
- **SQL Injection Protection**: Parameterized queries
- **XSS Protection**: React's built-in XSS protection
- **CSRF Protection**: SameSite cookie attributes

## API Services

### Service Layer Architecture
The application uses a service-oriented architecture with dedicated service classes:

#### UserService
```typescript
class UserService {
  static async getAllUsers(): Promise<UserProfile[]>
  static async getUserById(userId: string): Promise<UserProfile | null>
  static async createUser(userData: CreateUserData): Promise<UserProfile>
  static async updateUser(userId: string, userData: UpdateUserData): Promise<UserProfile>
  static async deleteUser(userId: string): Promise<void>
  static async getUserPermissions(userId: string): Promise<string[]>
  static async getUserProjects(userId: string): Promise<string[]>
}
```

#### MasterDataService
```typescript
class MasterDataService {
  static async bulkCreateDepartments(departments: string[]): Promise<BulkMasterDataResult>
  static async bulkCreateSubDepartments(subDepartments: Array<{name: string, department_id: string}>): Promise<BulkMasterDataResult>
  static async bulkCreatePositions(positions: string[]): Promise<BulkMasterDataResult>
  static async getAllMasterData(): Promise<MasterDataResult>
}
```

#### SoftwareLicenseService
```typescript
class SoftwareLicenseService {
  static async getAllLicenses(): Promise<SoftwareLicense[]>
  static async createLicense(licenseData: CreateSoftwareLicenseData): Promise<SoftwareLicense>
  static async updateLicense(id: string, licenseData: UpdateSoftwareLicenseData): Promise<SoftwareLicense>
  static async deleteLicense(id: string): Promise<void>
  static async assignLicense(licenseId: string, employeeId: string): Promise<void>
  static async unassignLicense(licenseId: string, employeeId: string): Promise<void>
}
```

### API Deduplication
The system includes an API deduplication service to prevent duplicate requests:

```typescript
class ApiDeduplicator {
  static generateKey(method: string, params: any): string
  static execute<T>(key: string, fn: () => Promise<T>): Promise<T>
  static clearCache(): void
}
```

## Frontend Components

### Component Architecture
The frontend follows a component-based architecture with reusable UI components:

#### UI Components (Radix UI)
- `Button`, `Card`, `Dialog`, `Dropdown`, `Form`, `Input`, `Label`
- `Select`, `Table`, `Tabs`, `Toast`, `Tooltip`
- `Accordion`, `Alert`, `Avatar`, `Badge`, `Checkbox`
- `Collapsible`, `ContextMenu`, `HoverCard`, `Menubar`
- `NavigationMenu`, `Popover`, `Progress`, `RadioGroup`
- `ScrollArea`, `Separator`, `Slider`, `Switch`
- `Toggle`, `ToggleGroup`

#### Business Components
- `AssetTable` - Asset listing and management
- `EmployeeTable` - Employee listing and management
- `PurchaseOrderTable` - Purchase order management
- `SimCardTable` - SIM card management
- `SoftwareLicenseTable` - License management
- `DashboardStats` - Dashboard statistics
- `RecentActivity` - Activity feed
- `UserHeader` - User profile header
- `Sidebar` - Navigation sidebar

#### Form Components
- `AssetForm` - Asset creation/editing
- `EmployeeForm` - Employee creation/editing
- `PurchaseOrderForm` - Purchase order creation/editing
- `SimCardForm` - SIM card creation/editing
- `SoftwareLicenseForm` - License creation/editing
- `UserForm` - User creation/editing

#### Modal Components
- `AssetImportModal` - Asset bulk import
- `EmployeeImportModal` - Employee bulk import
- `QuickAssignModal` - Quick asset assignment
- `LicenseAssignmentModal` - License assignment
- `AccessoriesAssignmentModal` - Accessory assignment

### State Management
- **React Context**: Authentication state management
- **Local State**: Component-level state with useState/useReducer
- **Server State**: Supabase real-time subscriptions
- **Form State**: React Hook Form for form management

### Routing
- **Next.js App Router**: File-based routing
- **Protected Routes**: Authentication-based route protection
- **Dynamic Routes**: Dynamic page generation
- **Nested Layouts**: Hierarchical layout structure

## Deployment

### Production Environment
- **Platform**: Vercel
- **Domain**: https://vercel.com/mohammed-sajids-projects/v0-it-asset-management-system
- **Build Process**: Automated builds from Git repository
- **Environment Variables**: Secure environment variable management

### Environment Configuration
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Build Configuration
```javascript
// next.config.mjs
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  images: { unoptimized: true }
}
```

### Deployment Process
1. **Code Push**: Changes pushed to Git repository
2. **Automatic Build**: Vercel triggers build process
3. **Environment Setup**: Environment variables configured
4. **Database Migration**: Supabase migrations applied
5. **Deployment**: Application deployed to production

## Development Setup

### Prerequisites
- Node.js 18+ 
- npm or pnpm
- Supabase CLI
- Git

### Installation Steps
```bash
# Clone repository
git clone <repository-url>
cd v0-it-asset-management-system

# Install dependencies
npm install
# or
pnpm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Start Supabase (if using local development)
supabase start

# Run database migrations
supabase db push

# Start development server
npm run dev
```

### Available Scripts
```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "db:status": "supabase db status",
  "db:push": "supabase db push",
  "db:reset": "supabase db reset",
  "db:diff": "supabase db diff",
  "db:backup": "supabase db dump --data-only > backup_$(date +%Y%m%d_%H%M%S).sql",
  "migration:create": "supabase migration new",
  "migration:list": "ls -la supabase/migrations/"
}
```

### Development Workflow
1. **Feature Development**: Create feature branches
2. **Database Changes**: Create migration files
3. **Testing**: Test locally with Supabase
4. **Code Review**: Submit pull requests
5. **Deployment**: Merge to main branch

## Database Migrations

### Migration System
The application uses Supabase migrations for database schema management:

#### Migration Files
- `0001_initial_schema.sql` - Initial database schema
- `0002_user_roles_and_permissions.sql` - User management system
- `0003_fix_ambiguous_column_reference.sql` - Schema fixes
- `0004_add_code_fields_to_tables.sql` - Additional fields
- `0005_disable_rls_for_development.sql` - Development configuration
- `0006_add_company_id_to_projects.sql` - Project enhancements
- `0007_add_cost_center_and_country_to_projects.sql` - Project data
- `0008_fix_employees_table_schema.sql` - Employee schema fixes
- `0009_add_unique_constraint_employees_code.sql` - Employee constraints
- `0010_fix_employee_name_fields.sql` - Employee field fixes
- `0011_add_missing_asset_columns.sql` - Asset enhancements
- `0012_add_project_id_to_software_licenses.sql` - License project linking
- `0013_fix_assets_assigned_to_data_type.sql` - Asset data type fixes
- `0014_add_item_id_to_purchase_order_items.sql` - PO item linking
- `0015_add_description_to_purchase_orders.sql` - PO descriptions
- `0016_fix_requested_by_id_reference.sql` - PO reference fixes
- `0017_remove_price_fields_from_purchase_order_items.sql` - PO cleanup
- `0018_update_sim_cards_schema.sql` - SIM card schema updates
- `0019_add_project_id_to_assets_sim_cards_software.sql` - Project linking
- `0020_create_audit_triggers.sql` - Audit system
- `0021_fix_audit_log_rls_policy.sql` - Audit policy fixes

### Migration Commands
```bash
# Create new migration
supabase migration new migration_name

# Apply migrations
supabase db push

# Reset database
supabase db reset

# Check migration status
supabase db status

# Generate diff
supabase db diff
```

### Migration Best Practices
- **Atomic Changes**: Each migration should be atomic
- **Backward Compatibility**: Maintain backward compatibility
- **Data Migration**: Include data migration when needed
- **Testing**: Test migrations in development first
- **Documentation**: Document complex migrations

## User Management

### User Creation Process
1. **Admin Creates User**: Admin creates user account
2. **Profile Setup**: User profile created with role and permissions
3. **Project Assignment**: User assigned to specific projects
4. **Permission Assignment**: Granular permissions assigned
5. **Account Activation**: User account activated

### Role Assignment
```sql
-- Assign super admin role
SELECT public.assign_user_role('user-uuid', 'super_admin', 'admin-uuid');

-- Check user permissions
SELECT public.user_has_permission('user-uuid', 'system:admin');

-- Get user roles
SELECT * FROM public.get_user_roles('user-uuid');
```

### Permission System
- **Hierarchical Roles**: Roles inherit permissions
- **Granular Permissions**: Specific action permissions
- **Project-Based Access**: Data access limited by projects
- **Time-Based Access**: Optional expiration dates

### User Management Scripts
The system includes several scripts for user management:

#### Super Admin Assignment
```bash
# Interactive mode
node scripts/assign-super-admin-complete.js

# PowerShell script
.\scripts\assign-super-admin.ps1 -Email admin@company.com

# Batch script
.\scripts\assign-super-admin.bat
```

#### Available Scripts
- `assign-super-admin-complete.js` - Complete super admin setup
- `assign-super-admin.js` - Basic super admin assignment
- `assign-super-admin.ps1` - PowerShell version
- `assign-super-admin.bat` - Windows batch version
- `assign-super-admin.sql` - SQL-only version

## Audit & Logging

### Audit System
The application includes a comprehensive audit system that tracks all changes:

#### Audit Log Table
```sql
CREATE TABLE public.audit_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name text NOT NULL,
  record_id text NOT NULL,
  action text NOT NULL CHECK (action IN ('INSERT','UPDATE','DELETE')),
  old_values jsonb,
  new_values jsonb,
  user_id uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
```

#### Audit Triggers
Automatic triggers are created for all main tables:
- `assets_audit_trigger`
- `employees_audit_trigger`
- `purchase_orders_audit_trigger`
- `sim_cards_audit_trigger`
- `software_licenses_audit_trigger`
- `projects_audit_trigger`
- `companies_audit_trigger`

#### Audit Function
```sql
CREATE OR REPLACE FUNCTION public.audit_trigger_function()
RETURNS TRIGGER AS $$
-- Logs all INSERT, UPDATE, DELETE operations
-- Captures old and new values
-- Records user who made the change
-- Timestamps all changes
$$ LANGUAGE plpgsql;
```

### Logging Features
- **Change Tracking**: All data changes logged
- **User Attribution**: Changes attributed to users
- **Before/After Values**: Old and new values captured
- **Timestamp Tracking**: Precise change timestamps
- **Table-Level Logging**: All main tables audited
- **JSON Storage**: Flexible JSON storage for values

### Audit Queries
```sql
-- View recent changes
SELECT * FROM public.audit_log 
ORDER BY created_at DESC 
LIMIT 100;

-- View changes by user
SELECT * FROM public.audit_log 
WHERE user_id = 'user-uuid'
ORDER BY created_at DESC;

-- View changes by table
SELECT * FROM public.audit_log 
WHERE table_name = 'assets'
ORDER BY created_at DESC;
```

## Performance Considerations

### Database Performance
- **Indexes**: Strategic indexes on frequently queried columns
- **Query Optimization**: Optimized queries with proper joins
- **Connection Pooling**: Supabase handles connection pooling
- **Caching**: API deduplication reduces redundant requests

### Frontend Performance
- **Code Splitting**: Next.js automatic code splitting
- **Lazy Loading**: Components loaded on demand
- **Image Optimization**: Next.js image optimization
- **Bundle Analysis**: Regular bundle size monitoring

### Caching Strategy
- **API Deduplication**: Prevents duplicate API calls
- **Browser Caching**: Static assets cached
- **CDN**: Vercel CDN for global distribution
- **Database Caching**: Supabase query caching

### Performance Monitoring
- **Vercel Analytics**: Built-in performance monitoring
- **Database Monitoring**: Supabase performance metrics
- **Error Tracking**: Comprehensive error logging
- **User Experience**: Real user monitoring

## Troubleshooting

### Common Issues

#### Database Connection Issues
```bash
# Check Supabase status
supabase status

# Verify environment variables
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY

# Test database connection
supabase db ping
```

#### Authentication Issues
```bash
# Check auth configuration
supabase auth status

# Reset user password
supabase auth reset-password user@example.com

# Verify user permissions
SELECT * FROM public.user_profiles WHERE email = 'user@example.com';
```

#### Migration Issues
```bash
# Check migration status
supabase db status

# Reset migrations
supabase db reset

# Apply specific migration
supabase db push --include-all
```

#### Build Issues
```bash
# Clear Next.js cache
rm -rf .next

# Clear node modules
rm -rf node_modules
npm install

# Check TypeScript errors
npm run build
```

### Debug Mode
```bash
# Enable debug logging
DEBUG=* npm run dev

# Supabase debug mode
supabase start --debug
```

### Support Resources
- **Documentation**: README.md files in project
- **Migration Guides**: MIGRATION_GUIDE.md
- **Setup Guides**: Various setup documentation
- **Scripts**: Helper scripts in /scripts directory
- **Logs**: Application and database logs

### Getting Help
1. Check existing documentation
2. Review error logs
3. Test in development environment
4. Check Supabase dashboard
5. Review migration status
6. Verify environment configuration

---

## Conclusion

This IT Asset Management System provides a comprehensive solution for managing IT assets, employees, and related processes within an organization. The system is built with modern technologies and follows best practices for security, performance, and maintainability.

The architecture supports scalability, with clear separation of concerns and modular design. The security model ensures data protection through role-based access control and project-based filtering. The audit system provides complete traceability of all system changes.

For additional support or questions, refer to the project documentation or contact the development team.
