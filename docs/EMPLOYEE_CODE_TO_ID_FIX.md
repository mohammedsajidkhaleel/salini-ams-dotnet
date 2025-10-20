# Employee Code to ID Mapping Fix

## Problem Identified
The asset import was incorrectly trying to save employee **codes** directly into the `assets.assigned_to` field, which expects employee **IDs**. This caused foreign key constraint violations because:

- CSV `assigned_to` field contains employee **codes** (e.g., "EMP001")
- Database `assets.assigned_to` field expects employee **IDs** (e.g., "EMP123456789")
- The foreign key constraint `assets_assigned_to_fkey` references `employees.id`, not `employees.code`

## Root Cause
The asset import logic had a fallback that stored the employee code when the employee wasn't found, instead of storing `null`. This caused the foreign key constraint violation.

### Before Fix (Incorrect)
```javascript
if (assignedEmployeeId) {
  assetData.assigned_to = assignedEmployeeId  // ✅ Correct: stores employee ID
} else if (asset.assigned_to && asset.assigned_to.trim()) {
  assetData.assigned_to = asset.assigned_to.trim()  // ❌ Wrong: stores employee code
}
```

### After Fix (Correct)
```javascript
if (assignedEmployeeId) {
  assetData.assigned_to = assignedEmployeeId  // ✅ Correct: stores employee ID
} else {
  // ✅ Correct: stores null instead of employee code
  console.log(`📝 Storing asset ${asset.asset_tag} with assigned_to: null (employee code "${asset.assigned_to}" not found)`)
}
```

## How It Works Now

### 1. Employee Lookup Process
1. **CSV Processing:** Read `assigned_to` field from CSV (contains employee code like "EMP001")
2. **Code Mapping:** Use `employeeCodeMap.get(employee_code)` to find employee ID
3. **ID Validation:** Verify employee ID exists in database
4. **Storage:** Store employee ID in `assets.assigned_to` field (not the code)

### 2. Database Relationship
```sql
-- CSV data
assigned_to: "EMP001" (employee code)

-- Database lookup
employees.code = "EMP001" → employees.id = "EMP123456789"

-- Asset storage
assets.assigned_to = "EMP123456789" (employee ID)
```

### 3. Foreign Key Constraint
```sql
assets.assigned_to (text) → employees.id (text)
```

## Expected Behavior

### Valid Employee Code
```
CSV: assigned_to = "EMP001"
Lookup: EMP001 → EMP123456789
Storage: assets.assigned_to = "EMP123456789"
Result: ✅ Asset linked to employee
```

### Invalid Employee Code
```
CSV: assigned_to = "INVALID001"
Lookup: INVALID001 → null
Storage: assets.assigned_to = null
Result: ✅ Asset imported without assignment
```

## Console Output Examples

### Successful Employee Resolution
```
✅ Resolved employee assignment: EMP001 (code) -> EMP123456789 (ID) (EMP001 - John Doe)
📝 Storing asset AST001 with assigned_to: EMP123456789 (employee ID)
```

### Employee Not Found
```
❌ Employee not found for code: "INVALID001". Available codes: EMP001, EMP002, EMP003
📝 Storing asset AST002 with assigned_to: null (employee code "INVALID001" not found)
```

## Testing the Fix

### 1. Run Test Script
```sql
-- Run in Supabase SQL editor
-- File: scripts/test-employee-code-to-id-mapping.sql
```

### 2. Test Asset Import
1. **Prepare CSV:** Include valid employee codes in `assigned_to` column
2. **Check Console:** Look for successful employee resolution messages
3. **Verify Database:** Check that `assets.assigned_to` contains employee IDs, not codes
4. **Test Relationships:** Verify foreign key relationships work correctly

### 3. Expected Results
- Assets with valid employee codes are properly linked to employees
- Assets with invalid employee codes are imported without assignment
- No foreign key constraint violations occur
- Console shows clear feedback about the resolution process

## Files Modified
- ✅ `components/asset-import-modal.tsx` - Fixed employee code to ID mapping logic
- ✅ `scripts/test-employee-code-to-id-mapping.sql` - Test script for validation
- ✅ `EMPLOYEE_CODE_TO_ID_FIX.md` - This documentation

## Key Changes Made

### 1. Removed Incorrect Fallback
- **Before:** Stored employee code when employee not found
- **After:** Stores `null` when employee not found

### 2. Enhanced Logging
- **Before:** Unclear what was being stored
- **After:** Clear indication of code → ID resolution

### 3. Added Comments
- **Before:** Logic was unclear
- **After:** Clear comments explaining the mapping process

## Verification Steps
1. **Check Employee Data:** Ensure employees have valid codes and IDs
2. **Test Import:** Import assets with valid employee codes
3. **Verify Storage:** Check that `assets.assigned_to` contains employee IDs
4. **Test Relationships:** Verify foreign key constraints work
5. **Check Console:** Monitor detailed logging output

The asset import should now correctly map employee codes to employee IDs and store the proper foreign key values in the database.

