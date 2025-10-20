"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { navigationService } from "@/lib/navigation"

/**
 * Navigation Provider Component
 * Sets up the router for the navigation service so it can be used outside of React components
 */
export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  useEffect(() => {
    // Set the router instance for the navigation service
    navigationService.setRouter(router)
  }, [router])

  return <>{children}</>
}
