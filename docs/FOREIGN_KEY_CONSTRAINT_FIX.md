# Foreign Key Constraint Fix for Asset Import

## Problem
The asset import was failing with a foreign key constraint violation:
```
{
    "code": "23503",
    "details": "Key is not present in table \"employees\".",
    "hint": null,
    "message": "insert or update on table \"assets\" violates foreign key constraint \"assets_assigned_to_fkey\""
}
```

## Root Cause Analysis
The foreign key constraint violation occurs when:
1. The asset import tries to store an employee ID in `assets.assigned_to` that doesn't exist in the `employees` table
2. This can happen if:
   - Employee lookup finds an employee but the employee ID is invalid/null
   - Employee was deleted after the lookup but before the asset insertion
   - Data corruption or inconsistency in employee records

## Solutions Implemented

### 1. Enhanced Employee Validation
**File:** `components/asset-import-modal.tsx`

**Changes:**
- Added pre-validation of employee assignments before import starts
- Created employee ID set for quick validation
- Added employee code to ID mapping for faster lookups
- Enhanced logging to show available employee codes when lookup fails

### 2. Robust Error Handling
**File:** `components/asset-import-modal.tsx`

**Changes:**
- Added specific handling for foreign key constraint violations (error code 23503)
- If foreign key constraint fails, retry without employee assignment
- Import asset without assignment rather than failing completely
- Provide clear error messages about what went wrong

### 3. Pre-Import Validation
**File:** `components/asset-import-modal.tsx`

**Changes:**
- Validate all employee codes in CSV before starting import
- Show warnings for invalid employee codes
- Display available employee codes for reference

### 4. Diagnostic Tools
**File:** `scripts/diagnose-asset-import-issue.sql`

**Purpose:**
- Comprehensive diagnostic script to identify data integrity issues
- Check foreign key constraints and relationships
- Identify orphaned asset assignments
- Validate employee data integrity

## How It Works Now

### Pre-Import Validation
1. **Load Employees:** Fetch all active employees with their IDs and codes
2. **Create Maps:** Build employee code-to-ID mapping and ID validation set
3. **Validate CSV:** Check all employee codes in CSV against available employees
4. **Show Warnings:** Display any invalid employee codes with available alternatives

### Import Process
1. **Employee Lookup:** Use pre-built maps for fast and reliable employee lookup
2. **ID Validation:** Verify employee ID exists in database before storing
3. **Graceful Fallback:** If foreign key constraint fails, import asset without assignment
4. **Clear Logging:** Show exactly what happened for each asset

### Error Handling
1. **Foreign Key Violation:** Detect error code 23503 (foreign key constraint)
2. **Retry Logic:** Try importing asset without employee assignment
3. **Success Tracking:** Count successful imports even with partial failures
4. **Error Reporting:** Provide detailed error messages for troubleshooting

## Testing the Fix

### 1. Run Diagnostic Script
```sql
-- Run in Supabase SQL editor
-- File: scripts/diagnose-asset-import-issue.sql
```

### 2. Test Asset Import
1. **Prepare CSV:** Include both valid and invalid employee codes
2. **Check Console:** Look for validation warnings before import starts
3. **Monitor Import:** Watch for success/failure messages during import
4. **Verify Results:** Check that assets are imported even with invalid employee codes

### 3. Expected Behavior
- **Valid Employee Codes:** Assets imported with proper employee assignment
- **Invalid Employee Codes:** Assets imported without assignment, with warning messages
- **No Failures:** Import completes successfully even with some invalid assignments

## Console Output Examples

### Successful Import
```
✅ All employee codes in CSV are valid
✅ Resolved employee assignment: EMP001 -> EMP123456789 (EMP001 - John Doe)
📝 Storing asset AST001 with assigned_to: EMP123456789 (employee ID)
```

### Invalid Employee Code
```
⚠️ Found 2 invalid employee codes: ["INVALID001", "MISSING002"]
Available employee codes: EMP001, EMP002, EMP003
❌ Employee not found for code: "INVALID001". Available codes: EMP001, EMP002, EMP003
📝 Storing asset AST002 with assigned_to: INVALID001 (employee code - not found)
```

### Foreign Key Constraint Fallback
```
Foreign key constraint failed for asset AST003, trying without employee assignment: Key is not present in table "employees"
Asset AST003: Imported without employee assignment (employee not found)
```

## Files Modified
- ✅ `components/asset-import-modal.tsx` - Enhanced validation and error handling
- ✅ `scripts/diagnose-asset-import-issue.sql` - Diagnostic script
- ✅ `FOREIGN_KEY_CONSTRAINT_FIX.md` - This documentation

## Next Steps
1. **Test Import:** Try importing assets with both valid and invalid employee codes
2. **Check Console:** Monitor the detailed logging output
3. **Verify Results:** Ensure assets are imported successfully
4. **Fix Employee Data:** If needed, correct any employee data issues identified by the diagnostic script

The asset import should now handle foreign key constraint violations gracefully and provide clear feedback about what went wrong.

