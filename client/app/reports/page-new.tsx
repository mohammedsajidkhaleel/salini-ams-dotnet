"use client";

import { useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { UserHeader } from "@/components/user-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, Printer, BarChart3, PieChart, TrendingUp, Users, Shield, Smartphone, Laptop } from "lucide-react";
import { AssetAllocationReport } from "@/components/reports/asset-allocation-report";
import { EmployeeReport } from "@/components/reports/employee-report";
import { SimCardReport } from "@/components/reports/sim-card-report";
import { SoftwareLicenseReport } from "@/components/reports/software-license-report";
import { ProtectedRoute } from "@/components/protected-route";
import { useAuth } from "@/contexts/auth-context-new";

interface Report {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  category: "allocation" | "inventory" | "financial" | "analytics" | "employee" | "compliance";
  component: React.ComponentType<any>;
  permissions?: string[];
}

const availableReports: Report[] = [
  {
    id: "asset-allocation",
    name: "Asset Allocation",
    description: "Current asset allocation showing assigned assets with employee details",
    icon: BarChart3,
    category: "allocation",
    component: AssetAllocationReport,
    permissions: ["assets.read"],
  },
  {
    id: "employee-report",
    name: "Employee Report",
    description: "Comprehensive employee information and asset assignments",
    icon: Users,
    category: "employee",
    component: EmployeeReport,
    permissions: ["employees.read"],
  },
  {
    id: "sim-card-report",
    name: "SIM Card Report",
    description: "SIM card usage, assignments, and plan details",
    icon: Smartphone,
    category: "inventory",
    component: SimCardReport,
    permissions: ["simcards.read"],
  },
  {
    id: "software-license-report",
    name: "Software License Report",
    description: "Software license status, expiry dates, and compliance tracking",
    icon: Shield,
    category: "compliance",
    component: SoftwareLicenseReport,
    permissions: ["softwarelicenses.read"],
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
];

const categoryColors = {
  allocation: "bg-blue-100 text-blue-800",
  inventory: "bg-green-100 text-green-800",
  financial: "bg-yellow-100 text-yellow-800",
  analytics: "bg-purple-100 text-purple-800",
  employee: "bg-indigo-100 text-indigo-800",
  compliance: "bg-red-100 text-red-800",
};

const categoryLabels = {
  allocation: "Allocation",
  inventory: "Inventory",
  financial: "Financial",
  analytics: "Analytics",
  employee: "Employee",
  compliance: "Compliance",
};

export default function ReportsPage() {
  const { user } = useAuth();
  const [selectedReport, setSelectedReport] = useState<string | null>(null);

  const handleReportSelect = (reportId: string) => {
    setSelectedReport(reportId);
  };

  const handleBackToReports = () => {
    setSelectedReport(null);
  };

  // Filter reports based on user permissions
  const getAvailableReports = () => {
    if (!user) return [];
    
    return availableReports.filter(report => {
      if (!report.permissions) return true; // No specific permissions required
      
      // Check if user has any of the required permissions
      return report.permissions.some(permission => 
        user.permissions?.includes(permission) || 
        user.role === 'SuperAdmin' || 
        user.role === 'Admin'
      );
    });
  };

  const filteredReports = getAvailableReports();

  if (selectedReport) {
    const report = availableReports.find(r => r.id === selectedReport);
    if (!report) return null;

    const ReportComponent = report.component;
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
    );
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

            {/* Quick Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Available Reports</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{filteredReports.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Based on your permissions
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Report Categories</CardTitle>
                  <PieChart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {new Set(filteredReports.map(r => r.category)).size}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Different report types
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Export Formats</CardTitle>
                  <Download className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">3</div>
                  <p className="text-xs text-muted-foreground">
                    CSV, PDF, Print
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Real-time Data</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">✓</div>
                  <p className="text-xs text-muted-foreground">
                    Live data updates
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Reports Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredReports.map((report) => {
                const IconComponent = report.icon;
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
                );
              })}
            </div>

            {/* No Reports Available */}
            {filteredReports.length === 0 && (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Reports Available</h3>
                    <p className="text-muted-foreground">
                      You don't have permission to view any reports. Please contact your administrator.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Coming Soon Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  More Reports Coming Soon
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  We're working on additional reports including inventory summaries, financial analysis, 
                  and detailed analytics. Check back soon for more reporting capabilities.
                </p>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                    <PieChart className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Inventory Summary</p>
                      <p className="text-sm text-muted-foreground">Complete inventory overview</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Financial Analysis</p>
                      <p className="text-sm text-muted-foreground">Cost and depreciation reports</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                    <BarChart3 className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Usage Analytics</p>
                      <p className="text-sm text-muted-foreground">Asset utilization trends</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                    <Shield className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Compliance Reports</p>
                      <p className="text-sm text-muted-foreground">Audit and compliance tracking</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
