# Database Migration Guide

## ⚠️ Important: Manual Migrations Only

This project is configured to **NOT run migrations automatically** to prevent data loss. All database migrations must be run manually when you're ready.

## Why Manual Migrations?

- **Data Preservation**: Automatic migrations can sometimes cause data loss
- **Control**: You decide when to apply schema changes
- **Safety**: You can review changes before applying them
- **Backup**: You can create backups before running migrations

## Current Migration Status

Your project has the following migrations ready to be applied:

1. `0001_initial_schema.sql` - Core database schema
2. `0002_user_roles_and_permissions.sql` - User management system
3. `0003_fix_ambiguous_column_reference.sql` - Bug fixes
4. `0004_add_code_fields_to_tables.sql` - Additional fields
5. `0005_disable_rls_for_development.sql` - Development settings
6. `0006_add_company_id_to_projects.sql` - Project enhancements

## How to Run Migrations Safely

### Step 1: Check Current Status
```bash
npm run db:status
```
This shows which migrations have been applied and which are pending.

### Step 2: Create a Backup (Recommended)
```bash
npm run db:backup
```
This creates a timestamped backup of your current data.

### Step 3: Apply Migrations
```bash
npm run db:push
```
This applies all pending migrations to your database.

### Step 4: Verify Changes
Check your Supabase dashboard to ensure:
- Tables were created successfully
- Data is intact
- No errors occurred

## Available Migration Commands

| Command | Description |
|---------|-------------|
| `npm run db:status` | Check migration status |
| `npm run db:push` | Apply pending migrations |
| `npm run db:reset` | Reset database (⚠️ DESTROYS ALL DATA) |
| `npm run db:diff` | Show differences between local and remote |
| `npm run db:backup` | Create data backup |
| `npm run migration:create` | Create new migration file |
| `npm run migration:list` | List all migration files |

## Creating New Migrations

When you need to make database changes:

1. **Create a new migration**:
   ```bash
   npm run migration:create your_migration_name
   ```

2. **Edit the generated file** in `supabase/migrations/`

3. **Test locally** (if using local Supabase):
   ```bash
   supabase start
   npm run db:push
   ```

4. **Apply to production** when ready:
   ```bash
   npm run db:push
   ```

## Troubleshooting

### Migration Fails
1. Check the error message in your terminal
2. Review the migration file for syntax errors
3. Ensure you have proper permissions
4. Restore from backup if needed

### Data Loss Concerns
1. Always create backups before migrations
2. Test migrations on a copy of your database first
3. Review migration files before applying
4. Use `db:diff` to see what will change

### Rollback
If you need to undo a migration:
1. Restore from your backup
2. Or manually reverse the changes in a new migration

## Best Practices

1. **Always backup before migrations**
2. **Review migration files before applying**
3. **Test on development environment first**
4. **Apply migrations during maintenance windows**
5. **Keep migration files in version control**
6. **Document any manual steps required**

## Configuration

The project is configured with `supabase/config.toml` to ensure:
- Migrations are NOT applied automatically
- You have full control over when changes are applied
- Development and production environments are properly separated

## Need Help?

If you encounter issues:
1. Check the Supabase documentation
2. Review the migration files for syntax errors
3. Ensure your Supabase credentials are correct
4. Contact your system administrator

---

**Remember**: With great power comes great responsibility. Manual migrations give you control, but also require careful attention to prevent data loss.
