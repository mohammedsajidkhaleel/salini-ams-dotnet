"use client"

import type React from "react"

import { Sidebar } from "@/components/sidebar"
import { UserHeader } from "@/components/user-header"
import { ProtectedRoute } from "@/components/protected-route"

interface LayoutWrapperProps {
  children: React.ReactNode
  title: string
  description?: string
}

export function LayoutWrapper({ children, title, description }: LayoutWrapperProps) {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">{title}</h1>
              {description && <p className="text-muted-foreground">{description}</p>}
            </div>
            <UserHeader />
          </div>
          {children}
        </div>
      </main>
    </div>
  )
}
