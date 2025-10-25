"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import { useAuth } from "@/contexts/auth-context-new"
import { LoginForm } from "@/components/login-form"
import { Loader2 } from "lucide-react"
import { ClientOnly } from "@/components/client-only"

interface ProtectedRouteProps {
  children: React.ReactNode
}

function ProtectedRouteContent({ children }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [hasAttemptedAuth, setHasAttemptedAuth] = useState(false)

  useEffect(() => {
    // Give token refresh a chance to complete before redirecting
    if (!isLoading) {
      // Set a small timeout to allow any ongoing token refresh to complete
      const timer = setTimeout(() => {
        setHasAttemptedAuth(true)
      }, 500) // 500ms grace period for token refresh

      return () => clearTimeout(timer)
    }
  }, [isLoading])

  useEffect(() => {
    // If user is not authenticated after auth attempt, redirect to login
    if (hasAttemptedAuth && !user && typeof window !== 'undefined') {
      // Only redirect if we're not already on the login page
      if (window.location.pathname !== '/login') {
        console.log('🔒 No authenticated user, redirecting to login')
        router.push('/login')
      }
    }
  }, [user, hasAttemptedAuth, router])

  // Show loading while auth is loading or during grace period
  if (isLoading || (!hasAttemptedAuth && !user)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-600 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Verifying authentication...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <LoginForm />
  }

  return <>{children}</>
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  return (
    <ClientOnly
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
        </div>
      }
    >
      <ProtectedRouteContent>{children}</ProtectedRouteContent>
    </ClientOnly>
  )
}
