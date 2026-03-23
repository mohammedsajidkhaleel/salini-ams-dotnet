# Manual Database Migration Guide

This guide explains how to run database migrations manually when automatic migration is disabled or when you need to run migrations outside of the application startup.

## Prerequisites

- **.NET 8.0 SDK** (for generating SQL scripts or running EF commands)
- **PostgreSQL** running and accessible
- **Database connection string** configured correctly

## Option 1: Using EF Core Tools (Recommended if SDK is available)

### Step 1: Install EF Core Tools

```bash
dotnet tool install --global dotnet-ef
```

### Step 2: Navigate to API Directory

```bash
cd /var/www/ams/api
# Or if you have the full source code:
cd /path/to/backend
```

### Step 3: Run Migrations

```bash
# Set environment to Production
export ASPNETCORE_ENVIRONMENT=Production

# Run migrations
dotnet ef database update \
  --project salini.api.Infrastructure \
  --startup-project salini.api.API
```

### Step 4: Verify Migrations

```bash
# List all migrations (applied and pending)
dotnet ef migrations list \
  --project salini.api.Infrastructure \
  --startup-project salini.api.API
```

## Option 2: Using the Migration Script (If SDK is NOT available on production)

### Step 1: Generate SQL Script on Development Machine

On a machine with .NET SDK installed:

```bash
cd backend
dotnet ef migrations script \
  --project salini.api.Infrastructure \
  --startup-project salini.api.API \
  --output migration.sql \
  --idempotent
```

Or use the provided script:
```bash
chmod +x generate-migration-sql.sh
./generate-migration-sql.sh
```

### Step 2: Copy SQL Script to Production Server

```bash
scp migration.sql user@production-server:/tmp/
```

### Step 3: Execute SQL Script on Production

```bash
# On production server
psql -h localhost -U ams -d ams -f /tmp/migration.sql
```

Or if you need to enter password:
```bash
PGPASSWORD=qwerty psql -h localhost -U ams -d ams -f /tmp/migration.sql
```

## Option 3: Using the Automated Script

If you have the source code on the production server:

```bash
# Make script executable
chmod +x run-migrations.sh

# Run the script
sudo ./run-migrations.sh
```

The script will:
- Check for .NET and EF tools
- Install EF tools if needed
- Run migrations automatically
- Verify the results

## Option 4: Manual SQL Execution (For Specific Migrations)

If you need to run a specific migration manually, you can:

### 1. Find the Migration File

Migrations are in: `salini.api.Infrastructure/Migrations/`

For example: `20251025090556_AddRefreshTokens.cs`

### 2. Extract SQL from Migration

Look at the `Up()` method in the migration file to see what SQL it generates.

### 3. Execute SQL Manually

For the RefreshTokens table, the SQL would be:

```sql
CREATE TABLE "RefreshTokens" (
    "Id" character varying(450) NOT NULL,
    "Token" character varying(500) NOT NULL,
    "UserId" character varying(450) NOT NULL,
    "ExpiresAt" timestamp with time zone NOT NULL,
    "IsRevoked" boolean NOT NULL DEFAULT false,
    "RevokedAt" timestamp with time zone NULL,
    "ReplacedByToken" text NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone NULL,
    "CreatedBy" text NULL,
    "UpdatedBy" text NULL,
    CONSTRAINT "PK_RefreshTokens" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_RefreshTokens_AspNetUsers_UserId" FOREIGN KEY ("UserId") 
        REFERENCES "AspNetUsers" ("Id") ON DELETE CASCADE
);

CREATE INDEX "IX_RefreshTokens_ExpiresAt" ON "RefreshTokens" ("ExpiresAt");
CREATE UNIQUE INDEX "IX_RefreshTokens_Token" ON "RefreshTokens" ("Token");
CREATE INDEX "IX_RefreshTokens_UserId" ON "RefreshTokens" ("UserId");
CREATE INDEX "IX_RefreshTokens_UserId_IsRevoked" ON "RefreshTokens" ("UserId", "IsRevoked");

-- Record migration in __EFMigrationsHistory
INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20251025090556_AddRefreshTokens', '8.0.10');
```

## Troubleshooting

### Error: "dotnet ef: command not found"

**Solution**: Install EF Core tools:
```bash
dotnet tool install --global dotnet-ef
```

### Error: ".NET SDK not found"

**Solutions**:
1. Install .NET 8.0 SDK on the machine
2. Use Option 2 (generate SQL on dev machine, run on production)
3. Use Option 4 (manual SQL execution)

### Error: "Cannot connect to database"

**Check**:
1. PostgreSQL is running: `sudo systemctl status postgresql`
2. Connection string is correct in `appsettings.Production.json`
3. Database exists: `psql -h localhost -U ams -d ams -c "SELECT 1;"`
4. User has permissions: `GRANT ALL PRIVILEGES ON DATABASE ams TO ams;`

### Error: "Permission denied"

**Solution**: Grant necessary permissions:
```sql
-- Connect as postgres superuser
sudo -u postgres psql

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE ams TO ams;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ams;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ams;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ams;
```

### Error: "Migration already applied"

**Solution**: This is normal if the migration was already applied. Check applied migrations:
```bash
dotnet ef migrations list --project salini.api.Infrastructure --startup-project salini.api.API
```

Or check in database:
```sql
SELECT * FROM "__EFMigrationsHistory" ORDER BY "MigrationId";
```

## Verifying Migrations

### Check Applied Migrations

```bash
dotnet ef migrations list --project salini.api.Infrastructure --startup-project salini.api.API
```

### Check in Database

```sql
SELECT * FROM "__EFMigrationsHistory" ORDER BY "MigrationId";
```

### Verify Tables Exist

```sql
-- Check if RefreshTokens table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'RefreshTokens'
);

-- List all tables
\dt
```

## Best Practices

1. **Always backup** your database before running migrations in production
2. **Test migrations** in a staging environment first
3. **Use idempotent scripts** when generating SQL (with `--idempotent` flag)
4. **Monitor logs** after running migrations
5. **Verify** that all expected tables exist after migration

## Quick Reference

```bash
# Install EF tools
dotnet tool install --global dotnet-ef

# Run all pending migrations
dotnet ef database update --project salini.api.Infrastructure --startup-project salini.api.API

# Generate SQL script
dotnet ef migrations script --project salini.api.Infrastructure --startup-project salini.api.API --output migration.sql --idempotent

# List migrations
dotnet ef migrations list --project salini.api.Infrastructure --startup-project salini.api.API

# Check database connection
psql -h localhost -U ams -d ams -c "SELECT version();"
```


