# Project Restructure Guide

## Overview

The Salini AMS project has been reorganized to provide clear separation between frontend and backend code, improving maintainability and development workflow.

## New Structure

### Before (Mixed Structure)
```
salini-ams-dotnet/
├── app/              # Next.js pages (frontend)
├── backend/          # .NET API
├── components/       # React components (frontend)
├── contexts/         # React contexts (frontend)
├── hooks/            # React hooks (frontend)
├── lib/              # Frontend utilities
├── public/           # Static assets (frontend)
├── styles/           # CSS files (frontend)
├── package.json      # Frontend dependencies
├── next.config.mjs   # Frontend config
└── tsconfig.json     # Frontend TypeScript config
```

### After (Clean Separation)
```
salini-ams-dotnet/
├── backend/          # Complete .NET API backend
│   ├── salini.api.API/
│   ├── salini.api.Application/
│   ├── salini.api.Domain/
│   ├── salini.api.Infrastructure/
│   └── salini.api.Shared/
├── client/           # Complete Next.js frontend
│   ├── app/
│   ├── components/
│   ├── contexts/
│   ├── hooks/
│   ├── lib/
│   ├── public/
│   ├── styles/
│   ├── package.json
│   ├── next.config.mjs
│   └── tsconfig.json
├── docs/             # Project documentation
├── scripts/          # Database and utility scripts
└── README.md         # Main project README
```

## Benefits

### 1. **Clear Separation of Concerns**
- Backend and frontend are completely isolated
- Each has its own dependencies and configuration
- Easier to understand project structure

### 2. **Independent Development**
- Frontend and backend can be developed independently
- Separate deployment pipelines possible
- Different teams can work without conflicts

### 3. **Better Dependency Management**
- Frontend dependencies don't pollute backend
- Backend dependencies don't affect frontend
- Easier to update and maintain each separately

### 4. **Improved Build Process**
- Build only what you need
- Faster CI/CD pipelines
- Better caching strategies

### 5. **Scalability**
- Can deploy frontend and backend to different servers
- Easier to implement microservices if needed
- Better for containerization (Docker)

## What Changed

### Moved to `client/` Directory
All frontend files have been moved:

| Old Location | New Location |
|-------------|--------------|
| `app/` | `client/app/` |
| `components/` | `client/components/` |
| `contexts/` | `client/contexts/` |
| `hooks/` | `client/hooks/` |
| `lib/` | `client/lib/` |
| `public/` | `client/public/` |
| `styles/` | `client/styles/` |
| `package.json` | `client/package.json` |
| `next.config.mjs` | `client/next.config.mjs` |
| `tsconfig.json` | `client/tsconfig.json` |
| `postcss.config.mjs` | `client/postcss.config.mjs` |
| `components.json` | `client/components.json` |

### Stayed in Root
These remain in the project root:

| File/Folder | Purpose |
|------------|---------|
| `backend/` | Complete .NET API backend |
| `docs/` | Project documentation |
| `scripts/` | Database and utility scripts |
| `.gitignore` | Git ignore rules |
| `README.md` | Main project README |

## Migration Steps for Developers

### 1. Update Your Local Repository

```bash
# Pull the latest changes
git pull origin main

# Clean up any old build artifacts
rm -rf node_modules .next

# Navigate to the client directory
cd client

# Install dependencies
npm install
```

### 2. Update Your IDE/Editor

If you have workspace settings, update paths:

**VS Code:**
- Update `.vscode/settings.json` paths if needed
- Restart VS Code to pick up new structure

**IntelliJ/WebStorm:**
- Mark `client/` as sources root
- Update run configurations

### 3. Update Scripts and Commands

**Old:**
```bash
# From project root
npm run dev
npm run build
```

**New:**
```bash
# Navigate to client folder first
cd client
npm run dev
npm run build
```

### 4. Update Import Paths

No changes needed! The `@/` alias still works the same way within the client folder.

```typescript
// Still works as before
import { Button } from '@/components/ui/button';
import { employeeService } from '@/lib/services';
```

### 5. Environment Variables

**Old Location:** Root `.env.local`
**New Location:** `client/.env.local`

```bash
# Create your environment file
cd client
cp .env.example .env.local  # If we provide an example
```

## Development Workflow

### Starting the Full Stack

**Terminal 1 - Backend:**
```bash
cd backend
dotnet run --project salini.api.API
```

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
```

### Working on Frontend Only

```bash
cd client
npm run dev
```

The frontend will connect to the backend API (ensure backend is running).

### Working on Backend Only

```bash
cd backend
dotnet run --project salini.api.API
```

Test using Swagger UI at http://localhost:5000

## CI/CD Updates

### GitHub Actions / Azure DevOps

Update build pipelines to use correct paths:

**Frontend Build:**
```yaml
- name: Install dependencies
  working-directory: ./client
  run: npm ci

- name: Build
  working-directory: ./client
  run: npm run build
```

**Backend Build:**
```yaml
- name: Restore
  working-directory: ./backend
  run: dotnet restore

- name: Build
  working-directory: ./backend
  run: dotnet build
```

## Docker Support

### Separate Dockerfiles

**Backend Dockerfile:**
```dockerfile
# backend/Dockerfile
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["salini.api.API/salini.api.API.csproj", "salini.api.API/"]
# ... rest of backend Dockerfile
```

**Frontend Dockerfile:**
```dockerfile
# client/Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
# ... rest of frontend Dockerfile
```

### Docker Compose

```yaml
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "5000:80"
    environment:
      - ConnectionStrings__DefaultConnection=...
  
  frontend:
    build:
      context: ./client
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://backend:80
    depends_on:
      - backend
```

## Troubleshooting

### Issue: Import Errors After Restructure

**Solution:** Ensure you're in the `client/` directory and have run `npm install`.

### Issue: API Connection Errors

**Solution:** Check `client/lib/config.ts` and ensure `NEXT_PUBLIC_API_URL` points to the correct backend URL.

### Issue: Build Fails

**Solution:**
```bash
cd client
rm -rf node_modules .next
npm install
npm run build
```

### Issue: Path Errors in VS Code

**Solution:**
1. Close VS Code
2. Delete `.vscode` folder if it exists
3. Reopen VS Code from the `client/` directory
4. Let TypeScript server reinitialize

## Best Practices

### 1. **Work in the Correct Directory**
- Always `cd client` before running frontend commands
- Always `cd backend` before running backend commands

### 2. **Keep Dependencies Separate**
- Don't install frontend packages in backend
- Don't install backend packages in frontend

### 3. **Environment Variables**
- Frontend env vars in `client/.env.local`
- Backend env vars in `backend/salini.api.API/appsettings.json`

### 4. **Documentation**
- Update paths in documentation when adding new features
- Keep README files in both `client/` and `backend/` up to date

### 5. **Git Commits**
- Be clear about which part you're changing
- Example: `feat(client): add new dashboard component`
- Example: `fix(backend): resolve authentication issue`

## FAQ

### Q: Do I need to reinstall dependencies?
**A:** Yes, navigate to `client/` and run `npm install`.

### Q: Will my old branches work?
**A:** You may need to rebase or merge from main and reinstall dependencies.

### Q: Can I still run both from the root?
**A:** Not directly, but you can create a root-level script to start both.

### Q: What about the supabase folder?
**A:** It remains in the root as it's a shared resource. It will be phased out as we complete the .NET API migration.

## Summary

This restructure provides:
- ✅ Clearer project organization
- ✅ Better separation of concerns
- ✅ Easier development workflow
- ✅ Improved scalability
- ✅ Better deployment options

All existing functionality remains the same - just better organized!
