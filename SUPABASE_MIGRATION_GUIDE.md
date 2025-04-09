# Supabase Migration Guide for BOFU AI

You're encountering a 400 (Bad Request) error when accessing the `user_profiles` table, which indicates that the required database tables haven't been properly set up in your Supabase project. Here's how to fix it:

## Step 1: Access Supabase SQL Editor

1. Go to your [Supabase dashboard](https://app.supabase.com/)
2. Select your project for BOFU AI
3. In the left sidebar, click on "SQL Editor"

## Step 2: Run the User/Admin Separation Migration

1. Create a new SQL query by clicking the "+" button
2. Copy the entire contents of this file from your project:
   `supabase/migrations/20250615000000_separate_users_admins.sql`
3. Paste it into the SQL Editor
4. Click "Run" to execute the migration

This migration:
- Creates a new `admin_profiles` table
- Renames the existing `profiles` table to `user_profiles`
- Sets up the necessary triggers and functions

## Step 3: Run the Approved Products Migration

1. Create another new SQL query
2. Copy the entire contents of this file:
   `supabase_schema_update.sql`
3. Paste it into the SQL Editor
4. Click "Run" to execute this migration

This sets up:
- The `approved_products` table
- Necessary indexes for performance
- Triggers for timestamp updates

## Step 4: Verify the Migration

After running both migrations:

1. Return to your BOFU AI application
2. Click the "Debug Database" button again in the Admin Dashboard
3. You should now see a success message indicating the tables were found

## Troubleshooting

If you still encounter issues:

1. Check the browser console for specific error messages
2. In the Supabase dashboard, go to "Database" → "Tables" to verify the tables exist
3. Try creating a test user through the Supabase Auth UI to ensure the triggers are working

## Manual User Creation (If Needed)

If you need to create an admin user manually:

1. First, create a user through Supabase Auth:
   - Go to "Authentication" → "Users" → "Add User"
   - Enter email and password
   
2. Then modify the user's metadata:
   - Find the user in the list
   - Click on the user to edit
   - In the "Metadata" section, add: `{"is_admin": true}` or `{"role": "admin"}`
   - Save changes

3. Manually insert the admin profile:
   - Go to SQL Editor
   - Run:
     ```sql
     INSERT INTO public.admin_profiles (id, email, name, created_at, updated_at)
     VALUES (
       '[USER_UUID]',  -- Replace with the actual UUID from Auth
       'admin@example.com',  -- Replace with the admin email
       'Admin User',
       now(),
       now()
     );
     ``` 