"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { UserHeader } from "@/components/user-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Download, Printer, BarChart3, PieChart, TrendingUp } from "lucide-react"
import { AssetAllocationReport } from "@/components/reports/asset-allocation-report"
import { ProtectedRoute } from "@/components/protected-route"

interface Report {
  id: string
  name: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  category: "allocation" | "inventory" | "financial" | "analytics"
  component: React.ComponentType<any>
}

const availableReports: Report[] = [
  {
    id: "asset-allocation",
    name: "Asset Allocation",
    description: "Current asset allocation showing assigned assets with employee details",
    icon: BarChart3,
    category: "allocation",
    component: AssetAllocationReport,
  },
  // Future reports can be added here
  // {
  //   id: "inventory-summary",
  //   name: "Inventory Summary",
  //   description: "Summary of all inventory items and their status",
  //   icon: PieChart,
  //   category: "inventory",
  //   component: InventorySummaryReport,
  // },
  // {
  //   id: "financial-report",
  //   name: "Financial Report",
  //   description: "Asset costs and depreciation analysis",
  //   icon: TrendingUp,
  //   category: "financial",
  //   component: FinancialReport,
  // },
]

const categoryColors = {
  allocation: "bg-blue-100 text-blue-800",
  inventory: "bg-green-100 text-green-800",
  financial: "bg-yellow-100 text-yellow-800",
  analytics: "bg-purple-100 text-purple-800",
}

const categoryLabels = {
  allocation: "Allocation",
  inventory: "Inventory",
  financial: "Financial",
  analytics: "Analytics",
}

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState<string | null>(null)

  const handleReportSelect = (reportId: string) => {
    setSelectedReport(reportId)
  }

  const handleBackToReports = () => {
    setSelectedReport(null)
  }

  if (selectedReport) {
    const report = availableReports.find(r => r.id === selectedReport)
    if (!report) return null

    const ReportComponent = report.component
    return (
      <ProtectedRoute>
        <div className="flex h-screen bg-background">
          <Sidebar />
          <main className="flex-1 overflow-auto">
            <div className="p-6 space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <Button
                    variant="ghost"
                    onClick={handleBackToReports}
                    className="mb-2"
                  >
                    ← Back to Reports
                  </Button>
                  <h1 className="text-3xl font-bold text-foreground">{report.name}</h1>
                  <p className="text-muted-foreground">{report.description}</p>
                </div>
                <UserHeader />
              </div>

              {/* Report Content */}
              <ReportComponent />
            </div>
          </main>
        </div>
      </ProtectedRoute>
    )
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
                <h1 className="text-3xl font-bold text-foreground">Reports</h1>
                <p className="text-muted-foreground">Generate and view system reports</p>
              </div>
              <UserHeader />
            </div>

            {/* Reports Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {availableReports.map((report) => {
                const IconComponent = report.icon
                return (
                  <Card key={report.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <IconComponent className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{report.name}</CardTitle>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${categoryColors[report.category]}`}>
                              {categoryLabels[report.category]}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground text-sm mb-4">
                        {report.description}
                      </p>
                      <Button 
                        onClick={() => handleReportSelect(report.id)}
                        className="w-full"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        View Report
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* Coming Soon Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  More Reports Coming Soon
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  We're working on additional reports including inventory summaries, financial analysis, 
                  and detailed analytics. Check back soon for more reporting capabilities.
                </p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}






























