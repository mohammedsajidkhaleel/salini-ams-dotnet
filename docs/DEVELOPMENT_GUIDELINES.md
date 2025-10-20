# Development Guidelines for IT Asset Management System

## Project Architecture Overview

### Technology Stack
- **Frontend**: Next.js 14 with TypeScript
- **Backend**: Supabase (PostgreSQL + Auth + Real-time)
- **UI Components**: shadcn/ui with Tailwind CSS
- **State Management**: React Context + Local State
- **Database**: PostgreSQL via Supabase

### Project Structure
```
├── app/                    # Next.js App Router pages
├── components/             # Reusable React components
├── lib/                    # Utility functions and services
├── contexts/               # React Context providers
├── hooks/                  # Custom React hooks
├── supabase/              # Database migrations and config
├── scripts/               # Database scripts and utilities
├── docs/                  # All documentation files
└── public/                # Static assets
```

## Component Architecture Patterns

### Page Components (`app/` directory)
- Use Next.js App Router structure
- Include `ProtectedRoute` wrapper for authentication
- Follow naming: `page.tsx` for routes, descriptive names for sub-routes
- Example: `app/assets/page.tsx`, `app/employees/page.tsx`

### Reusable Components (`components/` directory)
- **UI Components**: Basic UI elements in `components/ui/`
- **Feature Components**: Business logic components
- **Modal Components**: Form and dialog components
- **Table Components**: Data display components

### Naming Conventions
- **Components**: PascalCase (e.g., `AssetTable.tsx`)
- **Files**: kebab-case for utilities, PascalCase for components
- **Functions**: camelCase
- **Constants**: UPPER_SNAKE_CASE

## Database Patterns

### Table Structure
- **Primary Keys**: UUID for most tables, text for reference tables
- **Foreign Keys**: Consistent naming with `_id` suffix
- **Audit Fields**: `created_at`, `created_by`, `updated_at`
- **Soft Deletes**: Use `status` field instead of hard deletes

### Migration Patterns
- **File Naming**: `00XX_descriptive_name.sql`
- **Comments**: Include purpose and changes made
- **Rollback**: Consider rollback scenarios
- **Indexes**: Add performance indexes for foreign keys

### Common Table Patterns
```sql
-- Master Data Tables
CREATE TABLE table_name (
  id text PRIMARY KEY,
  name text NOT NULL,
  status text CHECK (status IN ('active','inactive')) DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Assignment Tables (Junction Tables)
CREATE TABLE employee_assets (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id text REFERENCES employees(id),
  asset_id uuid REFERENCES assets(id),
  assigned_date timestamptz DEFAULT now(),
  returned_date timestamptz,
  status text CHECK (status IN ('assigned','returned')) DEFAULT 'assigned',
  notes text,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);
```

## Service Layer Patterns

### Service Classes (`lib/` directory)
- **Data Services**: Handle database operations
- **API Services**: Handle external API calls
- **Utility Services**: Common business logic

### Example Service Pattern
```typescript
// lib/assetService.ts
export class AssetService {
  static async getAssets(filters?: AssetFilters): Promise<Asset[]> {
    // Implementation
  }
  
  static async createAsset(assetData: CreateAssetData): Promise<Asset> {
    // Implementation
  }
  
  static async updateAsset(id: string, updates: Partial<Asset>): Promise<Asset> {
    // Implementation
  }
}
```

## Component Development Patterns

### Form Components
- Use controlled components with React state
- Include validation and error handling
- Follow consistent form structure
- Example: `components/asset-form.tsx`

### Table Components
- Include pagination, sorting, filtering
- Use consistent column structure
- Include action buttons (edit, delete, view)
- Example: `components/asset-table.tsx`

### Modal Components
- Use shadcn/ui Dialog component
- Include proper form handling
- Handle loading states
- Example: `components/asset-import-modal.tsx`

### Data Loading Patterns
```typescript
// Standard data loading pattern
const [data, setData] = useState<DataType[]>([])
const [loading, setLoading] = useState(false)

useEffect(() => {
  const loadData = async () => {
    setLoading(true)
    try {
      const result = await Service.getData()
      setData(result)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }
  loadData()
}, [])
```

## Authentication & Authorization

### Protected Routes
- Wrap pages with `ProtectedRoute` component
- Check user authentication status
- Handle loading states

