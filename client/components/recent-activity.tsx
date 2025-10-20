"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { auditService, type RecentActivity } from "@/lib/auditService"
import { apiCache } from "@/lib/cache"

// Use the RecentActivity interface from auditService

export function RecentActivity() {
  const [activities, setActivities] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRecentActivity = async () => {
      try {
        console.log('📊 RecentActivity: Starting fetch...')
        const cacheKey = 'recent_activity'
        
        // Check cache first
        const cachedActivities = apiCache.get<RecentActivity[]>(cacheKey)
        if (cachedActivities) {
          console.log('📊 RecentActivity: Using cached data')
          setActivities(cachedActivities)
          setLoading(false)
          return
        }

        console.log('📊 RecentActivity: Fetching from audit log...')
        // Fetch recent activities from audit log (single query instead of multiple)
        const recentActivities = await auditService.getRecentActivities(6)
        setActivities(recentActivities)
        
        // Cache the results for 1 minute (shorter TTL for activity data)
        apiCache.set(cacheKey, recentActivities, 1 * 60 * 1000)
        console.log('📊 RecentActivity: Fetch completed, cached results')
      } catch (error) {
        console.error("Error fetching recent activity:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchRecentActivity()
  }, [])


  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded animate-pulse w-3/4"></div>
                  <div className="h-3 bg-muted rounded animate-pulse w-1/2"></div>
                </div>
                <div className="h-6 bg-muted rounded animate-pulse w-16"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No recent activity found
            </div>
          ) : (
            activities.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {activity.action}: {activity.item}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    by {activity.user} • {activity.time}
                  </p>
                </div>
                <Badge variant={activity.status === "active" || activity.status === "completed" ? "default" : "secondary"}>
                  {activity.status}
                </Badge>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
