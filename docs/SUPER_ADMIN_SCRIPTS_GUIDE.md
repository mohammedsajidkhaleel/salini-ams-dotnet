# Super Admin Assignment Scripts Guide

This guide provides comprehensive scripts and tools to assign super admin privileges and manage all permissions in the IT Asset Management System.

## 🚀 Quick Start

### Option 1: One-Line SQL (Recommended)
```sql
-- Replace 'your-email@example.com' with your actual email
WITH user_info AS (
  SELECT id FROM auth.users WHERE email = 'your-email@example.com'
)
SELECT public.assign_user_role(
  (SELECT id FROM user_info),
  'super_admin',
  (SELECT id FROM user_info)
);
```

### Option 2: Node.js Script
```bash
# Install dependencies first
npm install @supabase/supabase-js

# Assign super admin role
node scripts/assign-super-admin-complete.js --email user@example.com

# Interactive mode
node scripts/assign-super-admin-complete.js
```

### Option 3: PowerShell Script (Windows)
```powershell
# Assign super admin role
.\scripts\assign-super-admin.ps1 -Email user@example.com

# Interactive mode
.\scripts\assign-super-admin.ps1 -Interactive
```

## 📁 Available Scripts

### 1. `scripts/assign-super-admin-sql.sql`
**Complete SQL script with all functionality**
- ✅ One-liner super admin assignment
- ✅ Permission verification
- ✅ User and role listing
- ✅ Custom role creation
- ✅ Bulk operations
- ✅ System health checks

### 2. `scripts/assign-super-admin-complete.js`
**Node.js script with full functionality**
- ✅ Interactive mode
- ✅ Command-line interface
- ✅ User management
- ✅ Role creation
- ✅ Permission verification
- ✅ Error handling

### 3. `scripts/assign-super-admin.ps1`
**PowerShell script for Windows**
- ✅ Interactive mode
- ✅ User listing
- ✅ Role management
- ✅ Permission verification
- ✅ Windows-native experience

## 🔧 Usage Examples

### SQL Script Usage

#### Assign Super Admin Role
```sql
-- Step 1: Assign role
WITH user_info AS (
  SELECT id FROM auth.users WHERE email = 'admin@company.com'
)
SELECT public.assign_user_role(
  (SELECT id FROM user_info),
  'super_admin',
  (SELECT id FROM user_info)
);

-- Step 2: Verify assignment
SELECT 
  au.email,
  ur.name as role_name,
  jsonb_array_length(ur.permissions) as total_permissions
FROM auth.users au
JOIN public.user_role_assignments ura ON au.id = ura.user_id
JOIN public.user_roles ur ON ura.role_id = ur.id
WHERE au.email = 'admin@company.com'
  AND ura.is_active = true;
```

#### List All Users and Roles
```sql
SELECT 
  au.email,
  COALESCE(ur.name, 'No Role') as role_name,
  COALESCE(jsonb_array_length(ur.permissions), 0) as permission_count,
  ura.assigned_at
FROM auth.users au
LEFT JOIN public.user_role_assignments ura ON au.id = ura.user_id AND ura.is_active = true
LEFT JOIN public.user_roles ur ON ura.role_id = ur.id
ORDER BY au.email;
```

#### Create Custom Role
```sql
INSERT INTO public.user_roles (id, name, description, is_system_role, permissions)
VALUES (
  'custom_manager',
  'Custom Manager',
  'Custom role with specific permissions',
  false,
  to_jsonb(array[
    'master_data:read',
    'master_data:create',
    'master_data:update',
    'employees:read',
    'employees:create',
    'employees:update',
    'assets:read',
    'assets:create',
    'assets:update',
    'reports:read',
    'reports:generate'
  ])
);
```

### Node.js Script Usage

#### Command Line Interface
```bash
# Assign super admin role
node scripts/assign-super-admin-complete.js --email admin@company.com

# List all users
node scripts/assign-super-admin-complete.js --list-users

# List all roles
node scripts/assign-super-admin-complete.js --list-roles

# Verify permissions
node scripts/assign-super-admin-complete.js --verify-permissions --email admin@company.com

# Create custom role
node scripts/assign-super-admin-complete.js --create-role --name "Custom Role" --permissions "employees:read,employees:create"
```

#### Interactive Mode
```bash
node scripts/assign-super-admin-complete.js
```

### PowerShell Script Usage

#### Command Line Interface
```powershell
# Assign super admin role
.\scripts\assign-super-admin.ps1 -Email admin@company.com

# List all users
.\scripts\assign-super-admin.ps1 -ListUsers

# List all roles
.\scripts\assign-super-admin.ps1 -ListRoles

# Verify permissions
.\scripts\assign-super-admin.ps1 -VerifyPermissions -Email admin@company.com

# Interactive mode
.\scripts\assign-super-admin.ps1 -Interactive
```

## 🔐 Available Roles

### 1. Super Administrator (`super_admin`)
- **Description**: Full system access with all permissions
- **Permissions**: All 40+ system permissions
- **Use Case**: System administrators, IT managers

### 2. Administrator (`admin`)
- **Description**: Administrative access with most permissions
- **Permissions**: All permissions except system-level operations
- **Use Case**: Department heads, senior managers

### 3. Manager (`manager`)
- **Description**: Management access with read/write permissions
- **Permissions**: Read/write access to most operations, no delete or system admin
- **Use Case**: Team leads, project managers

### 4. Standard User (`user`)
- **Description**: Basic user access with read permissions
- **Permissions**: Read-only access to all data
- **Use Case**: Regular employees, end users

