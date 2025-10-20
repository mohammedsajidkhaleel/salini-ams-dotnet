# Supabase Setup Instructions

## Issue Fixed
The project was not persisting data to Supabase tables because the Settings page was using mock data instead of connecting to the database.

## What Was Fixed

1. **Created Database Migrations**: Added `0006_master_data_tables.sql` with all necessary master data tables
2. **Updated Settings Page**: Replaced mock data with Supabase integration
3. **Added Proper Error Handling**: All CRUD operations now include error handling

## Setup Instructions

### 1. Environment Variables
Create a `.env.local` file in your project root with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. Run Database Migrations (Manual Only)
⚠️ **Important**: This project is configured to NOT run migrations automatically to prevent data loss.

Execute migrations manually when you're ready:

```bash
# Check current migration status
npm run db:status

# Create a backup (recommended)
npm run db:backup

# Apply all pending migrations
npm run db:push
```

**See `MIGRATION_GUIDE.md` for detailed instructions on safe migration practices.**

### 3. Verify Tables Created
The following tables should now exist in your Supabase database:
- `projects`
- `vendors`
- `departments`
- `sub_departments`
- `employee_categories`
- `employee_positions`
- `item_categories`
- `nationalities`
- `employee_sponsors`
- `sim_card_plans`
- `asset_models`

### 4. Test the Application
1. Start your development server: `npm run dev`
2. Navigate to the Settings page
3. Try adding, editing, and deleting items in any category
4. Data should now persist to Supabase

## Features Now Working

- ✅ **Add Items**: Create new master data entries
- ✅ **Edit Items**: Update existing entries
- ✅ **Delete Items**: Remove entries from database
- ✅ **Real-time Updates**: UI updates immediately after database operations
- ✅ **Error Handling**: Console logs show any database errors
- ✅ **Loading States**: Shows loading indicator while fetching data

## Troubleshooting

If data is still not persisting:

1. **Check Environment Variables**: Ensure `.env.local` has correct Supabase credentials
2. **Verify Database Connection**: Check browser console for connection errors
3. **Check RLS Policies**: Ensure Row Level Security policies allow your operations
4. **Check Network**: Ensure you can reach your Supabase instance

## Database Schema

All master data tables follow this structure:
- `id` (text, primary key)
- `name` (text, required)
- `description` (text, optional)
- `status` (text, 'active' or 'inactive')
- `created_at` (timestamptz, auto-generated)

Sub-departments additionally have:
- `department_id` (text, foreign key to departments table)
