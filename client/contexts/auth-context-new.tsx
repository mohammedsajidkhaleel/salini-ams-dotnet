"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { authService, type User, type AuthState } from "@/lib/authService"

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  isLoading: boolean
  refreshUser: () => Promise<void>
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  })

  // Subscribe to auth state changes
  useEffect(() => {
    const unsubscribe = authService.subscribe((state) => {
      setAuthState(state)
    })

    // Initialize auth service
    authService.initialize().finally(() => {
      setAuthState(prev => ({ ...prev, isLoading: false }))
    })

    return unsubscribe
  }, [])

  // Listen for storage changes (e.g., when token is cleared by another tab)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth_token' && !e.newValue) {
        // Token was cleared, update auth state
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        })
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    setAuthState(prev => ({ ...prev, isLoading: true }))
    
    try {
      const result = await authService.login(email, password)
      
      if (result.success) {
        // Auth state will be updated via subscription
        return true
      } else {
        setAuthState(prev => ({ ...prev, isLoading: false }))
        return false
      }
    } catch (error) {
      console.error('Login error:', error)
      setAuthState(prev => ({ ...prev, isLoading: false }))
      return false
    }
  }

  const logout = async (): Promise<void> => {
    setAuthState(prev => ({ ...prev, isLoading: true }))
    
    try {
      await authService.logout()
      // Auth state will be updated via subscription
    } catch (error) {
      console.error('Logout error:', error)
      // Even if logout fails, clear the state
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      })
    }
  }

  const refreshUser = async (): Promise<void> => {
    setAuthState(prev => ({ ...prev, isLoading: true }))
    
    try {
      const result = await authService.refreshUser()
      if (!result.success) {
        console.warn('Failed to refresh user:', result.error)
      }
      // Auth state will be updated via subscription
    } catch (error) {
      console.error('Refresh user error:', error)
      setAuthState(prev => ({ ...prev, isLoading: false }))
    }
  }

  const contextValue: AuthContextType = {
    user: authState.user,
    login,
    logout,
    isLoading: authState.isLoading,
    refreshUser,
    isAuthenticated: authState.isAuthenticated,
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
