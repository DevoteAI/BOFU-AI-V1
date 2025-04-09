# System Patterns: BOFU AI

## Overall Architecture
BOFU AI follows a modern React-based single-page application architecture with TypeScript for type safety. The application integrates with Supabase for authentication and database operations.

### Component Structure
1. **Core Application**: Organized around App.tsx as the main container
2. **Component-Based UI**: Modular components for specific functionality
3. **State Management**: React hooks for local state management
4. **Authentication Flow**: Integrated with Supabase auth

## Key Design Patterns

### Authentication Pattern
- Separate workflows for regular users and admin users
- Session management through Supabase
- Auth modals for user login/signup
- Role-based access control (regular vs admin)

### Multi-step Form Pattern
- Sequential step progression through the research process
- State maintenance across steps
- Validation at each step before progression

### Document Processing Pattern
- File upload and management
- Document type recognition
- Processing status tracking
- Preview and management capabilities

### Results Presentation Pattern
- Structured display of AI-generated insights
- Interactive exploration of research results
- Option to save, share, or continue analysis

### Admin Review Pattern
- Dashboard view of submitted research
- Review and approval workflow
- Modification capabilities
- User management interface

## Data Flow

### Research Creation Flow
1. User authenticates
2. User inputs research parameters (documents, links, product lines)
3. Data is submitted for processing
4. Results are generated and displayed
5. User can save or modify research

### Admin Review Flow
1. Admin authenticates
2. Views list of submitted research
3. Selects research for review
4. Approves or modifies research
5. Updates status in database

## State Management
- User authentication state
- Multi-step form state
- Document processing state
- Research history state
- Admin review state

## Error Handling
- Form validation errors
- API request failures
- Processing errors
- Authentication failures

## API Integration
- Supabase for database operations
- Document processing APIs
- Authentication services
- (Possibly) external AI services for analysis 