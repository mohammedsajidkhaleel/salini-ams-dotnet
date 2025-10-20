# Feature Development Template

## Feature: [FEATURE_NAME]

### Overview
Brief description of the feature and its purpose.

### Requirements
- [ ] Requirement 1
- [ ] Requirement 2
- [ ] Requirement 3

### Database Changes
- [ ] Migration script: `00XX_feature_name.sql`
- [ ] New tables/columns needed
- [ ] Indexes to add
- [ ] Foreign key constraints

### Backend Changes
- [ ] Service class: `lib/[feature]Service.ts`
- [ ] API endpoints (if needed)
- [ ] Validation logic
- [ ] Error handling

### Frontend Changes
- [ ] Page component: `app/[feature]/page.tsx`
- [ ] Form component: `components/[feature]-form.tsx`
- [ ] Table component: `components/[feature]-table.tsx`
- [ ] Modal components (if needed)
- [ ] Type definitions: `lib/types.ts`

### UI/UX Changes
- [ ] New pages/screens
- [ ] Form layouts
- [ ] Table displays
- [ ] Modal dialogs
- [ ] Navigation updates

### Integration Points
- [ ] Authentication/authorization
- [ ] User permissions
- [ ] Project restrictions
- [ ] Related features

### Testing Checklist
- [ ] Unit tests for services
- [ ] Component tests
- [ ] Integration tests
- [ ] User workflow tests
- [ ] Error scenario tests
- [ ] Permission tests

### Documentation
- [ ] Feature documentation: `docs/[FEATURE_NAME]_FEATURE.md`
- [ ] API documentation updates
- [ ] User guide updates
- [ ] Setup instructions (if needed)

### Deployment Notes
- [ ] Migration order
- [ ] Environment variables
- [ ] Configuration changes
- [ ] Rollback plan

---

## Implementation Steps

### Phase 1: Database Setup
1. Create migration script
2. Test migration locally
3. Verify rollback works
4. Document schema changes

### Phase 2: Backend Development
1. Create/update service classes
2. Implement data access methods
3. Add validation and error handling
4. Test with sample data

### Phase 3: Frontend Development
1. Create page components
2. Implement form components
3. Add table/list components
4. Create modal components if needed

### Phase 4: Integration
1. Connect frontend to backend
2. Implement error handling
3. Add loading states
4. Test user workflows

### Phase 5: Testing & Documentation
1. Comprehensive testing
2. Create feature documentation
3. Update user guides
4. Code review and cleanup

---

## Code Templates

### Service Class Template
```typescript
// lib/[feature]Service.ts
import { supabase } from './supabaseClient'

export interface [Feature] {
  id: string
  // Define properties
}

export interface Create[Feature]Data {
  // Define creation properties
}

export class [Feature]Service {
  static async get[Feature]s(filters?: any): Promise<[Feature][]> {
    try {
      const { data, error } = await supabase
        .from('[feature]s')
        .select('*')
        // Add filters
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching [feature]s:', error)
      throw error
    }
  }

  static async create[Feature](data: Create[Feature]Data): Promise<[Feature]> {
    try {
      const { data: result, error } = await supabase
        .from('[feature]s')
        .insert(data)
        .select()
        .single()
      
      if (error) throw error
      return result
    } catch (error) {
      console.error('Error creating [feature]:', error)
      throw error
    }
  }

  static async update[Feature](id: string, updates: Partial<[Feature]>): Promise<[Feature]> {
    try {
      const { data, error } = await supabase
        .from('[feature]s')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating [feature]:', error)
      throw error
    }
  }

  static async delete[Feature](id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('[feature]s')
        .delete()
        .eq('id', id)
      
      if (error) throw error
    } catch (error) {
      console.error('Error deleting [feature]:', error)
      throw error
    }
  }
}
```

