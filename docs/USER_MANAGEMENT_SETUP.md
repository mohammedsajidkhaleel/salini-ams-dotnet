# User Management System Setup Guide

This guide explains how to set up and use the new Supabase-based user management system with project-based access control.

## Overview

The system now includes:
- **Supabase Authentication**: Email/password authentication
- **User Management**: Create, edit, delete users with roles and permissions
- **Project-based Access Control**: Users can only see data from their assigned projects
- **Module Permissions**: Users only see modules they have permission to access
- **Row-level Security**: Database-level security policies enforce access control

## Database Setup

### 1. Run Database Migrations (Manual Only)

⚠️ **Important**: This project is configured to NOT run migrations automatically to prevent data loss.

Execute migrations manually when you're ready:

```bash
# Check current migration status
npm run db:status

# Create a backup (recommended)
npm run db:backup

# Apply all pending migrations
npm run db:push
```

**See `MIGRATION_GUIDE.md` for detailed instructions on safe migration practices.**

The migrations will create:
- `user_profiles` table (extends Supabase auth.users)
- `user_permissions` table (granular permissions)
- `user_projects` table (project assignments)
- Row-level security policies for all data tables

### 2. Enable Supabase Auth

In your Supabase dashboard:
1. Go to Authentication > Settings
2. Enable email authentication
3. Disable other providers (Google, GitHub, etc.) if you only want email
4. Set up email templates if needed

## User Management Features

### Creating Users

1. Navigate to **User Management** (requires `manage_users` permission)
2. Click **Add New User**
3. Fill in the form:
   - **Email**: User's email address (used for login)
   - **Password**: Initial password (user can change later)
   - **First Name** & **Last Name**: User's full name
   - **Role**: Select from predefined roles
   - **Department**: User's department
   - **Permissions**: Select specific permissions
   - **Project Assignment**: Assign user to specific projects
4. Click **Create User**

### User Roles

Available roles:
- **Super Admin**: Full system access
- **Admin**: Most permissions except user management
- **IT Manager**: Asset and inventory management
- **Asset Manager**: Asset management only
- **Purchase Manager**: Purchase order management
- **HR Manager**: Employee management
- **User**: Basic access only

### Permissions

Available permissions:
- `view_dashboard`: Access to dashboard
- `manage_assets`: Asset management
- `manage_employees`: Employee management
- `manage_inventory`: Inventory management
- `manage_purchase_orders`: Purchase order management
- `manage_sim_cards`: SIM card management
- `manage_software_licenses`: Software license management
- `view_reports`: Access to reports
- `manage_users`: User management (admin only)
- `manage_settings`: System settings
- `approve_purchase_orders`: Purchase order approval
- `assign_assets`: Asset assignment
- `delete_records`: Delete operations

## Project-based Access Control

### How It Works

1. **User Assignment**: Users are assigned to specific projects
2. **Data Filtering**: Users can only see data (employees, assets, etc.) from their assigned projects
3. **Project Dropdown**: Each list has a project filter showing only accessible projects
4. **Database Security**: Row-level security policies enforce access at the database level

### Setting Up Projects

1. Go to **Settings** > **Master Data** > **Projects**
2. Create projects with unique codes
3. Assign users to projects in **User Management**

### Project Filtering

Each data list (Employees, Assets, SIM Cards, Software Licenses) now includes:
- **Project Dropdown**: Filter by specific project or view all accessible projects
- **Automatic Filtering**: Users only see projects they're assigned to
- **Admin Override**: Admin users can see all projects and data

## Navigation & Module Access

### Sidebar Navigation

The sidebar automatically shows only modules the user has permission to access:
- **Dashboard**: Requires `view_dashboard`
- **Assets**: Requires `manage_assets`
- **Employees**: Requires `manage_employees`
- **Inventory**: Requires `manage_inventory`
- **Purchase Orders**: Requires `manage_purchase_orders`
- **SIM Cards**: Requires `manage_sim_cards`
- **Software Licenses**: Requires `manage_software_licenses`
- **Reports**: Requires `view_reports`
- **User Management**: Requires `manage_users`
- **Settings**: Requires `manage_settings`

