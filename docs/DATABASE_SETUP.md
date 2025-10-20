# Database Setup Guide

## Issue: Database Timeout Error

You're experiencing a database timeout error because Supabase is not configured. The application is trying to connect to an undefined database URL, causing the 5-second timeout.

## Quick Fix

### 1. Create Environment File

Create a `.env.local` file in your project root with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 2. Get Your Supabase Credentials

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Create a new project or select an existing one
3. Go to **Settings** > **API**
4. Copy the **Project URL** and **anon/public key**
5. Replace the values in your `.env.local` file

### 3. Apply Database Migrations

Run the database migrations to create the necessary tables:

```bash
# If you have Supabase CLI installed
supabase db push

# Or manually run the SQL files in supabase/migrations/ in your Supabase dashboard
```

### 4. Restart Development Server

```bash
npm run dev
```

## What's Fixed

✅ **Better Error Handling**: The application now detects when Supabase is not configured and provides helpful error messages

✅ **Mock Data Fallback**: When the database is not available, items are added to the UI as mock data so you can continue testing

✅ **Clear Instructions**: Console messages now guide you through the setup process

✅ **Timeout Prevention**: The application checks for configuration before attempting database operations

## Current Behavior

- **Without Supabase**: Items are added to the UI as mock data with clear warnings
- **With Supabase**: Items are properly saved to the database
- **On Timeout**: Items are added to UI with helpful error messages

## Next Steps

1. Set up your Supabase project
2. Configure the environment variables
3. Run the database migrations
4. Test adding nationalities again

The application will work in both modes, but with Supabase configured, your data will persist between sessions.


