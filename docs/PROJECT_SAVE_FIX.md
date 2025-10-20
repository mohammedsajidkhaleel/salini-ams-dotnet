# Project ID Save Fix for Asset Editing

## Problem Description
When editing assets, the project ID was not being saved to the database. Users could select a project in the dropdown, but the selection would not persist after saving the asset.

## Root Cause Analysis

### The Issue
The problem was in the `mapAssetData` function in `app/assets/page.tsx`. When loading assets from the database, the function was mapping the project data to `project_id` and `project_name` fields, but it was not setting the `project` field that the form expects.

### Code Flow Analysis
1. **Database Query**: Assets are loaded with project data via JOIN
2. **Data Mapping**: `mapAssetData` function maps database fields to UI Asset interface
3. **Form Initialization**: Asset form expects `asset.project` field to populate the dropdown
4. **Missing Field**: The `project` field was not being set in the mapped data
5. **Form Submission**: Form submits with empty project field

### Before Fix (Incorrect)
```typescript
return {
  // ... other fields
  project_id: a.project_id,        // ✅ Database field
  project_name: a.projects?.name,  // ✅ Display field
  // ❌ Missing: project field for form
}
```

### After Fix (Correct)
```typescript
return {
  // ... other fields
  project: a.project_id || "",     // ✅ Form field
  project_id: a.project_id,        // ✅ Database field
  project_name: a.projects?.name,  // ✅ Display field
}
```

## Solution Implemented

### 1. Fixed Data Mapping
Updated the `mapAssetData` function to include the `project` field:

```typescript
return {
  id: a.id,
  assetTag: a.asset_tag,
  assetName: a.name,
  serialNumber: a.serial_number ?? parsedData?.serial_no ?? "",
  item: a.category ?? parsedData?.item ?? "",
  assignedEmployee: assignedEmployeeId,
  assignedEmployeeDisplay: assignedEmployeeDisplay,
  project: a.project_id || "", // ✅ Added this line
  status: a.status,
  condition: a.condition ?? parsedData?.condition ?? "excellent",
  poNumber: "",
  description: parsedData ? `Imported: ${parsedData.item} (${parsedData.serial_no})` : (a.description ?? ""),
  project_id: a.project_id,
  project_name: a.projects?.name,
}
```

### 2. Enhanced Form Initialization
Updated the asset form to handle both `project` and `project_id` fields:

```typescript
setFormData({
  // ... other fields
  project: asset.project || asset.project_id || "", // ✅ Fallback logic
  // ... other fields
});
```

### 3. Added Debug Logging
Added comprehensive logging to help diagnose issues:

```typescript
// In asset form
console.log("🔍 Asset form received asset data:", asset)
console.log("🔍 Asset project_id:", asset.project_id)
console.log("🔍 Asset project field:", asset.project)

// In form submission
console.log("🔍 Form submitting with data:", formData)
console.log("🔍 Project field being submitted:", formData.project)

// In assets page
console.log("🔍 Updating asset with payload:", payload)
console.log("🔍 Project field from form:", assetData.project)
console.log("🔍 Project ID being saved:", assetData.project || null)
```

## Files Modified

1. **`app/assets/page.tsx`**:
   - Fixed `mapAssetData` function to include `project` field
   - Added debug logging to `handleSubmit` function

2. **`components/asset-form.tsx`**:
   - Enhanced form initialization to handle both `project` and `project_id` fields
   - Added debug logging to form submission

## Testing the Fix

### Manual Testing Steps

1. **Test Asset Creation with Project**:
   - Create a new asset
   - Select a project from the dropdown
   - Save the asset
   - Verify project assignment in database

2. **Test Asset Editing - Project Assignment**:
   - Edit an existing asset
   - Change the project selection
   - Save the changes
   - Verify project assignment is updated in database

3. **Test Asset Editing - Project Removal**:
   - Edit an asset that has a project assigned
   - Select "Select Project (Optional)" to remove assignment
   - Save the changes
   - Verify project_id is set to null in database

4. **Test Asset Editing - Load Existing Project**:
   - Edit an asset that already has a project assigned
   - Verify the correct project is selected in the dropdown
   - Make no changes and save
   - Verify project assignment is preserved

### Database Verification

After testing, verify the data integrity:

```sql
-- Check current project assignments
SELECT 
    a.asset_tag,
    a.name as asset_name,
    a.project_id,
    p.name as project_name
FROM assets a
LEFT JOIN projects p ON a.project_id = p.id
WHERE a.project_id IS NOT NULL
ORDER BY a.asset_tag;

-- Check for any orphaned assignments
SELECT 
    a.asset_tag,
    a.name as asset_name,
    a.project_id
FROM assets a
LEFT JOIN projects p ON a.project_id = p.id
WHERE a.project_id IS NOT NULL 
AND p.id IS NULL;
```

## Debug Information

### Console Logs to Watch For

When editing an asset, you should see these console logs:

1. **Asset Form Loading**:
   ```
   🔍 Asset form received asset data: {id: "...", project_id: "...", ...}
   🔍 Asset project_id: "PROJECT_123"
   🔍 Asset project field: "PROJECT_123"
   ```

2. **Form Submission**:
   ```
   🔍 Form submitting with data: {project: "PROJECT_123", ...}
   🔍 Project field being submitted: "PROJECT_123"
   ```

3. **Database Update**:
   ```
   🔍 Updating asset with payload: {project_id: "PROJECT_123", ...}
   🔍 Project field from form: "PROJECT_123"
   🔍 Project ID being saved: "PROJECT_123"
   ```

### Troubleshooting

If the issue persists:

1. **Check Console Logs**: Look for the debug messages above
2. **Verify Database**: Check if `project_id` field exists in assets table
3. **Check Foreign Key**: Verify foreign key constraint to projects table
4. **Test Manually**: Use the provided SQL test script

## Expected Results

After the fix:

1. ✅ **Asset Form Loading**: Existing project assignments are properly loaded
2. ✅ **Project Selection**: Users can change project assignments
3. ✅ **Project Persistence**: Project assignments are saved to database
4. ✅ **Project Removal**: Users can remove project assignments
5. ✅ **Data Integrity**: No orphaned project assignments

## Conclusion

The project ID save issue has been resolved by:

1. **Fixing Data Mapping**: Added missing `project` field in `mapAssetData` function
2. **Enhancing Form Logic**: Improved form initialization with fallback logic
3. **Adding Debug Logging**: Comprehensive logging for troubleshooting
4. **Maintaining Compatibility**: Preserved existing functionality

The asset editing functionality now properly saves project assignments to the database, allowing users to assign and manage assets by project effectively.