## Security Features

### Row-Level Security (RLS)

The system implements RLS policies that:
- **Restrict Data Access**: Users can only see data from their assigned projects
- **Admin Override**: Users with admin permissions can see all data
- **Permission-based**: Operations require specific permissions
- **Automatic Enforcement**: Security is enforced at the database level

### Authentication Flow

1. **Login**: Users log in with email/password
2. **Profile Loading**: System loads user profile, permissions, and project assignments
3. **Access Control**: All operations check permissions and project access
4. **Data Filtering**: Queries automatically filter by user's accessible projects

## First-Time Setup

### Creating the First Admin User

Since the system requires admin permissions to create users, you'll need to:

1. **Manual Database Insert** (temporary):
   ```sql
   -- Create admin user in Supabase Auth dashboard first
   -- Then run this to set up permissions
   INSERT INTO public.user_profiles (id, email, first_name, last_name, role, is_active)
   VALUES ('your-user-id', 'admin@company.com', 'Admin', 'User', 'Super Admin', true);
   
   INSERT INTO public.user_permissions (id, user_id, permission)
   VALUES 
     ('admin-manage-users', 'your-user-id', 'manage_users'),
     ('admin-view-dashboard', 'your-user-id', 'view_dashboard'),
     ('admin-manage-assets', 'your-user-id', 'manage_assets'),
     ('admin-manage-employees', 'your-user-id', 'manage_employees'),
     ('admin-manage-inventory', 'your-user-id', 'manage_inventory'),
     ('admin-manage-purchase-orders', 'your-user-id', 'manage_purchase_orders'),
     ('admin-manage-sim-cards', 'your-user-id', 'manage_sim_cards'),
     ('admin-manage-software-licenses', 'your-user-id', 'manage_software_licenses'),
     ('admin-view-reports', 'your-user-id', 'view_reports'),
     ('admin-manage-settings', 'your-user-id', 'manage_settings'),
     ('admin-approve-purchase-orders', 'your-user-id', 'approve_purchase_orders'),
     ('admin-assign-assets', 'your-user-id', 'assign_assets'),
     ('admin-delete-records', 'your-user-id', 'delete_records');
   ```

2. **Or use Supabase Dashboard**:
   - Create user in Authentication section
   - Manually insert profile and permissions in SQL editor

## Testing the System

### Test Scenarios

1. **Admin User**:
   - Can see all modules in sidebar
   - Can create/edit/delete users
   - Can see all projects and data
   - Can assign users to projects

2. **Regular User**:
   - Only sees assigned modules
   - Only sees assigned projects in dropdowns
   - Only sees data from assigned projects
   - Cannot access user management

3. **Project Filtering**:
   - Test project dropdown in each list
   - Verify data filtering works correctly
   - Test with multiple projects assigned

### Common Issues

1. **User can't see any data**: Check project assignments
2. **User can't access modules**: Check permissions
3. **Login fails**: Verify email/password and user is active
4. **Database errors**: Check RLS policies and user permissions

## Migration from Mock Data

The system has been updated to use Supabase data instead of mock data:
- **User Management**: Now uses real Supabase users
- **Authentication**: Integrated with Supabase Auth
- **Data Access**: All queries go through Supabase with RLS
- **Project Filtering**: Automatic filtering based on user assignments

## Environment Variables

Ensure your `.env.local` has:
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## Support

If you encounter issues:
1. Check browser console for errors
2. Verify Supabase connection
3. Check user permissions and project assignments
4. Review RLS policies in Supabase dashboard
5. Ensure all migrations have been applied

The system is now fully integrated with Supabase authentication and provides comprehensive user management with project-based access control.

