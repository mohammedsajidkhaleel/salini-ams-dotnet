"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { X } from "lucide-react"
import { UserService } from "@/lib/userService"
import { ProjectService } from "@/lib/services/projectService"

interface User {
  id?: string
  email: string
  password?: string
  firstName: string
  lastName: string
  role: string
  department: string
  permissions: string[]
  project_ids?: string[]  // Old interface
  projectIds?: string[]   // New interface
  isActive: boolean
  lastLogin?: string
  createdAt?: string
}

interface UserFormProps {
  user?: User
  onSubmit: (user: User) => void
  onCancel: () => void
}

interface Project {
  id: string
  name: string
  code: string
}

export function UserForm({ user, onSubmit, onCancel }: UserFormProps) {
  // Helper function to get project IDs from either interface
  const getProjectIds = (user: User): string[] => {
    return user.project_ids || user.projectIds || []
  }

  const [formData, setFormData] = useState<User>({
    email: user?.email || "",
    password: user?.password || "",
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    role: user?.role || "",
    department: user?.department || "",
    permissions: user?.permissions || [],
    project_ids: user ? getProjectIds(user) : [], // Use helper function for initial state
    isActive: user?.isActive ?? true,
  })
  
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadProjects()
  }, [])

  // Update form data when user prop changes
  useEffect(() => {
    if (user) {
      const projectIds = getProjectIds(user)
      setFormData({
        email: user.email || "",
        password: user.password || "",
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        role: user.role || "",
        department: user.department || "",
        permissions: user.permissions || [],
        project_ids: projectIds, // Use the helper function
        isActive: user.isActive ?? true,
      })
    }
  }, [user])

  const loadProjects = async () => {
    try {
      const projects = await ProjectService.getAll()
      setProjects(projects)
    } catch (error) {
      console.error('Error loading projects:', error)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Get the current project IDs from either interface
    const currentProjectIds = getProjectIds(formData)
    
    // Normalize the form data to include both interfaces for compatibility
    const normalizedData = {
      ...formData,
      project_ids: currentProjectIds,
      projectIds: currentProjectIds // Also set projectIds for new interface
    }
    
    onSubmit(normalizedData)
  }

  const togglePermission = (permission: string) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter((p) => p !== permission)
        : [...prev.permissions, permission],
    }))
  }

  const removePermission = (permission: string) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.filter((p) => p !== permission),
    }))
  }

  const toggleProject = (projectId: string) => {
    setFormData((prev) => ({
      ...prev,
      project_ids: (prev.project_ids || []).includes(projectId)
        ? (prev.project_ids || []).filter((p) => p !== projectId)
        : [...(prev.project_ids || []), projectId],
    }))
  }

  const removeProject = (projectId: string) => {
    setFormData((prev) => ({
      ...prev,
      project_ids: (prev.project_ids || []).filter((p) => p !== projectId),
    }))
  }

  const availablePermissions = UserService.getAvailablePermissions()
  const roles = UserService.getAvailableRoles()
  const departments = UserService.getAvailableDepartments()

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>{user ? "Edit User" : "Add New User"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>
            {!user && (
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password || ""}
                  onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                  required={!user}
                  placeholder="Enter password for new user"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData((prev) => ({ ...prev, firstName: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData((prev) => ({ ...prev, lastName: e.target.value }))}
                required
              />
            </div>
          </div>

          {/* Role and Department */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, role: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Department *</Label>
              <Select
                value={formData.department}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, department: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Account Status */}
          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isActive: checked }))}
            />
            <Label htmlFor="isActive">Active Account</Label>
          </div>

          {/* Permissions */}
          <div className="space-y-4">
            <Label>Permissions</Label>

            {/* Selected Permissions */}
            {formData.permissions.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Selected Permissions:</Label>
                <div className="flex flex-wrap gap-2">
                  {formData.permissions.map((permission) => (
                    <Badge key={permission} variant="secondary" className="flex items-center gap-1">
                      {permission.replace("_", " ")}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => removePermission(permission)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Available Permissions */}
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Available Permissions:</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto border rounded-md p-3">
                {availablePermissions
                  .filter((permission) => !formData.permissions.includes(permission))
                  .map((permission) => (
                    <Button
                      key={permission}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="justify-start text-xs bg-transparent"
                      onClick={() => togglePermission(permission)}
                    >
                      {permission.replace("_", " ")}
                    </Button>
                  ))}
              </div>
            </div>
          </div>

          {/* Project Assignment */}
          <div className="space-y-4">
            <Label>Project Assignment</Label>

            {/* Selected Projects */}
            {getProjectIds(formData).length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Assigned Projects:</Label>
                <div className="flex flex-wrap gap-2">
                  {getProjectIds(formData).map((projectId) => {
                    const project = projects.find(p => p.id === projectId)
                    return project ? (
                      <Badge key={projectId} variant="secondary" className="flex items-center gap-1">
                        {project.name} ({project.code})
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                          onClick={() => removeProject(projectId)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ) : null
                  })}
                </div>
              </div>
            )}

            {/* Available Projects */}
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Available Projects:</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-md p-3">
                {projects
                  .filter((project) => !getProjectIds(formData).includes(project.id))
                  .map((project) => (
                    <Button
                      key={project.id}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="justify-start text-xs bg-transparent"
                      onClick={() => toggleProject(project.id)}
                    >
                      {project.name} ({project.code})
                    </Button>
                  ))}
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" className="bg-cyan-600 hover:bg-cyan-700">
              {user ? "Update User" : "Create User"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