## 📋 Available Permissions

### Master Data Permissions
- `master_data:read` - View master data
- `master_data:create` - Create master data entries
- `master_data:update` - Update master data entries
- `master_data:delete` - Delete master data entries

### Employee Permissions
- `employees:read` - View employee information
- `employees:create` - Create new employees
- `employees:update` - Update employee information
- `employees:delete` - Delete employees
- `employees:import` - Import employee data
- `employees:export` - Export employee data

### Asset Permissions
- `assets:read` - View assets
- `assets:create` - Create new assets
- `assets:update` - Update asset information
- `assets:delete` - Delete assets
- `assets:assign` - Assign assets to employees
- `assets:unassign` - Unassign assets from employees

### Accessory Permissions
- `accessories:read` - View accessories
- `accessories:create` - Create new accessories
- `accessories:update` - Update accessory information
- `accessories:delete` - Delete accessories
- `accessories:assign` - Assign accessories to employees
- `accessories:unassign` - Unassign accessories from employees

### SIM Card Permissions
- `sim_cards:read` - View SIM cards
- `sim_cards:create` - Create new SIM cards
- `sim_cards:update` - Update SIM card information
- `sim_cards:delete` - Delete SIM cards
- `sim_cards:assign` - Assign SIM cards to employees
- `sim_cards:unassign` - Unassign SIM cards from employees

### Software License Permissions
- `software_licenses:read` - View software licenses
- `software_licenses:create` - Create new software licenses
- `software_licenses:update` - Update software license information
- `software_licenses:delete` - Delete software licenses
- `software_licenses:assign` - Assign software licenses to employees
- `software_licenses:unassign` - Unassign software licenses from employees

### Purchase Order Permissions
- `purchase_orders:read` - View purchase orders
- `purchase_orders:create` - Create new purchase orders
- `purchase_orders:update` - Update purchase order information
- `purchase_orders:delete` - Delete purchase orders
- `purchase_orders:approve` - Approve purchase orders

### Report Permissions
- `reports:read` - View reports
- `reports:generate` - Generate reports
- `reports:export` - Export reports

### User Management Permissions
- `users:read` - View user information
- `users:create` - Create new users
- `users:update` - Update user information
- `users:delete` - Delete users
- `users:assign_roles` - Assign roles to users
- `users:manage_permissions` - Manage user permissions

### System Administration Permissions
- `system:admin` - Full system administration
- `system:audit_logs` - Access audit logs
- `system:backup` - Create system backups
- `system:restore` - Restore system from backups

## 🔍 Verification and Testing

### Test Super Admin Permissions
```sql
-- Replace with your user ID
SELECT 
  public.user_has_permission('YOUR_USER_ID'::uuid, 'system:admin') as has_system_admin,
  public.user_has_permission('YOUR_USER_ID'::uuid, 'users:manage_permissions') as has_user_management,
  public.user_has_permission('YOUR_USER_ID'::uuid, 'employees:create') as has_employee_create;
```

### System Health Check
```sql
SELECT 
  'Total Users' as metric,
  count(*)::text as value
FROM auth.users
UNION ALL
SELECT 
  'Users with Roles' as metric,
  count(DISTINCT user_id)::text as value
FROM public.user_role_assignments
WHERE is_active = true
UNION ALL
SELECT 
  'Super Admins' as metric,
  count(*)::text as value
FROM public.user_role_assignments ura
JOIN public.user_roles ur ON ura.role_id = ur.id
WHERE ur.id = 'super_admin' AND ura.is_active = true;
```

## 🛠️ Troubleshooting

### Common Issues

#### 1. "Function does not exist" Error
- **Cause**: Database migrations not applied
- **Solution**: Run `npm run db:push` or apply migrations manually

#### 2. "Column reference is ambiguous" Error
- **Cause**: SQL query ambiguity
- **Solution**: Use the fixed SQL scripts with proper table aliases

#### 3. "User not found" Error
- **Cause**: Email address doesn't exist in auth.users
- **Solution**: Check the email address in Supabase Authentication section

#### 4. "Permission denied" Error
- **Cause**: Insufficient permissions to assign roles
- **Solution**: Use a super admin account or run as database owner

### Environment Setup

#### Required Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

#### Database Requirements
- Supabase project with migrations applied
- `user_roles` and `user_role_assignments` tables created
- RPC functions available (`assign_user_role`, `user_has_permission`, etc.)

## 📚 Additional Resources

- [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) - Database setup guide
- [SUPER_ADMIN_SETUP.md](./SUPER_ADMIN_SETUP.md) - Quick setup guide
- [USER_MANAGEMENT_SETUP.md](./USER_MANAGEMENT_SETUP.md) - User management guide
- [DATABASE_SETUP.md](./DATABASE_SETUP.md) - Database configuration guide

## 🎯 Best Practices

1. **Always verify assignments** after making changes
2. **Use the least privilege principle** - assign only necessary permissions
3. **Regular audit** of user roles and permissions
4. **Test permissions** in a development environment first
5. **Keep backups** before making bulk changes
6. **Document custom roles** and their purposes
7. **Monitor audit logs** for permission changes

## 🚨 Security Notes

- Super admin role grants full system access
- Always verify user identity before assigning roles
- Use strong authentication for admin accounts
- Regularly review and audit user permissions
- Consider role expiration for temporary access
- Monitor for unusual permission changes

---

**Need Help?** Check the troubleshooting section or refer to the individual script documentation for detailed usage instructions.


