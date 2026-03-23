"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { X, Search, ChevronDown, ChevronUp } from "lucide-react"
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

// Module-level cache to prevent duplicate API calls across component remounts
let cachedProjects: Project[] | null = null
let cachedPermissions: string[] | null = null
let projectsLoadPromise: Promise<Project[]> | null = null
let permissionsLoadPromise: Promise<string[]> | null = null

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
  
  const [projects, setProjects] = useState<Project[]>(cachedProjects || [])
  const [availablePermissions, setAvailablePermissions] = useState<string[]>(cachedPermissions || [])
  const [loading, setLoading] = useState(false)
  const [permissionSearch, setPermissionSearch] = useState("")
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const hasLoadedProjectsRef = useRef(false)
  const hasLoadedPermissionsRef = useRef(false)
  const groupsInitializedRef = useRef(false)

  useEffect(() => {
    // Load projects if not cached and not already loaded
    if (!hasLoadedProjectsRef.current) {
      hasLoadedProjectsRef.current = true
      if (cachedProjects) {
        setProjects(cachedProjects)
      } else if (!projectsLoadPromise) {
        loadProjects()
      } else {
        // If already loading, wait for the existing promise
        projectsLoadPromise.then((data) => {
          setProjects(data)
        }).catch(() => {
          // Error already handled in loadProjects
        })
      }
    }
    
    // Load permissions if not cached and not already loaded
    if (!hasLoadedPermissionsRef.current) {
      hasLoadedPermissionsRef.current = true
      if (cachedPermissions) {
        setAvailablePermissions(cachedPermissions)
      } else if (!permissionsLoadPromise) {
        loadAvailablePermissions()
      } else {
        // If already loading, wait for the existing promise
        permissionsLoadPromise.then((data) => {
          setAvailablePermissions(data)
        }).catch(() => {
          // Error already handled in loadAvailablePermissions
        })
      }
    }
  }, [])

  const loadAvailablePermissions = async () => {
    // If already cached, use cached data
    if (cachedPermissions) {
      setAvailablePermissions(cachedPermissions)
      return
    }
    
    // If already loading, wait for existing promise
    if (permissionsLoadPromise) {
      try {
        const permissions = await permissionsLoadPromise
        setAvailablePermissions(permissions)
      } catch (error) {
        // Error already handled in the original promise
      }
      return
    }
    
    // Start loading
    permissionsLoadPromise = UserService.getAvailablePermissions()
    
    try {
      const permissions = await permissionsLoadPromise
      cachedPermissions = permissions
      setAvailablePermissions(permissions)
    } catch (error) {
      console.error('Error loading available permissions:', error)
      permissionsLoadPromise = null // Reset on error to allow retry
    }
  }

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
    // If already cached, use cached data
    if (cachedProjects) {
      setProjects(cachedProjects)
      return
    }
    
    // If already loading, wait for existing promise
    if (projectsLoadPromise) {
      try {
        const projects = await projectsLoadPromise
        setProjects(projects)
      } catch (error) {
        // Error already handled in the original promise
      }
      return
    }
    
    // Start loading
    projectsLoadPromise = ProjectService.getAll()
    
    try {
      const projects = await projectsLoadPromise
      cachedProjects = projects
      setProjects(projects)
    } catch (error) {
      console.error('Error loading projects:', error)
      projectsLoadPromise = null // Reset on error to allow retry
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

  const roles = UserService.getAvailableRoles()
  const departments = UserService.getAvailableDepartments()

  // Group permissions by module
  const groupPermissionsByModule = (permissions: string[]) => {
    const grouped: Record<string, string[]> = {}
    
    permissions.forEach((permission) => {
      const [module] = permission.split(":")
      if (!grouped[module]) {
        grouped[module] = []
      }
      grouped[module].push(permission)
    })
    
    return grouped
  }

  // Format module name for display
  const formatModuleName = (module: string): string => {
    return module
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  // Toggle group expansion
  const toggleGroup = (module: string) => {
    setExpandedGroups((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(module)) {
        newSet.delete(module)
      } else {
        newSet.add(module)
      }
      return newSet
    })
  }

  // Initialize expanded groups when permissions are loaded
  useEffect(() => {
    if (availablePermissions.length > 0 && !groupsInitializedRef.current) {
      const grouped = groupPermissionsByModule(availablePermissions)
      setExpandedGroups(new Set(Object.keys(grouped)))
      groupsInitializedRef.current = true
    }
  }, [availablePermissions])

  // Get filtered and grouped permissions
  const getFilteredGroupedPermissions = () => {
    const available = availablePermissions.filter(
      (permission) => !formData.permissions.includes(permission)
    )
    
    const filtered = permissionSearch
      ? available.filter((permission) =>
          permission.toLowerCase().includes(permissionSearch.toLowerCase())
        )
      : available
    
    return groupPermissionsByModule(filtered)
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{user ? "Edit User" : "Add New User"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-8">
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
                <div className="flex flex-wrap gap-2 min-h-[2.5rem]">
                  {formData.permissions.map((permission) => (
                    <Badge key={permission} variant="secondary" className="flex items-center gap-1 max-w-full break-words">
                      <span className="truncate max-w-[200px]">{permission.replace("_", " ")}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground flex-shrink-0"
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
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm text-muted-foreground">Available Permissions:</Label>
                <div className="relative w-full max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search permissions..."
                    value={permissionSearch}
                    onChange={(e) => setPermissionSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              
              <div className="max-h-96 overflow-y-auto border rounded-md p-4 space-y-3">
                {Object.entries(getFilteredGroupedPermissions())
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([module, permissions]) => {
                    const isExpanded = expandedGroups.has(module) || permissionSearch.length > 0
                    const moduleDisplayName = formatModuleName(module)
                    
                    return (
                      <div key={module} className="border-b last:border-b-0 pb-3 last:pb-0">
                        <button
                          type="button"
                          onClick={() => toggleGroup(module)}
                          className="w-full flex items-center justify-between p-2 hover:bg-muted rounded-md transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm">{moduleDisplayName}</span>
                            <Badge variant="outline" className="text-xs">
                              {permissions.length}
                            </Badge>
                          </div>
                          {!permissionSearch && (
                            isExpanded ? (
                              <ChevronUp className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            )
                          )}
                        </button>
                        
                        {isExpanded && (
                          <div className="mt-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 pl-4">
                            {permissions
                              .sort()
                              .map((permission) => {
                                const action = permission.split(":")[1]
                                const actionDisplay = action
                                  .split("_")
                                  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                                  .join(" ")
                                
                                return (
                                  <Button
                                    key={permission}
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="justify-start text-xs bg-transparent text-left break-words whitespace-normal h-auto py-2 px-3 hover:bg-accent"
                                    onClick={() => togglePermission(permission)}
                                  >
                                    <span className="break-words">{actionDisplay}</span>
                                  </Button>
                                )
                              })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                
                {Object.keys(getFilteredGroupedPermissions()).length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    {permissionSearch ? "No permissions found matching your search." : "No available permissions."}
                  </div>
                )}
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
                <div className="flex flex-wrap gap-2 min-h-[2.5rem]">
                  {getProjectIds(formData).map((projectId) => {
                    const project = projects.find(p => p.id === projectId)
                    return project ? (
                      <Badge key={projectId} variant="secondary" className="flex items-center gap-1 max-w-full break-words">
                        <span className="truncate max-w-[250px]">{project.name} ({project.code})</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground flex-shrink-0"
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-64 overflow-y-auto border rounded-md p-4">
                {projects
                  .filter((project) => !getProjectIds(formData).includes(project.id))
                  .map((project) => (
                    <Button
                      key={project.id}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="justify-start text-xs bg-transparent text-left break-words whitespace-normal h-auto py-2 px-3"
                      onClick={() => toggleProject(project.id)}
                    >
                      <span className="break-words">{project.name} ({project.code})</span>
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
