/*
  # Fix handle_new_user trigger function
  
  1. Changes
    - Update the handle_new_user function to insert company_name instead of full_name
    - This fixes the "Database error saving new user" issue during signup
*/

-- Update function to handle user creation with company_name
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, company_name)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'company_name'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 