### User Context
- Use `useAuth()` hook for user data
- Access user permissions and project restrictions
- Handle user role-based access

### Permission Patterns
```typescript
// Check user permissions
const { user } = useAuth()

// Project-based access
if (user?.project_ids && user.project_ids.length > 0) {
  // Filter data by user's projects
}

// Role-based access
if (user?.role === 'admin') {
  // Show admin features
}
```

## State Management Patterns

### Local State
- Use `useState` for component-specific state
- Use `useEffect` for side effects
- Keep state as close to where it's used as possible

### Context State
- Use for global application state
- Examples: Authentication, theme, notifications
- Keep contexts focused and minimal

### Data Fetching
- Fetch data in `useEffect` hooks
- Handle loading and error states
- Use proper dependency arrays

## Error Handling Patterns

### API Error Handling
```typescript
try {
  const result = await supabase.from('table').select('*')
  if (result.error) throw result.error
  return result.data
} catch (error) {
  console.error('Database error:', error)
  // Handle error appropriately
}
```

### Form Validation
- Client-side validation for UX
- Server-side validation for security
- Display clear error messages
- Use consistent error styling

### User Feedback
- Use toast notifications for success/error messages
- Show loading states during operations
- Provide clear feedback for user actions

## Styling Patterns

### Tailwind CSS
- Use utility classes for styling
- Follow consistent spacing and color schemes
- Use responsive design patterns

### Component Styling
```typescript
// Consistent button styling
<Button 
  variant="ghost" 
  size="sm" 
  className="text-blue-600 hover:text-blue-700"
>
  Action
</Button>
```

### Layout Patterns
- Use consistent page layouts
- Include sidebar navigation
- Responsive design for mobile/desktop

## Testing Patterns

### Component Testing
- Test user interactions
- Test error scenarios
- Test loading states
- Mock external dependencies

### Integration Testing
- Test complete user workflows
- Test data flow between components
- Test API integrations

## Performance Patterns

### Data Loading
- Use pagination for large datasets
- Implement search and filtering
- Cache frequently accessed data
- Use proper loading states

### Component Optimization
- Use `React.memo` for expensive components
- Implement proper dependency arrays
- Avoid unnecessary re-renders

## Security Patterns

### Input Validation
- Validate all user inputs
- Sanitize data before database operations
- Use proper TypeScript types

### Authentication
- Protect all sensitive routes
- Validate user permissions
- Handle session expiration

### Database Security
- Use Row Level Security (RLS) in Supabase
- Validate foreign key relationships
- Use proper data types

## Feature Development Checklist

### When Adding a New Feature:

#### 1. Planning
- [ ] Define feature requirements
- [ ] Identify affected components
- [ ] Plan database changes
- [ ] Consider user permissions

#### 2. Database Changes
- [ ] Create migration scripts
- [ ] Update table schemas
- [ ] Add necessary indexes
- [ ] Test migration rollback

#### 3. Backend Services
- [ ] Create/update service classes
- [ ] Implement data access methods
- [ ] Add validation logic
- [ ] Handle error scenarios

#### 4. Frontend Components
- [ ] Create/update page components
- [ ] Implement form components
- [ ] Add table/list components
- [ ] Create modal components if needed

#### 5. Integration
- [ ] Connect frontend to backend
- [ ] Implement error handling
- [ ] Add loading states
- [ ] Test user workflows

#### 6. Testing
- [ ] Test happy path scenarios
- [ ] Test error scenarios
- [ ] Test edge cases
- [ ] Test user permissions

#### 7. Documentation
- [ ] Create feature documentation
- [ ] Update API documentation
- [ ] Add setup instructions if needed
- [ ] Update user guides

## Common Feature Types

### CRUD Operations
- **Create**: Form with validation
- **Read**: Table with pagination/filtering
- **Update**: Edit form with pre-populated data
- **Delete**: Confirmation dialog

### Import/Export Features
- **Import**: File upload with validation
- **Export**: Download functionality
- **Template**: Provide sample files

### Assignment Features
- **Assign**: Modal with selection
- **Unassign**: Confirmation with cleanup
- **History**: Track assignment changes

### Reporting Features
- **Filters**: Date ranges, categories, etc.
- **Export**: PDF, Excel, CSV options
- **Charts**: Visual data representation

This guide ensures consistent development practices and helps maintain code quality across the project.
