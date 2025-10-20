"use client"

import type React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const settingsCategories = [
  { id: "projects", name: "Projects", description: "Manage project categories" },
  { id: "cost-centers", name: "Cost Centers", description: "Manage cost centers" },
  { id: "companies", name: "Companies", description: "Manage companies" },
  { id: "vendors", name: "Vendors", description: "Manage vendor information" },
  { id: "departments", name: "Departments", description: "Manage departments" },
  { id: "sub-departments", name: "Sub Departments", description: "Manage sub departments" },
  { id: "employee-categories", name: "Employee Categories", description: "Manage employee categories" },
  { id: "employee-positions", name: "Employee Positions", description: "Manage employee positions" },
  { id: "item-categories", name: "Item Categories", description: "Manage item categories (Laptop, Monitor, etc.)" },
  { id: "items", name: "Items", description: "Manage specific items (Lenovo i7, Dell XPS, etc.)" },
  { id: "asset-models", name: "Asset Models", description: "Manage asset models" },
  { id: "nationalities", name: "Nationalities", description: "Manage nationality options" },
  { id: "employee-sponsors", name: "Employee Sponsors", description: "Manage employee sponsors" },
  { id: "sim-card-plans", name: "SIM Card Plans", description: "Manage SIM card plans" },
]

interface SettingsLayoutProps {
  children: React.ReactNode
  activeCategory?: string
  onCategoryChange?: (category: string) => void
}

export function SettingsLayout({ children, activeCategory = "projects", onCategoryChange }: SettingsLayoutProps) {
  return (
    <div className="grid gap-6 md:grid-cols-4">
      {/* Settings Navigation */}
      <Card className="md:col-span-1">
        <CardHeader>
          <CardTitle>Master Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {settingsCategories.map((category) => (
            <Button
              key={category.id}
              variant={activeCategory === category.id ? "default" : "ghost"}
              className={cn(
                "w-full justify-start text-left h-auto p-3 cursor-pointer",
                activeCategory === category.id && "bg-primary text-primary-foreground",
              )}
              onClick={() => onCategoryChange?.(category.id)}
            >
              <div>
                <div className="font-medium">{category.name}</div>
                <div className="text-xs opacity-70">{category.description}</div>
              </div>
            </Button>
          ))}
        </CardContent>
      </Card>

      {/* Settings Content */}
      <div className="md:col-span-3">{children}</div>
    </div>
  )
}
