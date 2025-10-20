# Asset Edit Foreign Key Constraint Fix

## Problem Description
When editing assets, users encountered a foreign key constraint error:
```
{
    "code": "23503",
    "details": "Key is not present in table \"employees\".",
    "hint": null,
    "message": "insert or update on table \"assets\" violates foreign key constraint \"assets_assigned_to_fkey\""
}
```

## Root Cause Analysis

### The Issue
The asset form was storing the employee display string (e.g., "EMP001 - John Doe") in the `assignedEmployee` field, but the database `assets.assigned_to` field expects an employee ID (e.g., "EMP123456789").

### Code Flow Analysis
1. **Asset Form** (`components/asset-form.tsx`):
   - User selects employee from dropdown
   - Form stores `${employee.code} - ${employee.name}` in `assignedEmployee` field
   - This display string was being sent to the database

2. **Assets Page** (`app/assets/page.tsx`):
   - `handleSubmit` function directly uses `assetData.assignedEmployee` as `assigned_to` value
   - Database receives display string instead of employee ID

3. **Database Constraint**:
   - `assets.assigned_to` has foreign key constraint to `employees.id`
   - Display string "EMP001 - John Doe" doesn't exist in `employees.id`
   - Foreign key constraint violation occurs

## Solution Implemented

### 1. Updated Asset Interface
Added a new field to separate employee ID from display string:
```typescript
interface Asset {
  // ... other fields
  assignedEmployee: string; // This contains the employee ID
  assignedEmployeeDisplay?: string; // This contains the display string
  // ... other fields
}
```

### 2. Fixed Asset Form Component
**Before (Incorrect)**:
```typescript
const handleEmployeeSelect = (employee: Employee) => {
  setFormData((prev) => ({ 
    ...prev, 
    assignedEmployee: `${employee.code} - ${employee.name}` // ❌ Storing display string
  }));
};
```

**After (Correct)**:
```typescript
const handleEmployeeSelect = (employee: Employee) => {
  setFormData((prev) => ({ 
    ...prev, 
    assignedEmployee: employee.id, // ✅ Store the employee ID
    assignedEmployeeDisplay: `${employee.code} - ${employee.name}` // ✅ Store the display string
  }));
};
```

### 3. Enhanced Form Validation
Added validation to prevent invalid employee assignments:
```typescript
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  
  // Validate employee assignment
  if (formData.assignedEmployee && !formData.assignedEmployeeDisplay) {
    alert("Please select a valid employee from the dropdown list.");
    return;
  }
  
  // If employee is assigned but no ID is stored, it means the user typed manually
  if (formData.assignedEmployeeDisplay && !formData.assignedEmployee) {
    alert("Please select an employee from the dropdown list instead of typing manually.");
    return;
  }
  
  onSubmit(formData);
};
```

### 4. Updated Data Mapping
Enhanced the `mapAssetData` function to properly handle both employee ID and display string:
```typescript
const mapAssetData = (a: any): Asset => {
  // ... existing code
  
  // Resolve assigned employee ID and display
  let assignedEmployeeId = ""
  let assignedEmployeeDisplay = ""
  
  if (a.assigned_employee) {
    // Use joined employee data if available
    assignedEmployeeId = a.assigned_employee.id
    assignedEmployeeDisplay = `${a.assigned_employee.code} - ${a.assigned_employee.name}`
  } else if (a.assigned_to) {
    // Check if assigned_to contains employee ID or legacy display format
    if (typeof a.assigned_to === 'string' && a.assigned_to.includes(' - ')) {
      // Legacy format where assigned_to contains "CODE - NAME"
      assignedEmployeeDisplay = a.assigned_to
      assignedEmployeeId = "" // We don't have the ID in this case
    } else {
      // assigned_to contains employee ID
      assignedEmployeeId = a.assigned_to
      assignedEmployeeDisplay = "" // We'll need to look up the display name
    }
  }

  return {
    // ... other fields
    assignedEmployee: assignedEmployeeId, // Store the employee ID
    assignedEmployeeDisplay: assignedEmployeeDisplay, // Store the display string
    // ... other fields
  }
}
```

### 5. Updated Display Components
Modified asset table to show the display string instead of employee ID:
```typescript
// Before
<TableCell>{asset.assignedEmployee || "-"}</TableCell>

// After
<TableCell>{asset.assignedEmployeeDisplay || asset.assignedEmployee || "-"}</TableCell>
```

## Files Modified

1. **`components/asset-form.tsx`**:
   - Updated Asset interface
   - Fixed employee selection logic
   - Added form validation
   - Enhanced search handling

2. **`app/assets/page.tsx`**:
   - Updated Asset interface
   - Enhanced mapAssetData function
   - Improved employee ID/display handling

3. **`components/asset-table.tsx`**:
   - Updated Asset interface
   - Fixed display logic
   - Enhanced search functionality

## Testing the Fix

### 1. Test Asset Creation
1. Go to Assets page
2. Click "Add Asset"
3. Fill in required fields
4. Select an employee from the dropdown
5. Save the asset
6. Verify no foreign key constraint error occurs

### 2. Test Asset Editing
1. Go to Assets page
2. Click "Edit" on an existing asset
3. Change the assigned employee
4. Save the changes
5. Verify no foreign key constraint error occurs

### 3. Test Validation
1. Try to type an employee name manually instead of selecting from dropdown
2. Verify validation error appears
3. Select employee from dropdown instead
4. Verify form submits successfully

## Database Verification

After the fix, you can verify the data integrity:

```sql
-- Check that assigned_to contains valid employee IDs
SELECT 
    a.asset_tag,
    a.name as asset_name,
    a.assigned_to as employee_id,
    e.code as employee_code,
    e.name as employee_name
FROM assets a
JOIN employees e ON a.assigned_to = e.id
WHERE a.assigned_to IS NOT NULL
ORDER BY a.asset_tag;
```

## Backward Compatibility

The fix maintains backward compatibility with existing data:
- Legacy assets with display strings in `assigned_to` are handled gracefully
- New assets will use proper employee IDs
- Display functionality works for both old and new data formats

## Prevention Measures

1. **Form Validation**: Prevents users from manually typing employee names
2. **Dropdown Selection**: Forces users to select from valid employee list
3. **Clear Error Messages**: Guides users to correct behavior
4. **Data Separation**: Separates display data from database IDs

## Conclusion

The foreign key constraint error has been resolved by:
1. Properly separating employee ID from display string
2. Storing employee IDs in the database instead of display strings
3. Adding validation to prevent invalid assignments
4. Maintaining backward compatibility with existing data

The asset editing functionality now works correctly without foreign key constraint violations.
