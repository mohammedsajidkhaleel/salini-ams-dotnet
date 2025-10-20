"use client"

import { Sidebar } from "@/components/sidebar"
import { DashboardStats } from "@/components/dashboard-stats"
import { RecentActivity } from "@/components/recent-activity"
import { LazyLoadWrapper } from "@/components/lazy-load-wrapper"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ProtectedRoute } from "@/components/protected-route"
import { UserHeader } from "@/components/user-header"
import { useRouter } from "next/navigation"

export default function Dashboard() {
  const router = useRouter()

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
                <p className="text-muted-foreground">Welcome to your IT Asset Management System</p>
              </div>
              <UserHeader />
            </div>

            {/* Stats Cards */}
            <DashboardStats />

            {/* Content Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* Recent Activity */}
              <div className="lg:col-span-2">
                <LazyLoadWrapper>
                  <RecentActivity />
                </LazyLoadWrapper>
              </div>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <button
                    onClick={() => router.push("/assets")}
                    className="w-full text-left p-3 rounded-lg border border-border hover:bg-muted transition-colors cursor-pointer"
                  >
                    <div className="font-medium">Add New Asset</div>
                    <div className="text-sm text-muted-foreground">Register a new IT asset</div>
                  </button>
                  <button
                    onClick={() => router.push("/purchase-orders")}
                    className="w-full text-left p-3 rounded-lg border border-border hover:bg-muted transition-colors cursor-pointer"
                  >
                    <div className="font-medium">Create Purchase Order</div>
                    <div className="text-sm text-muted-foreground">Request new equipment</div>
                  </button>
                  <button
                    onClick={() => router.push("/employees")}
                    className="w-full text-left p-3 rounded-lg border border-border hover:bg-muted transition-colors cursor-pointer"
                  >
                    <div className="font-medium">Assign Asset</div>
                    <div className="text-sm text-muted-foreground">Assign asset to employee</div>
                  </button>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
