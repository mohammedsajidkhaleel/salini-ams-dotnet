# Audit Logging Feature

## Overview

The Salini AMS system now includes comprehensive audit logging that automatically tracks all changes made to database tables. Every INSERT, UPDATE, and DELETE operation is recorded with detailed information about what changed, who made the change, and when it occurred.

## Features

### ✅ Automatic Change Tracking
- **INSERT operations**: Captures all new values when records are created
- **UPDATE operations**: Captures both old and new values for modified fields
- **DELETE operations**: Captures all values before deletion

### ✅ User Attribution
- Every change is linked to the authenticated user who made it
- Records user ID from JWT token claims
- Stores user information for historical reference

### ✅ Detailed Change History
- Old and new values stored as JSON for easy comparison
- Primary key tracking to identify specific records
- Timestamp of when each change occurred

### ✅ Comprehensive Coverage
All entity tables are automatically audited:
- **Master Data**: Companies, Cost Centers, Departments, Projects, etc.
- **Employees**: Employee records and assignments
- **Assets**: Asset records and assignments
- **SIM Cards**: SIM card records and assignments
- **Software Licenses**: License records and assignments
- **Purchase Orders**: PO records and items
- **User Management**: User accounts, permissions, and project assignments

## Technical Implementation

### Database Schema

The `AuditLogs` table stores all audit records:

```sql
CREATE TABLE "AuditLogs" (
    "Id" VARCHAR(450) PRIMARY KEY,
    "TableName" VARCHAR(100) NOT NULL,
    "RecordId" VARCHAR(100) NOT NULL,
    "Action" VARCHAR(20) NOT NULL,  -- 'INSERT', 'UPDATE', or 'DELETE'
    "OldValues" jsonb,               -- JSON of old values (UPDATE/DELETE)
    "NewValues" jsonb,               -- JSON of new values (INSERT/UPDATE)
    "UserId" VARCHAR(450),           -- FK to AspNetUsers
    "CreatedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    
    CONSTRAINT "FK_AuditLogs_User" FOREIGN KEY ("UserId") 
        REFERENCES "AspNetUsers"("Id") ON DELETE SET NULL
);

-- Indexes for performance
CREATE INDEX "IX_AuditLogs_TableName" ON "AuditLogs"("TableName");
CREATE INDEX "IX_AuditLogs_RecordId" ON "AuditLogs"("RecordId");
CREATE INDEX "IX_AuditLogs_CreatedAt" ON "AuditLogs"("CreatedAt");
```

### How It Works

#### 1. ApplicationDbContext Override

The `ApplicationDbContext.SaveChangesAsync()` method is overridden to intercept all changes:

```csharp
public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
{
    // Step 1: Capture changes before saving
    var auditEntries = OnBeforeSaveChanges();
    
    // Step 2: Save changes to database
    var result = await base.SaveChangesAsync(cancellationToken);
    
    // Step 3: Save audit logs
    await OnAfterSaveChanges(auditEntries);
    
    return result;
}
```

#### 2. Change Detection

Before saving, the system:
1. Detects all tracked changes using EF Core's ChangeTracker
2. Identifies INSERT, UPDATE, and DELETE operations
3. Captures property values (old and new)
4. Gets the current user from `ICurrentUserService`

#### 3. Audit Log Creation

After successful save:
1. Generates unique IDs for new entities (if needed)
2. Serializes old/new values to JSON
3. Creates AuditLog entries
4. Saves audit logs in a separate transaction

#### 4. Self-Protection

The audit system skips:
- `AuditLog` entities (to avoid infinite loops)
- Unchanged entities
- Detached entities

### Code Example

```csharp
// When you update an asset:
var asset = await context.Assets.FindAsync(assetId);
asset.Status = AssetStatus.Maintenance;
asset.Location = "Repair Shop";
await context.SaveChangesAsync();

// Automatically creates an audit log:
{
    "TableName": "Asset",
    "RecordId": "asset-id-123",
    "Action": "UPDATE",
    "OldValues": {
        "Status": 1,
        "Location": "Office Building A"
    },
    "NewValues": {
        "Status": 2,
        "Location": "Repair Shop"
    },
    "UserId": "user-id-456",
    "CreatedAt": "2025-01-15T10:30:00Z"
}
```

## API Endpoints

### 1. Get Audit Logs (Paginated)

```http
GET /api/AuditLogs?pageNumber=1&pageSize=50&tableName=Asset&action=UPDATE
Authorization: Bearer {token}
```

**Query Parameters:**
- `pageNumber` (int): Page number (default: 1)
- `pageSize` (int): Items per page (default: 50)
- `tableName` (string): Filter by table name
- `recordId` (string): Filter by record ID
- `action` (string): Filter by action (INSERT/UPDATE/DELETE)
- `userId` (string): Filter by user ID
- `fromDate` (DateTime): Filter from date
- `toDate` (DateTime): Filter to date
- `sortBy` (string): Sort field (default: CreatedAt)
- `sortDescending` (bool): Sort direction (default: true)

**Response:**
```json
{
  "items": [
    {
      "id": "audit-log-id",
      "tableName": "Asset",
      "recordId": "asset-id-123",
      "action": "UPDATE",
      "oldValues": "{\"Status\":1,\"Location\":\"Office\"}",
      "newValues": "{\"Status\":2,\"Location\":\"Repair Shop\"}",
      "userId": "user-id-456",
      "userName": "John Doe",
      "createdAt": "2025-01-15T10:30:00Z"
    }
  ],
  "totalCount": 150,
  "pageNumber": 1,
  "pageSize": 50,
  "totalPages": 3
}
```

