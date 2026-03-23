"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { UserForm } from "@/components/user-form"
import { useToast } from "@/hooks/use-toast"
import { ProtectedRoute } from "@/components/protected-route"
import { LayoutWrapper } from "@/components/layout-wrapper"
import { UserService, type UserProfile } from "@/lib/userService"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

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
  createdAt?: string
}

export default function EditUserPage() {
  const router = useRouter()
  const params = useParams()
  const userId = params.id as string
  const isNewUser = userId === "new"
  
  const [user, setUser] = useState<User | undefined>()
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const hasLoadedRef = useRef(false)

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
    // Prevent duplicate calls
    if (hasLoadedRef.current) {
      return
    }
    
    if (!isNewUser && userId) {
      hasLoadedRef.current = true
      loadUser()
    } else {
      setLoading(false)
    }
  }, [userId, isNewUser])

  const loadUser = async () => {
    try {
      setLoading(true)
      const userProfile = await UserService.getUserById(userId)
      
      if (!userProfile) {
        throw new Error("User not found")
      }
      
      const [permissions, project_ids] = await Promise.all([
        UserService.getUserPermissions(userId),
        UserService.getUserProjects(userId)
      ])
      
      setUser({
        id: userProfile.id,
        email: userProfile.email,
        firstName: userProfile.firstName || "Unknown",
        lastName: userProfile.lastName || "User",
        role: userProfile.role || "user",
        department: userProfile.department || "",
        permissions,
        project_ids,
        isActive: userProfile.isActive,
        lastLogin: userProfile.lastLogin,
        createdAt: userProfile.createdAt
      })
    } catch (error) {
      console.error("Error loading user:", error)
      hasLoadedRef.current = false // Reset on error to allow retry
      toast({
        title: "Error Loading User",
        description: getErrorMessage(error),
        variant: "destructive"
      })
      router.push("/user-management")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (userData: User) => {
    try {
      if (isNewUser) {
        // Create new user
        await UserService.createUser({
          UserName: userData.email,
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
      } else {
        // Update existing user - send all data in one call (basic info, permissions, and projects)
        await UserService.updateUser(userId, {
          Id: userId,
          UserName: user?.email || userData.email,
          Email: userData.email,
          FirstName: userData.firstName,
          LastName: userData.lastName,
          Department: userData.department,
          Role: userData.role,
          IsActive: userData.isActive,
          Permissions: userData.permissions || [],
          ProjectIds: userData.project_ids || []
        })
        
        toast({
          title: "User Updated",
          description: `${userData.firstName} ${userData.lastName} has been updated successfully.`,
        })
      }
      
      // Navigate back to user management page
      router.push("/user-management")
    } catch (error) {
      console.error("Error saving user:", error)
      toast({
        title: "Error Saving User",
        description: getErrorMessage(error),
        variant: "destructive"
      })
    }
  }

  const handleCancel = () => {
    router.push("/user-management")
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <LayoutWrapper title={isNewUser ? "Add New User" : "Edit User"} description={isNewUser ? "Create a new user account" : "Edit user details"}>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        </LayoutWrapper>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <LayoutWrapper 
        title={isNewUser ? "Add New User" : "Edit User"} 
        description={isNewUser ? "Create a new user account" : "Edit user details, permissions, and project assignments"}
      >
        <div className="space-y-6">
          <Button
            variant="ghost"
            onClick={handleCancel}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to User Management
          </Button>
          
          <UserForm 
            user={user} 
            onSubmit={handleSubmit} 
            onCancel={handleCancel} 
          />
        </div>
      </LayoutWrapper>
    </ProtectedRoute>
  )
}

