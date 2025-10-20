"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAuth } from "@/contexts/auth-context-new"
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  Smartphone,
  FileText,
  Shield,
  Settings,
  ChevronLeft,
  ChevronRight,
  Warehouse,
  Building2,
  FolderOpen,
  Briefcase,
  MapPin,
  Globe,
  UserCheck,
  Tag,
  Box,
  Wrench,
  Database,
  ChevronDown,
  ChevronUp,
} from "lucide-react"

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard, permission: null }, // Always visible
  { name: "Assets", href: "/assets", icon: Package, permission: "assets:read" },
  { name: "Inventory", href: "/inventory", icon: Warehouse, permission: "assets:read" }, // Uses assets permission
  { name: "Employees", href: "/employees", icon: Users, permission: "employees:read" },
  { name: "Purchase Orders", href: "/purchase-orders", icon: ShoppingCart, permission: "purchase_orders:read" },
  { name: "SIM Cards", href: "/sim-cards", icon: Smartphone, permission: "sim_cards:read" },
  { name: "Software Licenses", href: "/software-licenses", icon: Shield, permission: "software_licenses:read" },
  { name: "Reports", href: "/reports", icon: FileText, permission: "reports:read" },
  { name: "User Management", href: "/user-management", icon: Users, permission: "users:read" },
]

const masterDataNavigation = [
  { name: "Projects", href: "/master-data/projects", icon: Briefcase, permission: "master_data:read" },
  { name: "Departments", href: "/master-data/departments", icon: Building2, permission: "master_data:read" },
  { name: "Sub Departments", href: "/master-data/sub-departments", icon: FolderOpen, permission: "master_data:read" },
  { name: "Companies", href: "/master-data/companies", icon: Building2, permission: "master_data:read" },
  { name: "Cost Centers", href: "/master-data/cost-centers", icon: MapPin, permission: "master_data:read" },
  { name: "Employee Categories", href: "/master-data/employee-categories", icon: UserCheck, permission: "master_data:read" },
  { name: "Employee Positions", href: "/master-data/employee-positions", icon: Briefcase, permission: "master_data:read" },
  { name: "Nationalities", href: "/master-data/nationalities", icon: Globe, permission: "master_data:read" },
  { name: "Vendors", href: "/master-data/vendors", icon: Building2, permission: "master_data:read" },
  { name: "Item Categories", href: "/master-data/item-categories", icon: Tag, permission: "master_data:read" },
  { name: "Items", href: "/master-data/items", icon: Box, permission: "master_data:read" },
  { name: "Accessories", href: "/master-data/accessories", icon: Wrench, permission: "master_data:read" },
  { name: "SIM Card Plans", href: "/master-data/sim-card-plans", icon: Smartphone, permission: "master_data:read" },
  { name: "SIM Providers", href: "/master-data/sim-providers", icon: Smartphone, permission: "master_data:read" },
  { name: "SIM Types", href: "/master-data/sim-types", icon: Smartphone, permission: "master_data:read" },
  { name: "Asset Models", href: "/master-data/asset-models", icon: Package, permission: "master_data:read" },
]

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const [masterDataExpanded, setMasterDataExpanded] = useState(false)
  const pathname = usePathname()
  const { user } = useAuth()
  
  // Check if current path is in master data section
  const isMasterDataActive = pathname.startsWith('/master-data')

  // Helper function to check if user has permission
  const hasPermission = (permission: string | null): boolean => {
    if (!permission) return true // No permission required
    if (!user) return false
    
    // Debug logging
    console.log('🔍 Checking permission:', {
      permission,
      userRole: user.role,
      userPermissions: user.permissions,
      hasPermission: user.permissions?.includes(permission)
    })
    
    // SuperAdmin and Admin have all permissions
    if (user.role === 'SuperAdmin' || user.role === 'Admin') {
      return true
    }
    
    // Check specific permission
    return user.permissions?.includes(permission) || false
  }

  // Filter navigation items based on permissions
  const filteredNavigation = navigation.filter(item => hasPermission(item.permission))
  const filteredMasterDataNavigation = masterDataNavigation.filter(item => hasPermission(item.permission))
  
  // Debug logging
  console.log('📋 Navigation filtering:', {
    totalNavigation: navigation.length,
    filteredNavigation: filteredNavigation.length,
    filteredItems: filteredNavigation.map(item => ({ name: item.name, permission: item.permission })),
    totalMasterData: masterDataNavigation.length,
    filteredMasterData: filteredMasterDataNavigation.length
  })
  
  // Check if user has any master data permissions
  const hasMasterDataAccess = filteredMasterDataNavigation.length > 0

  return (
    <div
      className={cn(
        "flex flex-col h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300",
        collapsed ? "w-16" : "w-64",
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        {!collapsed && <h1 className="text-lg font-bold text-sidebar-foreground">IT Assets</h1>}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="text-sidebar-foreground hover:bg-sidebar-accent"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-2">
          {filteredNavigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link key={item.name} href={item.href}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3 hover:bg-sidebar-accent cursor-pointer",
                    isActive
                      ? "bg-cyan-600 text-white hover:bg-cyan-700"
                      : "text-gray-700 hover:text-gray-900 hover:bg-gray-100",
                    collapsed && "justify-center px-2",
                  )}
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  {!collapsed && <span>{item.name}</span>}
                </Button>
              </Link>
            )
          })}
          
          {/* Master Data Section - Only show if user has master data access */}
          {!collapsed && hasMasterDataAccess && (
            <div className="pt-4">
              <Button
                variant="ghost"
                onClick={() => setMasterDataExpanded(!masterDataExpanded)}
                className={cn(
                  "w-full justify-between gap-3 hover:bg-sidebar-accent cursor-pointer",
                  isMasterDataActive
                    ? "bg-cyan-50 text-cyan-700 hover:bg-cyan-100"
                    : "text-gray-700 hover:text-gray-900 hover:bg-gray-100",
                )}
              >
                <div className="flex items-center gap-3">
                  <Database className="h-4 w-4 flex-shrink-0" />
                  <span>Master Data</span>
                </div>
                {masterDataExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
              
              {masterDataExpanded && (
                <div className="ml-4 mt-2 space-y-1">
                  {filteredMasterDataNavigation.map((item) => {
                    const isActive = pathname === item.href
                    return (
                      <Link key={item.name} href={item.href}>
                        <Button
                          variant={isActive ? "default" : "ghost"}
                          className={cn(
                            "w-full justify-start gap-3 hover:bg-sidebar-accent cursor-pointer text-sm",
                            isActive
                              ? "bg-cyan-600 text-white hover:bg-cyan-700"
                              : "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
                          )}
                        >
                          <item.icon className="h-3 w-3 flex-shrink-0" />
                          <span>{item.name}</span>
                        </Button>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )}
          
        </nav>
      </ScrollArea>
    </div>
  )
}