### 2. Get Audit Logs for Specific Record

```http
GET /api/AuditLogs/record/Asset/asset-id-123
Authorization: Bearer {token}
```

**Response:**
```json
[
  {
    "id": "log-1",
    "tableName": "Asset",
    "recordId": "asset-id-123",
    "action": "UPDATE",
    "oldValues": "{\"Status\":1}",
    "newValues": "{\"Status\":2}",
    "userId": "user-id-456",
    "userName": "John Doe",
    "createdAt": "2025-01-15T10:30:00Z"
  },
  {
    "id": "log-2",
    "tableName": "Asset",
    "recordId": "asset-id-123",
    "action": "INSERT",
    "newValues": "{\"AssetTag\":\"AST001\",\"Name\":\"Laptop\"}",
    "userId": "user-id-456",
    "userName": "John Doe",
    "createdAt": "2025-01-10T09:00:00Z"
  }
]
```

### 3. Get Audit Log Statistics

```http
GET /api/AuditLogs/stats
Authorization: Bearer {token}
```

**Response:**
```json
{
  "totalLogs": 1523,
  "totalInserts": 450,
  "totalUpdates": 980,
  "totalDeletes": 93,
  "logsByTable": {
    "Asset": 456,
    "Employee": 389,
    "SimCard": 234,
    "SoftwareLicense": 178,
    "Project": 156
  },
  "recentActivity": [
    {
      "id": "log-id",
      "tableName": "Asset",
      "recordId": "asset-123",
      "action": "UPDATE",
      "userId": "user-456",
      "userName": "John Doe",
      "createdAt": "2025-01-15T10:30:00Z"
    }
  ]
}
```

## Access Control

**Only SuperAdmin and Admin roles can access audit logs.**

```csharp
[Authorize(Roles = "SuperAdmin,Admin")]
```

Regular users cannot view the audit trail for security and data integrity reasons.

## Performance Considerations

### Indexing
The audit logs table has indexes on:
- `TableName` - Fast filtering by entity type
- `RecordId` - Quick lookup of specific record history
- `CreatedAt` - Efficient date range queries

### JSON Storage
- Old/New values stored as JSONB in PostgreSQL
- Efficient storage and querying
- Supports complex nested objects

### Async Operations
- All audit operations are async to not block the main request
- Changes are saved in a separate transaction after main save

## Use Cases

### 1. Compliance & Auditing
Track all changes for regulatory compliance:
```http
GET /api/AuditLogs?tableName=Employee&fromDate=2025-01-01&toDate=2025-01-31
```

### 2. Debugging & Support
See complete history of a specific record:
```http
GET /api/AuditLogs/record/Asset/problematic-asset-id
```

### 3. User Activity Monitoring
Track what a specific user has changed:
```http
GET /api/AuditLogs?userId=user-id-123
```

### 4. Data Recovery
Identify when and how data was modified or deleted to help with recovery.

## Configuration

### Enable/Disable Audit Logging

To disable audit logging (not recommended), you can modify the `ApplicationDbContext`:

```csharp
public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
{
    // Skip audit logging
    return await base.SaveChangesAsync(cancellationToken);
}
```

### Exclude Specific Tables

To exclude specific entity types from auditing:

```csharp
private List<AuditEntry> OnBeforeSaveChanges()
{
    // ...
    foreach (var entry in ChangeTracker.Entries())
    {
        // Skip audit log and specific entities
        if (entry.Entity is AuditLog || 
            entry.Entity is SomeEntityToSkip ||
            entry.State == EntityState.Detached || 
            entry.State == EntityState.Unchanged)
            continue;
        // ...
    }
}
```

## Maintenance

### Purging Old Logs

For long-term maintenance, consider purging old audit logs:

```sql
-- Delete audit logs older than 1 year
DELETE FROM "AuditLogs" 
WHERE "CreatedAt" < NOW() - INTERVAL '1 year';
```

### Archiving

For compliance, archive old logs before purging:

```sql
-- Create archive table
CREATE TABLE "AuditLogsArchive" AS 
SELECT * FROM "AuditLogs" 
WHERE "CreatedAt" < NOW() - INTERVAL '1 year';

-- Then delete from main table
DELETE FROM "AuditLogs" 
WHERE "CreatedAt" < NOW() - INTERVAL '1 year';
```

## Testing

### Verify Audit Logging Works

1. **Create a test record:**
```http
POST /api/Assets
{
  "assetTag": "TEST001",
  "name": "Test Asset"
}
```

2. **Check audit log:**
```http
GET /api/AuditLogs?tableName=Asset&recordId={asset-id}
```

3. **Update the record:**
```http
PUT /api/Assets/{asset-id}
{
  "status": 2
}
```

4. **Verify UPDATE was logged:**
```http
GET /api/AuditLogs/record/Asset/{asset-id}
```

5. **Delete the record:**
```http
DELETE /api/Assets/{asset-id}
```

6. **Confirm DELETE was logged:**
```http
GET /api/AuditLogs/record/Asset/{asset-id}
```

## Benefits

✅ **Compliance**: Meet regulatory requirements for change tracking
✅ **Security**: Identify unauthorized changes
✅ **Debugging**: Understand how data reached its current state
✅ **Accountability**: Know who made what changes and when
✅ **Data Recovery**: Restore data based on historical values
✅ **Transparency**: Full audit trail for stakeholders

## Summary

The audit logging feature provides comprehensive, automatic tracking of all database changes in the Salini AMS system. It captures who made changes, what was changed, and when it occurred - all without requiring any additional code in controllers or services. The feature is production-ready, performant, and provides valuable insights for compliance, debugging, and accountability.

