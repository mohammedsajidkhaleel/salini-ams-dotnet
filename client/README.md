# Salini AMS - Frontend Client

Next.js 15 frontend application for the Salini IT Asset Management System.

## Project Structure

```
client/
├── app/                    # Next.js app router pages
│   ├── api/               # API route handlers (if needed)
│   ├── assets/            # Assets management pages
│   ├── employees/         # Employee management pages
│   ├── inventory/         # Inventory pages
│   ├── login/             # Authentication pages
│   ├── master-data/       # Master data management
│   ├── reports/           # Reporting pages
│   ├── settings/          # Settings pages
│   ├── sim-cards/         # SIM card management
│   ├── software-licenses/ # Software license management
│   ├── user-management/   # User management pages
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home/dashboard page
├── components/            # Reusable UI components
│   ├── ui/               # Shadcn/ui components
│   └── ...               # Feature-specific components
├── contexts/              # React context providers
│   ├── auth-context.tsx  # Legacy Supabase auth (deprecated)
│   └── auth-context-new.tsx  # New JWT auth
├── hooks/                 # Custom React hooks
├── lib/                   # Utilities and services
│   ├── services/         # API service layer
│   ├── apiClient.ts      # HTTP client
│   ├── authService.ts    # Authentication service
│   ├── config.ts         # App configuration
│   ├── errorHandler.ts   # Error handling
│   └── toast.ts          # Toast notifications
├── public/                # Static assets
├── styles/                # Global styles
├── next.config.mjs        # Next.js configuration
├── package.json           # Dependencies
├── postcss.config.mjs     # PostCSS configuration
└── tsconfig.json          # TypeScript configuration
```

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or pnpm

### Installation

```bash
# Install dependencies
npm install

# or with pnpm
pnpm install
```

### Development

```bash
# Run development server
npm run dev

# The app will be available at http://localhost:3000
```

### Build

```bash
# Create production build
npm run build

# Start production server
npm start
```

## Configuration

### API Connection

The frontend connects to the backend API. Configure the API URL in `lib/config.ts`:

```typescript
export const config = {
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
    timeout: 30000,
    retryAttempts: 3,
  },
  // ...
}
```

### Environment Variables

Create a `.env.local` file in the client directory:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5000

# Development settings
NEXT_PUBLIC_APP_ENV=development
```

## Key Features

### Authentication System

The application uses JWT-based authentication:

- **Auth Service** (`lib/authService.ts`) - Manages authentication state
- **Auth Context** (`contexts/auth-context-new.tsx`) - React context provider
- **Protected Routes** - Automatic redirects for unauthenticated users

### API Service Layer

All API calls go through the service layer for:
- Type safety with TypeScript
- Automatic token management
- Error handling
- Request/response transformation

**Services:**
- `employeeService.ts` - Employee operations
- `assetService.ts` - Asset operations
- `simCardService.ts` - SIM card operations
- `softwareLicenseService.ts` - Software license operations
- `userManagementService.ts` - User management
- `reportsService.ts` - Reporting

### Error Handling

Centralized error handling with user-friendly messages:

```typescript
import { ErrorHandler } from '@/lib/errorHandler';

try {
  await someApiCall();
} catch (error) {
  const message = ErrorHandler.showError(error, 'ComponentName');
  toast.error(message);
}
```

### Toast Notifications

Use the toast system for user feedback:

```typescript
import { toast } from '@/lib/toast';

toast.success('Operation completed successfully');
toast.error('An error occurred');
toast.warning('Warning message');
toast.info('Information message');
```

## Component Guidelines

### Using UI Components

The project uses Shadcn/ui components in `components/ui/`. Import and use them:

```typescript
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
```

### Creating New Components

1. Place feature-specific components in `components/`
2. Use TypeScript for type safety
3. Export named components
4. Include JSDoc comments for complex components

```typescript
/**
 * EmployeeForm component for creating/editing employees
 */
export function EmployeeForm({ employeeId }: { employeeId?: string }) {
  // Component implementation
}
```

## API Integration

### Making API Calls

Use the service layer for API calls:

```typescript
import { employeeService } from '@/lib/services';

async function loadEmployees() {
  try {
    const response = await employeeService.getEmployees({
      pageNumber: 1,
      pageSize: 10,
    });
    
    console.log('Employees:', response.items);
  } catch (error) {
    const message = ErrorHandler.showError(error);
    toast.error(message);
  }
}
```

### Handling Pagination

Services return paginated results:

```typescript
interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}
```

## Styling

### Tailwind CSS

The project uses Tailwind CSS for styling. Use utility classes:

```tsx
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow">
  <h2 className="text-lg font-semibold text-gray-900">Title</h2>
</div>
```

### Theme

The application supports dark/light themes via `next-themes`. Components automatically adapt.

## Common Patterns

### Loading States

```typescript
const [isLoading, setIsLoading] = useState(false);

async function handleSubmit() {
  setIsLoading(true);
  try {
    await apiCall();
    toast.success('Success!');
  } catch (error) {
    toast.error(ErrorHandler.showError(error));
  } finally {
    setIsLoading(false);
  }
}
```

### Form Handling

Use React Hook Form with Zod validation:

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
});

const form = useForm({
  resolver: zodResolver(schema),
});
```

## Testing

```bash
# Run linter
npm run lint

# Type check
npx tsc --noEmit
```

## Migration from Supabase

The application is being migrated from Supabase to the new .NET API:

- ✅ **New**: Use `auth-context-new.tsx` and JWT authentication
- ❌ **Old**: `auth-context.tsx` (Supabase) - Deprecated
- ✅ **New**: Service layer in `lib/services/`
- ❌ **Old**: Direct Supabase client calls - Being phased out

## Deployment

### Environment-Specific Builds

```bash
# Production build
npm run build

# The build will be optimized for production
```

### Environment Variables for Production

Set these in your deployment platform:

```env
NEXT_PUBLIC_API_URL=https://api.salini-ams.com
NEXT_PUBLIC_APP_ENV=production
```

## Troubleshooting

### API Connection Issues

1. Verify the backend is running at `http://localhost:5000`
2. Check `lib/config.ts` for correct API URL
3. Verify CORS settings in backend

### Authentication Issues

1. Clear browser localStorage
2. Check JWT token expiration
3. Verify backend authentication endpoint

### Build Issues

```bash
# Clean build
rm -rf .next node_modules
npm install
npm run build
```

## Contributing

1. Follow TypeScript best practices
2. Use the existing component patterns
3. Add proper error handling
4. Include loading states
5. Test thoroughly before committing

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Shadcn/ui](https://ui.shadcn.com/)
- [React Hook Form](https://react-hook-form.com/)
- [Zod](https://zod.dev/)
