# Supabase Database Setup

This directory contains database migrations for the XR Awards website.

## Quick Setup (Using Supabase Dashboard)

### Option 1: Run via SQL Editor (Recommended)

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Navigate to **SQL Editor** in the sidebar
3. Open the migration file: `migrations/001_initial_schema.sql`
4. Copy the entire contents
5. Paste into the SQL Editor
6. Click **Run** to execute

This will create:
- ✅ `categories` table with sample data
- ✅ `finalists` table
- ✅ Row Level Security (RLS) policies
- ✅ Indexes for performance
- ✅ Triggers for auto-updating timestamps

### Option 2: Using Supabase CLI (Advanced)

If you have the Supabase CLI installed:

```bash
# Login to Supabase
npx supabase login

# Link to your project
npx supabase link --project-ref your-project-ref

# Run the migration
npx supabase db push
```

## What Gets Created

### Tables

#### `categories`
- `id` (UUID, primary key)
- `name` (text, unique)
- `description` (text)
- `icon` (text - emoji or icon)
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Seed Data:** 8 default categories including Best VR Experience, Best AR Application, etc.

#### `finalists`
- `id` (UUID, primary key)
- `title` (text)
- `description` (text)
- `category_id` (UUID, foreign key → categories)
- `image_url` (text)
- `is_winner` (boolean)
- `year` (integer)
- `created_at` (timestamp)
- `updated_at` (timestamp)

### Security (RLS Policies)

**Public Access:**
- ✅ Anyone can read categories and finalists

**Authenticated Users (Admin):**
- ✅ Create, update, and delete categories
- ✅ Create, update, and delete finalists

### Performance Optimizations

Indexes are created on frequently queried columns:
- Categories: name
- Finalists: category_id, year, is_winner, created_at

## Verify Setup

After running the migration, verify in your Supabase dashboard:

1. **Table Editor** → Check that `categories` and `finalists` tables exist
2. **Table Editor** → Check that 8 categories were created
3. **Authentication** → Create an admin user if you haven't already

## Creating an Admin User

1. Go to **Authentication** → **Users** in Supabase dashboard
2. Click **Add User**
3. Enter email and password
4. Click **Create User**
5. Use these credentials at `/admin/login`

## Troubleshooting

### "relation already exists" error
The tables already exist. You can either:
- Skip this error (it's safe)
- Drop the tables first (⚠️ WARNING: This deletes all data):
  ```sql
  DROP TABLE IF EXISTS finalists CASCADE;
  DROP TABLE IF EXISTS categories CASCADE;
  ```

### "permission denied" error
Make sure you're logged in to Supabase and have the correct project selected.

### RLS blocking queries
If you're testing queries in SQL Editor, use:
```sql
-- Test as authenticated user
SET LOCAL role TO authenticated;
-- Your query here
```

## Next Steps

After setting up the database:

1. ✅ Create an admin user in Supabase Authentication
2. ✅ Configure R2 credentials in `.env`
3. ✅ Start your dev server: `yarn dev`
4. ✅ Login at `/admin/login`
5. ✅ Start managing categories and finalists!

