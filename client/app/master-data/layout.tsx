"use client"

import { Sidebar } from "@/components/sidebar"
import { UserHeader } from "@/components/user-header"
import { ProtectedRoute } from "@/components/protected-route"

export default function MasterDataLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Master Data</h1>
                <p className="text-muted-foreground">Manage system master data and configurations</p>
              </div>
              <UserHeader />
            </div>
            {children}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
