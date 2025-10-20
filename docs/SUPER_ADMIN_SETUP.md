# Super Admin Setup Guide

## Quick Setup Steps

### Step 1: Find Your User ID
1. Go to Supabase Studio: `http://127.0.0.1:54323`
2. Navigate to **SQL Editor**
3. Run this query (replace with your actual email):

```sql
SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'your-email@example.com';
```

4. Copy the `id` value from the result

### Step 2: Assign Super Admin Role
1. In the same SQL Editor, run this query (replace `YOUR_USER_ID_HERE` with the ID from Step 1):

```sql
SELECT public.assign_user_role(
  'YOUR_USER_ID_HERE'::uuid,
  'super_admin',
  'YOUR_USER_ID_HERE'::uuid
);
```

### Step 3: Verify Assignment
1. Run this query to verify the role was assigned:

```sql
SELECT 
  user_roles.name as role_name,
  user_roles.description,
  user_roles.permissions
FROM public.user_role_assignments 
JOIN public.user_roles ON user_role_assignments.role_id = user_roles.id
WHERE user_role_assignments.user_id = 'YOUR_USER_ID_HERE'::uuid
  AND user_role_assignments.is_active = true;
```

### Step 4: Test Permissions
1. Run this query to test if you have super admin permissions:

```sql
SELECT 
  public.user_has_permission('YOUR_USER_ID_HERE'::uuid, 'system:admin') as has_system_admin,
  public.user_has_permission('YOUR_USER_ID_HERE'::uuid, 'users:manage_permissions') as has_user_management,
  public.user_has_permission('YOUR_USER_ID_HERE'::uuid, 'employees:create') as has_employee_create;
```

All three should return `true` if the assignment was successful.

## One-Liner Version

If you prefer a single command, replace `your-email@example.com` with your actual email:

```sql
WITH user_info AS (
  SELECT id FROM auth.users WHERE email = 'your-email@example.com'
)
SELECT public.assign_user_role(
  (SELECT id FROM user_info),
  'super_admin',
  (SELECT id FROM user_info)
);
```

## Troubleshooting

### If you get "column reference is ambiguous" error:
- Use the fixed SQL script: `scripts/assign-super-admin-fixed.sql`
- Make sure to use table aliases explicitly

### If you get "function does not exist" error:
- Make sure the migration `0002_user_roles_and_permissions.sql` was applied
- Run `npm run db:push` to apply all pending migrations (see MIGRATION_GUIDE.md for details)

### If you can't find your user:
- Check the Authentication section in Supabase Studio
- Make sure you're looking in the correct email field

## Available Roles

- **super_admin**: Full system access (all permissions)
- **admin**: Administrative access (most permissions)
- **manager**: Management access (read/write for most operations)
- **user**: Standard user (read-only access)

## Super Admin Permissions

As a super admin, you have access to:
- ✅ All master data operations
- ✅ Employee management (create, read, update, delete, import, export)
- ✅ Asset management (full CRUD + assign/unassign)
- ✅ SIM card management (full CRUD + assign/unassign)
- ✅ Software license management (full CRUD + assign/unassign)
- ✅ Purchase order management (full CRUD + approve)
- ✅ Report generation and export
- ✅ User management (create, update, delete users)
- ✅ Role management (assign/remove roles)
- ✅ System administration (audit logs, system settings)
