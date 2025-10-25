"use client"

import { useState, useEffect, useRef } from "react"
import { Sidebar } from "@/components/sidebar"
import { DashboardStats } from "@/components/dashboard-stats"
import { DashboardLicenseAlerts } from "@/components/dashboard-license-alerts"
import { DashboardInventoryList } from "@/components/dashboard-inventory-list"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ProtectedRoute } from "@/components/protected-route"
import { UserHeader } from "@/components/user-header"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context-new"
import { SoftwareLicenseService, type SoftwareLicense } from "@/lib/softwareLicenseService"
import { inventoryService, type InventoryItem } from "@/lib/services/inventoryService"
import { ProjectService, type Project } from "@/lib/services/projectService"

export default function Dashboard() {
  const router = useRouter()
  const { user } = useAuth()
  const [licenses, setLicenses] = useState<SoftwareLicense[]>([])
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const hasLoaded = useRef(false)

  // Load data on component mount
  useEffect(() => {
    if (user && !hasLoaded.current) {
      hasLoaded.current = true
      loadDashboardData()
    }
  }, [user?.id])

  const loadDashboardData = async () => {
    if (!user) return

    try {
      setLoading(true)

      // Load projects
      const projectsData = await ProjectService.getAll()
      setProjects(projectsData)

      // Load software licenses
      try {
        const licensesData = await SoftwareLicenseService.getSoftwareLicensesForUser(user.id)
        setLicenses(licensesData)
      } catch (error) {
        console.error("Error loading licenses:", error)
        setLicenses([])
      }

      // Load inventory data
      try {
        const inventoryData = await inventoryService.getInventorySummary()
        setInventoryItems(inventoryData)
      } catch (error) {
        console.error("Error loading inventory:", error)
        setInventoryItems([])
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

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

            {/* License Alerts */}
            {!loading && <DashboardLicenseAlerts licenses={licenses} />}

            {/* Content Grid */}
            <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
              {/* Inventory List */}
              <div className="lg:col-span-2">
                {loading ? (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-center py-8">
                        <div className="text-muted-foreground">Loading inventory...</div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <DashboardInventoryList inventoryItems={inventoryItems} projects={projects} />
                )}
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
