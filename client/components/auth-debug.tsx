"use client"

import { useAuth } from "@/contexts/auth-context-new"

export function AuthDebug() {
  const { user, isAuthenticated, isLoading } = useAuth()

  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return null; //(
    // <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded-lg text-xs max-w-sm">
    //   <h3 className="font-bold mb-2">Auth Debug</h3>
    //   <div>Loading: {isLoading ? 'Yes' : 'No'}</div>
    //   <div>Authenticated: {isAuthenticated ? 'Yes' : 'No'}</div>
    //   <div>User: {user ? `${user.firstName} ${user.lastName}` : 'None'}</div>
    //   <div>Email: {user?.email || 'None'}</div>
    //   <div>Role: {user?.role || 'None'}</div>
    // </div>
  //)
}
