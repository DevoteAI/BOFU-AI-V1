/*
  # Separate users and admins

  1. New Tables
    - `admin_profiles`
      - `id` (uuid, primary key, references auth.users)
      - `email` (text)
      - `name` (text)
      - `avatar_url` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
  
  2. Modify existing profiles table
    - Rename to `user_profiles`
    - Clear existing admin users

  3. Security
    - Enable RLS on both tables
    - Add appropriate policies
*/

-- First, create the admin_profiles table
CREATE TABLE public.admin_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  name text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for admin_profiles
CREATE POLICY "Admins can view own profile" 
  ON public.admin_profiles 
  FOR SELECT 
  TO authenticated 
  USING (auth.uid() = id);

CREATE POLICY "Admins can update own profile" 
  ON public.admin_profiles 
  FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = id) 
  WITH CHECK (auth.uid() = id);

-- Rename the current profiles table to user_profiles
ALTER TABLE public.profiles RENAME TO user_profiles;

-- Add an index to help with looking up users
CREATE INDEX idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX idx_admin_profiles_email ON public.admin_profiles(email);

-- Add a trigger function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
DECLARE
  is_admin boolean;
BEGIN
  -- Check if the user has admin role in metadata
  is_admin := (new.raw_user_meta_data->>'is_admin')::boolean OR (new.raw_user_meta_data->>'role' = 'admin');
  
  IF is_admin THEN
    -- Insert into admin_profiles if admin
    INSERT INTO public.admin_profiles (id, email, name)
    VALUES (
      new.id,
      new.email,
      new.raw_user_meta_data->>'name'
    );
  ELSE
    -- Insert into user_profiles if regular user
    INSERT INTO public.user_profiles (id, email, company_name)
    VALUES (
      new.id,
      new.email,
      new.raw_user_meta_data->>'company_name'
    );
  END IF;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop old trigger and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create a function to migrate existing users based on metadata
CREATE OR REPLACE FUNCTION migrate_existing_users() 
RETURNS void AS $$
DECLARE
  user_record RECORD;
  is_admin boolean;
BEGIN
  -- For each user in auth.users
  FOR user_record IN SELECT * FROM auth.users
  LOOP
    -- Check if user is admin based on metadata
    is_admin := (user_record.raw_user_meta_data->>'is_admin')::boolean OR 
                (user_record.raw_user_meta_data->>'role' = 'admin');
    
    IF is_admin THEN
      -- Check if already in admin_profiles
      IF NOT EXISTS (SELECT 1 FROM public.admin_profiles WHERE id = user_record.id) THEN
        -- Move to admin_profiles
        INSERT INTO public.admin_profiles (id, email, name, created_at, updated_at)
        VALUES (
          user_record.id,
          user_record.email,
          user_record.raw_user_meta_data->>'name',
          user_record.created_at,
          now()
        );
      END IF;
      
      -- Remove from user_profiles if present
      DELETE FROM public.user_profiles WHERE id = user_record.id;
    ELSE
      -- Check if already in user_profiles
      IF NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE id = user_record.id) THEN
        -- Move to user_profiles
        INSERT INTO public.user_profiles (id, email, company_name, created_at, updated_at)
        VALUES (
          user_record.id,
          user_record.email,
          user_record.raw_user_meta_data->>'company_name',
          user_record.created_at,
          now()
        );
      END IF;
      
      -- Remove from admin_profiles if present
      DELETE FROM public.admin_profiles WHERE id = user_record.id;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Run the migration function
SELECT migrate_existing_users(); 