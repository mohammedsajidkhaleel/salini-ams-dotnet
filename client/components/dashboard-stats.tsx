"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, Users, ShoppingCart, Smartphone } from "lucide-react"
import { apiCache, cacheKeys } from "@/lib/cache"
import { apiClient } from "@/lib/apiClient"
import { useAuth } from "@/contexts/auth-context-new"

interface DashboardStats {
  totalAssets: number
  totalEmployees: number
  totalProjects: number
  simCards: number
}

export function DashboardStats() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    totalAssets: 0,
    totalEmployees: 0,
    totalProjects: 0,
    simCards: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        // Create cache key that includes user ID for proper caching per user
        const cacheKey = `dashboard_stats_${user.id}`
        
        // Check cache first
        const cachedStats = apiCache.get<DashboardStats>(cacheKey)
        if (cachedStats) {
          setStats(cachedStats)
          setLoading(false)
          return
        }

        console.log('📊 Dashboard Stats - Fetching data for user:', {
          userId: user.id,
          userRole: user.role,
          assignedProjectIds: user.projectIds
        })

        // Fetch dashboard stats from the new API endpoint that handles filtering server-side
        const response = await apiClient.get('/api/Dashboard/stats')
        const apiStats = response.data

        const newStats: DashboardStats = {
          totalAssets: apiStats.totalAssets || 0,
          totalEmployees: apiStats.totalEmployees || 0,
          totalProjects: apiStats.totalProjects || 0,
          simCards: apiStats.simCards || 0,
        }

        console.log('✅ Dashboard Stats - Server-side filtered data:', {
          userId: user.id,
          userRole: user.role,
          totalAssets: newStats.totalAssets,
          totalEmployees: newStats.totalEmployees,
          totalProjects: newStats.totalProjects,
          simCards: newStats.simCards
        })

        setStats(newStats)
        
        // Cache the results for 2 minutes
        apiCache.set(cacheKey, newStats, 2 * 60 * 1000)
      } catch (error) {
        console.error("Error fetching dashboard stats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [user?.id])

  const statsData = [
    {
      title: "Total Assets",
      value: loading ? "..." : stats.totalAssets.toLocaleString(),
      icon: Package,
      color: "text-chart-1",
    },
    {
      title: "Active Employees",
      value: loading ? "..." : stats.totalEmployees.toLocaleString(),
      icon: Users,
      color: "text-chart-2",
    },
    {
      title: "Total Projects",
      value: loading ? "..." : stats.totalProjects.toLocaleString(),
      icon: ShoppingCart,
      color: "text-chart-3",
    },
    {
      title: "SIM Cards",
      value: loading ? "..." : stats.simCards.toLocaleString(),
      icon: Smartphone,
      color: "text-chart-4",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statsData.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">
              Real-time data from database
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
