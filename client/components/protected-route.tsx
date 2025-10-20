"use client"

import type React from "react"
import { useEffect } from "react"
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

  useEffect(() => {
    // If user is not authenticated and not loading, redirect to login
    if (!isLoading && !user && typeof window !== 'undefined') {
      // Only redirect if we're not already on the login page
      if (window.location.pathname !== '/login') {
        router.push('/login')
      }
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
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
