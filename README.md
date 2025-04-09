# BOFU AI - Product Research Tool

BOFU AI is a powerful tool for AI-driven product research and competitive analysis.

## Database Setup for User Management

This application uses Supabase for user authentication and data storage. It maintains separate tables for regular users and admin users.

### Database Schema

The database has the following structure:

1. **User Profiles Table (`user_profiles`)**
   - Stores regular user information
   - Contains fields for company name, email, etc.

2. **Admin Profiles Table (`admin_profiles`)**
   - Stores admin user information
   - Contains fields for name, email, etc.

3. **Research Results Table (`research_results`)**
   - Stores product research results
   - Contains product analysis data

4. **Approved Products Table (`approved_products`)**
   - Stores products approved by users
   - Contains review status information

### Setting Up the Database

1. Run the database migrations in Supabase:
   - The migrations are located in the `supabase/migrations` directory
   - They should be executed in numerical order

2. To apply migrations manually through the Supabase UI:
   - Go to SQL Editor in the Supabase dashboard
   - Copy the content of each migration file
   - Execute them in order

### Creating the First Admin Account

To create the first admin account, use the provided script:

1. Edit the admin details in `scripts/create-admin.js`:
   ```javascript
   const adminEmail = 'admin@example.com'; // Change this
   const adminPassword = 'strong-password-here'; // Change this
   const adminName = 'Admin User'; // Change this
   ```

2. Install the required dependencies:
   ```bash
   npm install dotenv @supabase/supabase-js
   ```

3. Create a `.env` file with your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Run the script:
   ```bash
   node scripts/create-admin.js
   ```

## Admin Dashboard Features

The admin dashboard allows administrators to:

1. View all registered users
2. See product cards submitted by users
3. Review and approve product cards
4. Edit product cards with the same interface as users

## Regular User Features

Regular users can:

1. Create and manage product research
2. Approve and submit product cards for admin review
3. View and edit their own product cards

## Development

To run the application locally:

```bash
npm install
npm run dev
```

The application will be available at http://localhost:5173.