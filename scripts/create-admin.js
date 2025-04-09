// Script to create the first admin account
// Run with: node scripts/create-admin.js

// Import required libraries
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Configure Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('ERROR: Missing Supabase environment variables.');
  console.error('Please create a .env file with VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Admin account details - change these before running the script
const adminEmail = 'admin@example.com'; // Change this to your admin email
const adminPassword = 'strong-password-here'; // Change this to a secure password
const adminName = 'Admin User'; // Change this to your admin name

async function createAdminAccount() {
  try {
    console.log(`Creating admin account for ${adminEmail}...`);
    
    // First, check if the user already exists
    const { data: existingUsers, error: checkError } = await supabase
      .from('admin_profiles')
      .select('email')
      .eq('email', adminEmail);
      
    if (checkError) {
      throw new Error(`Error checking for existing admin: ${checkError.message}`);
    }
    
    if (existingUsers && existingUsers.length > 0) {
      console.log('Admin user already exists. No action taken.');
      process.exit(0);
    }

    // Create admin account using signUp
    const { data, error } = await supabase.auth.signUp({
      email: adminEmail,
      password: adminPassword,
      options: {
        data: { 
          name: adminName,
          is_admin: true,
          role: 'admin'
        }
      }
    });

    if (error) {
      throw new Error(`Error creating admin: ${error.message}`);
    }

    console.log('Admin account created successfully!');
    console.log('User ID:', data.user.id);
    console.log(`You can now log in with ${adminEmail} and your password.`);
    
    // Check if the user was automatically confirmed (development mode)
    if (data.user && !data.user.email_confirmed_at) {
      console.log('\nNOTE: Email confirmation may be required.');
      console.log('If you need to manually confirm the email, run this SQL in Supabase:');
      console.log(`UPDATE auth.users SET email_confirmed_at = NOW() WHERE email = '${adminEmail}';`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Failed to create admin account:', error.message);
    process.exit(1);
  }
}

createAdminAccount(); 