"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { UserTable } from "@/components/user-table"
import { UserForm } from "@/components/user-form"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { PasswordResetDialog } from "@/components/password-reset-dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Plus, Users, UserCheck, UserX, Shield } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ProtectedRoute } from "@/components/protected-route"
import { LayoutWrapper } from "@/components/layout-wrapper"
import { UserService, type UserProfile } from "@/lib/userService"

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  department: string
  permissions: string[]
  project_ids: string[]
  isActive: boolean
  lastLogin?: string
  createdAt: string
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | undefined>()
  const [loading, setLoading] = useState(true)
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    user: User | null;
  }>({ isOpen: false, user: null })
  const [passwordResetDialog, setPasswordResetDialog] = useState<{
    isOpen: boolean;
    user: User | null;
  }>({ isOpen: false, user: null })
  const [hasLoaded, setHasLoaded] = useState(false)
  const { toast } = useToast()

  // Helper function to extract error message from API response
  const getErrorMessage = (error: any): string => {
    
    // Handle array of error objects with code and description
    if (Array.isArray(error?.response?.data)) {
      return error.response.data
        .map((err: any) => err.description || err.message || err)
        .join('; ')
    }
    
    // Handle validation errors object
    if (error?.response?.data?.errors) {
      const errors = error.response.data.errors
      const errorMessages = Object.entries(errors)
        .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
        .join('; ')
      return errorMessages
    }
    
    // Handle single error object with description
    if (error?.response?.data?.description) {
      return error.response.data.description
    }
    
    // Handle API error titles
    if (error?.response?.data?.title) {
      return error.response.data.title
    }
    
    // Handle API error details
    if (error?.response?.data?.detail) {
      return error.response.data.detail
    }
    
    // Handle Axios error response data
    if (error?.response?.data) {
      return JSON.stringify(error.response.data)
    }
    
    // Handle general error messages
    if (error?.message) {
      return error.message
    }
    
    // Handle case where error is a string
    if (typeof error === 'string') {
      return error
    }
    
    // Fallback message with error type info
    return `An unexpected error occurred: ${typeof error}`
  }

  useEffect(() => {
    if (!hasLoaded) {
      loadUsers()
    }
  }, [hasLoaded])

  const loadUsers = async () => {
    if (hasLoaded) return // Prevent duplicate calls
    
    try {
      setLoading(true)
      const userProfiles = await UserService.getAllUsers()
      
      // Convert UserProfile to User format and load additional data
      const usersWithDetails = await Promise.all(
        userProfiles.map(async (profile) => {
          const [permissions, project_ids] = await Promise.all([
            UserService.getUserPermissions(profile.id),
            UserService.getUserProjects(profile.id)
          ])
          
          return {
            id: profile.id,
            email: profile.email,
            firstName: profile.firstName || "Unknown",
            lastName: profile.lastName || "User",
            role: profile.role || "user",
            department: profile.department || "",
            permissions,
            project_ids,
            isActive: profile.isActive,
            lastLogin: profile.lastLogin,
            createdAt: profile.createdAt
          }
        })
      )
      
      setUsers(usersWithDetails)
      setHasLoaded(true) // Mark as loaded to prevent duplicate calls
    } catch (error) {
      console.error("Error loading users:", error)
      toast({
        title: "Error Loading Users",
        description: getErrorMessage(error),
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddUser = () => {
    setEditingUser(undefined)
    setIsFormOpen(true)
  }

  const handleEditUser = (user: User) => {
    setEditingUser(user)
    setIsFormOpen(true)
  }

  const handleSubmitUser = async (userData: User) => {
    try {
      if (editingUser) {
        // Update existing user
        await UserService.updateUser(editingUser.id, {
          Id: editingUser.id,
          UserName: editingUser.email, // Use email as username
          Email: userData.email,
          FirstName: userData.firstName,
          LastName: userData.lastName,
          Department: userData.department,
          Role: userData.role,
          IsActive: userData.isActive,
          Permissions: userData.permissions,
          ProjectIds: userData.project_ids
        })
        
        // Update user projects separately
        if (userData.project_ids && userData.project_ids.length > 0) {
          await UserService.updateUserProjects(editingUser.id, userData.project_ids)
        }
        
        toast({
          title: "User Updated",
          description: `${userData.firstName} ${userData.lastName} has been updated successfully.`,
        })
      } else {
        // Create new user
        await UserService.createUser({
          UserName: userData.email, // Use email as username
          Email: userData.email,
          FirstName: userData.firstName,
          LastName: userData.lastName,
          Department: userData.department,
          Password: userData.password || "",
          Role: userData.role,
          IsActive: userData.isActive,
          Permissions: userData.permissions,
          ProjectIds: userData.project_ids
        })
        
        toast({
          title: "User Created",
          description: `${userData.firstName} ${userData.lastName} has been created successfully.`,
        })
      }
      
      // Reload users to get updated data
      setHasLoaded(false) // Reset flag to allow reload
      await loadUsers()
      setIsFormOpen(false)
      setEditingUser(undefined)
    } catch (error) {
      console.error("Error saving user:", error)
      toast({
        title: "Error Saving User",
        description: getErrorMessage(error),
        variant: "destructive"
      })
    }
  }

  const handleDeleteUser = (user: User) => {
    setDeleteConfirmation({ isOpen: true, user });
  };

  const confirmDelete = async () => {
    if (!deleteConfirmation.user) return;
    
    try {
      await UserService.deleteUser(deleteConfirmation.user.id)
      
      toast({
        title: "User Deleted",
        description: `${deleteConfirmation.user.firstName || 'Unknown'} ${deleteConfirmation.user.lastName || 'User'} has been deleted successfully.`,
      })
      
      // Reload users to get updated data
      setHasLoaded(false) // Reset flag to allow reload
      await loadUsers()
      setDeleteConfirmation({ isOpen: false, user: null });
    } catch (error) {
      console.error("Error deleting user:", error)
      toast({
        title: "Error Deleting User",
        description: getErrorMessage(error),
        variant: "destructive"
      })
    }
  }

  const handleToggleStatus = async (userId: string) => {
    try {
      const user = users.find((u) => u.id === userId)
      const newStatus = !user?.isActive
      
      await UserService.toggleUserStatus(userId, newStatus)
      
      toast({
        title: "Status Updated",
        description: `${user?.firstName} ${user?.lastName} has been ${newStatus ? "activated" : "deactivated"}.`,
      })
      
      // Reload users to get updated data
      setHasLoaded(false) // Reset flag to allow reload
      await loadUsers()
    } catch (error) {
      console.error("Error updating user status:", error)
      toast({
        title: "Error Updating User Status",
        description: getErrorMessage(error),
        variant: "destructive"
      })
    }
  }

  const handleResetPassword = (userId: string) => {
    const user = users.find((u) => u.id === userId)
    setPasswordResetDialog({ isOpen: true, user: user || null })
  }

  const handleConfirmPasswordReset = async (newPassword: string) => {
    if (!passwordResetDialog.user) return

    try {
      await UserService.resetUserPassword(passwordResetDialog.user.id, newPassword)
      
      toast({
        title: "Password Reset",
        description: `Password has been reset for ${passwordResetDialog.user.firstName} ${passwordResetDialog.user.lastName}.`,
      })
      
      setPasswordResetDialog({ isOpen: false, user: null })
    } catch (error) {
      console.error("Error resetting password:", error)
      toast({
        title: "Error Resetting Password",
        description: getErrorMessage(error),
        variant: "destructive"
      })
    }
  }

  const stats = {
    total: users.length,
    active: users.filter((u) => u.isActive).length,
    inactive: users.filter((u) => !u.isActive).length,
    admins: users.filter((u) => u.role && typeof u.role === 'string' && u.role.toLowerCase().includes("admin")).length,
  }

  return (
    <ProtectedRoute>
      <LayoutWrapper title="User Management" description="Manage system users, roles, and permissions">
        <div className="space-y-6">
          <div className="flex justify-end items-center">
            <Button onClick={handleAddUser} className="bg-cyan-600 hover:bg-cyan-700 cursor-pointer">
              <Plus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <UserCheck className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.active}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Inactive Users</CardTitle>
                <UserX className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.inactive}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Administrators</CardTitle>
                <Shield className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.admins}</div>
              </CardContent>
            </Card>
          </div>

          {/* User Table */}
          <UserTable
            users={users}
            onEdit={handleEditUser}
            onDelete={handleDeleteUser}
            onToggleStatus={handleToggleStatus}
            onResetPassword={handleResetPassword}
          />

          {/* User Form Dialog */}
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingUser ? "Edit User" : "Add New User"}</DialogTitle>
              </DialogHeader>
              <UserForm key={editingUser?.id || 'new'} user={editingUser} onSubmit={handleSubmitUser} onCancel={() => setIsFormOpen(false)} />
            </DialogContent>
          </Dialog>

          {/* Delete Confirmation Dialog */}
          <ConfirmationDialog
            isOpen={deleteConfirmation.isOpen}
            onClose={() => setDeleteConfirmation({ isOpen: false, user: null })}
            onConfirm={confirmDelete}
            title="Delete User"
            description={`Are you sure you want to delete user "${deleteConfirmation.user?.firstName || 'Unknown'} ${deleteConfirmation.user?.lastName || 'User'}" (${deleteConfirmation.user?.email})? This action cannot be undone.`}
            confirmText="Delete"
            cancelText="Cancel"
            variant="destructive"
          />

          {/* Password Reset Dialog */}
          <PasswordResetDialog
            isOpen={passwordResetDialog.isOpen}
            onClose={() => setPasswordResetDialog({ isOpen: false, user: null })}
            onConfirm={handleConfirmPasswordReset}
            user={passwordResetDialog.user}
            loading={loading}
          />
        </div>
      </LayoutWrapper>
    </ProtectedRoute>
  )
}
