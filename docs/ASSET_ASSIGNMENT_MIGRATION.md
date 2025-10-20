# Asset Assignment Migration - From assigned_to to employee_assets Table

## Overview

This migration standardizes asset assignment across the system by moving from the direct `assets.assigned_to` field to the `employee_assets` junction table approach. This provides consistency with how accessories, SIM cards, and software licenses are handled.

## Why This Change?

### Problems with the Old Approach
- **Inconsistency**: Assets used `assets.assigned_to` while accessories used `employee_accessories` table
- **Limited Audit Trail**: No tracking of assignment history, return dates, or assignment notes
- **Data Integrity Issues**: Direct foreign key relationships were problematic
- **Scalability**: Hard to add new assignment-related fields

### Benefits of the New Approach
- **Consistency**: All assignment types (assets, accessories, SIM cards, licenses) use the same pattern
- **Better Audit Trail**: Track assignment dates, return dates, status changes, and notes
- **Data Integrity**: Clear separation of concerns between asset data and assignment data
- **Historical Data**: Maintain complete history of all assignments and returns
- **Flexibility**: Easy to add new assignment-related fields without modifying the assets table

## Migration Steps

### 1. Data Migration (Migration 0019)
- Moves existing `assets.assigned_to` data to `employee_assets` table
- Creates proper assignment records with timestamps
- Adds unique constraint to ensure one active assignment per asset
- Preserves all existing assignment data

### 2. Code Updates
Updated the following components to use `employee_assets` table:

#### Employee Report (`components/employee-report.tsx`)
- **Before**: `SELECT * FROM assets WHERE assigned_to = employee_id`
- **After**: `SELECT * FROM employee_assets WHERE employee_id = ? AND status = 'assigned'`

#### Employee Assets Modal (`components/employee-assets-modal.tsx`)
- **Before**: Direct query to assets table with assigned_to filter
- **After**: Join with employee_assets table to get assignment details

#### Quick Assign Modal (`components/quick-assign-modal.tsx`)
- **Before**: `UPDATE assets SET assigned_to = employee_id`
- **After**: `INSERT INTO employee_assets (employee_id, asset_id, status)`

#### Asset Form (`app/assets/page.tsx`)
- **Before**: Store employee ID directly in assets.assigned_to
- **After**: Create/update records in employee_assets table

#### Asset Import (`components/asset-import-modal.tsx`)
- **Before**: Import employee assignments directly to assets.assigned_to
- **After**: Import assets first, then create employee_assets records

### 3. Schema Cleanup (Migration 0020)
- Removes `assigned_to` field from assets table
- Drops related foreign key constraints and indexes
- Cleans up the schema

## Database Schema Changes

### Before
```sql
-- Assets table with direct assignment
CREATE TABLE assets (
  id uuid PRIMARY KEY,
  asset_tag text UNIQUE,
  name text,
  assigned_to text REFERENCES employees(id), -- Direct assignment
  -- other fields...
);

-- Only accessories used junction table
CREATE TABLE employee_accessories (
  employee_id text REFERENCES employees(id),
  accessory_id uuid REFERENCES accessories(id),
  assigned_date timestamptz,
  returned_date timestamptz,
  status text,
  -- other fields...
);
```

### After
```sql
-- Assets table without assignment field
CREATE TABLE assets (
  id uuid PRIMARY KEY,
  asset_tag text UNIQUE,
  name text,
  -- assigned_to field removed
  -- other fields...
);

-- All assignments use junction tables
CREATE TABLE employee_assets (
  id uuid PRIMARY KEY,
  employee_id text REFERENCES employees(id),
  asset_id uuid REFERENCES assets(id),
  assigned_date timestamptz,
  returned_date timestamptz,
  status text CHECK (status IN ('assigned', 'returned')),
  notes text,
  created_at timestamptz,
  created_by uuid REFERENCES auth.users(id)
);

-- Unique constraint ensures one active assignment per asset
CREATE UNIQUE INDEX idx_employee_assets_unique_active_assignment 
ON employee_assets(asset_id) 
WHERE status = 'assigned';
```

## Query Examples

### Get Assets Assigned to an Employee
```sql
-- Old way
SELECT * FROM assets WHERE assigned_to = 'employee_id';

-- New way
SELECT a.*, ea.assigned_date, ea.notes
FROM assets a
JOIN employee_assets ea ON a.id = ea.asset_id
WHERE ea.employee_id = 'employee_id' 
  AND ea.status = 'assigned';
```

### Assign an Asset to an Employee
```sql
-- Old way
UPDATE assets SET assigned_to = 'employee_id' WHERE id = 'asset_id';

-- New way
INSERT INTO employee_assets (employee_id, asset_id, assigned_date, status)
VALUES ('employee_id', 'asset_id', NOW(), 'assigned');
```

### Unassign an Asset
```sql
-- Old way
UPDATE assets SET assigned_to = NULL WHERE id = 'asset_id';

-- New way
UPDATE employee_assets 
SET status = 'returned', returned_date = NOW()
WHERE asset_id = 'asset_id' AND status = 'assigned';
```

## Testing Checklist

- [ ] Employee print reports show assigned assets correctly
- [ ] Quick assign modal can assign assets to employees
- [ ] Employee assets modal shows assigned assets
- [ ] Asset form can assign/unassign employees
- [ ] Asset import creates proper employee assignments
- [ ] Asset unassignment works correctly
- [ ] No duplicate assignments are possible
- [ ] Historical assignment data is preserved

## Rollback Plan

If issues arise, the migration can be rolled back by:

1. **Restore assigned_to field**:
   ```sql
   ALTER TABLE assets ADD COLUMN assigned_to text REFERENCES employees(id);
   ```

2. **Migrate data back**:
   ```sql
   UPDATE assets 
   SET assigned_to = ea.employee_id
   FROM employee_assets ea
   WHERE assets.id = ea.asset_id 
     AND ea.status = 'assigned';
   ```

3. **Revert code changes** to use the old approach

## Benefits Realized

1. **Consistency**: All assignment types now follow the same pattern
2. **Audit Trail**: Complete history of all asset assignments and returns
3. **Data Integrity**: Better foreign key relationships and constraints
4. **Scalability**: Easy to add new assignment-related features
5. **Maintainability**: Cleaner separation of concerns

## Future Enhancements

With the new structure, we can easily add:
- Assignment approval workflows
- Temporary assignments with automatic return dates
- Assignment notes and comments
- Assignment history reports
- Bulk assignment operations
- Assignment notifications and alerts
