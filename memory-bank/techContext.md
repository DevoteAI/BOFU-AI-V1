# Technical Context: BOFU AI

## Technology Stack

### Frontend
- **Framework**: React with TypeScript
- **Build Tool**: Vite
- **UI Animation**: Framer Motion
- **Styling**: Tailwind CSS
- **Notifications**: React Hot Toast
- **PDF Processing**: PDF.js worker

### Backend/Infrastructure
- **Authentication & Database**: Supabase
- **Database Type**: PostgreSQL (via Supabase)
- **Storage**: Supabase Storage (likely for document storage)

### Development Tools
- **Package Manager**: npm
- **Code Quality**: ESLint
- **Type Checking**: TypeScript
- **Version Control**: Git

## Key Dependencies
Based on project structure and analysis:

- **@supabase/supabase-js**: Core client library for Supabase
- **framer-motion**: For UI animations and transitions
- **react-hot-toast**: For user notifications
- **dotenv**: For environment variable management

## Development Setup

### Environment Requirements
- Node.js (version likely specified in package.json)
- npm package manager
- Supabase account and project

### Environment Variables
- `VITE_SUPABASE_URL`: Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Supabase anonymous key

### Local Development
```bash
npm install
npm run dev
```
- Development server typically runs on http://localhost:5173

## Deployment Considerations
- Frontend likely deployable to static hosting platforms
- Database migrations required for Supabase setup
- Environment variables management for production

## Database Schema
- **user_profiles**: Regular user information
- **admin_profiles**: Admin user information
- **research_results**: Product research results
- **approved_products**: Products approved by users

## Authentication Flow
- Supabase Auth for user management
- Separate authentication flows for regular and admin users
- Session management via Supabase

## API Integration
- Supabase API for database operations
- Document processing potentially using external services
- PDF parsing using PDF.js

## Performance Considerations
- Document processing may be resource-intensive
- Research history loading efficiency
- Results rendering performance

## Security Considerations
- Role-based access control
- Secure document handling
- API authentication
- Proper environment variable management 