### Page Component Template
```typescript
// app/[feature]/page.tsx
"use client"

import { useEffect, useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { UserHeader } from "@/components/user-header"
import { ProtectedRoute } from "@/components/protected-route"
import { [Feature]Table } from "@/components/[feature]-table"
import { [Feature]Form } from "@/components/[feature]-form"
import { [Feature]Service } from "@/lib/[feature]Service"
import { useAuth } from "@/contexts/auth-context"

interface [Feature] {
  id: string
  // Define properties
}

export default function [Feature]Page() {
  const { user } = useAuth()
  const [[feature]s, set[Feature]s] = useState<[Feature][]>([])
  const [showForm, setShowForm] = useState(false)
  const [editing[Feature], setEditing[Feature]] = useState<[Feature] | undefined>()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    load[Feature]s()
  }, [user])

  const load[Feature]s = async () => {
    setLoading(true)
    try {
      const data = await [Feature]Service.get[Feature]s()
      set[Feature]s(data)
    } catch (error) {
      console.error('Error loading [feature]s:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async ([feature]Data: Omit<[Feature], "id">) => {
    try {
      if (editing[Feature]) {
        await [Feature]Service.update[Feature](editing[Feature].id, [feature]Data)
      } else {
        await [Feature]Service.create[Feature]([feature]Data)
      }
      await load[Feature]s()
      setShowForm(false)
      setEditing[Feature](undefined)
    } catch (error) {
      console.error('Error saving [feature]:', error)
    }
  }

  const handleEdit = ([feature]: [Feature]) => {
    setEditing[Feature]([feature])
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    try {
      await [Feature]Service.delete[Feature](id)
      await load[Feature]s()
    } catch (error) {
      console.error('Error deleting [feature]:', error)
    }
  }

  if (showForm) {
    return (
      <ProtectedRoute>
        <div className="flex h-screen bg-background">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <UserHeader />
            <main className="flex-1 overflow-auto p-6">
              <[Feature]Form
                [feature]={editing[Feature]}
                onSubmit={handleSubmit}
                onCancel={() => {
                  setShowForm(false)
                  setEditing[Feature](undefined)
                }}
              />
            </main>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <UserHeader />
          <main className="flex-1 overflow-auto p-6">
            <div className="mb-6">
              <h1 className="text-3xl font-bold">[Feature]s</h1>
              <p className="text-muted-foreground">
                Manage [feature]s in your system
              </p>
            </div>
            
            <[Feature]Table
              [feature]s={[feature]s}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onAdd={() => setShowForm(true)}
              loading={loading}
            />
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
```

### Form Component Template
```typescript
// components/[feature]-form.tsx
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface [Feature] {
  id: string
  // Define properties
}

interface [Feature]FormProps {
  [feature]?: [Feature]
  onSubmit: (data: Omit<[Feature], "id">) => void
  onCancel: () => void
}

export function [Feature]Form({ [feature], onSubmit, onCancel }: [Feature]FormProps) {
  const [formData, setFormData] = useState({
    // Initialize form fields
  })

  useEffect(() => {
    if ([feature]) {
      setFormData({
        // Populate form with existing data
      })
    }
  }, [[feature]])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>
          {[feature] ? 'Edit [Feature]' : 'Add New [Feature]'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Form fields */}
          
          <div className="flex gap-4 pt-4">
            <Button type="submit" className="flex-1">
              {[feature] ? 'Update [Feature]' : 'Create [Feature]'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
```

### Table Component Template
```typescript
// components/[feature]-table.tsx
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Edit, Trash2, Plus } from "lucide-react"

interface [Feature] {
  id: string
  // Define properties
}

interface [Feature]TableProps {
  [feature]s: [Feature][]
  onEdit: ([feature]: [Feature]) => void
  onDelete: (id: string) => void
  onAdd: () => void
  loading?: boolean
}

export function [Feature]Table({ 
  [feature]s, 
  onEdit, 
  onDelete, 
  onAdd, 
  loading = false 
}: [Feature]TableProps) {
  const [searchTerm, setSearchTerm] = useState("")

  const filtered[Feature]s = [feature]s.filter([feature] =>
    // Add search logic
  )

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Input
          placeholder="Search [feature]s..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Button onClick={onAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Add [Feature]
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filtered[Feature]s.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  No [feature]s found
                </TableCell>
              </TableRow>
            ) : (
              filtered[Feature]s.map(([feature]) => (
                <TableRow key={[feature].id}>
                  <TableCell>{[feature].name}</TableCell>
                  <TableCell>{[feature].status}</TableCell>
                  <TableCell>
                    {new Date([feature].created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit([feature])}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete([feature].id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
```

This template provides a complete framework for developing new features consistently with the project's established patterns.
