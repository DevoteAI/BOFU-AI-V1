/*
  # Disable Email Verification Requirement
  
  1. Changes
    - Set default value for email_confirmed_at to NOW() to auto-confirm emails
    - Update existing users to have confirmed emails
    - This removes the need for email verification entirely
*/

-- Disable email confirmation requirement for all users
ALTER TABLE auth.users
ALTER COLUMN email_confirmed_at
SET DEFAULT NOW();

-- Update existing unconfirmed users to be confirmed
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL; 