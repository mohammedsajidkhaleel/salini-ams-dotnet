"use client"

import { DepartmentPage } from "./DepartmentPage"
import { CompanyPage } from "./CompanyPage"
import { CostCenterPage } from "./CostCenterPage"
import { ProjectPage } from "./ProjectPage"
import { SubDepartmentPage } from "./SubDepartmentPage"
import { ItemPage } from "./ItemPage"
import { SimCardPlanPage } from "./SimCardPlanPage"
import { GenericMasterDataPage } from "./GenericMasterDataPage"

interface MasterDataRouterProps {
  category: string
}

const categoryTitles = {
  projects: "Projects",
  "cost-centers": "Cost Centers",
  companies: "Companies",
  vendors: "Vendors",
  departments: "Departments",
  "sub-departments": "Sub Departments",
  "employee-categories": "Employee Categories",
  "employee-positions": "Employee Positions",
  "item-categories": "Item Categories",
  items: "Items",
  accessories: "Accessories",
  nationalities: "Nationalities",
  "sim-card-plans": "SIM Card Plans",
  "sim-providers": "SIM Providers",
  "sim-types": "SIM Types",
  "asset-models": "Asset Models",
} as const

export function MasterDataRouter({ category }: MasterDataRouterProps) {
  // Route to specific components for complex categories
  switch (category) {
    case "departments":
      return <DepartmentPage />
    
    case "companies":
      return <CompanyPage />
    
    case "cost-centers":
      return <CostCenterPage />
    
    case "projects":
      return <ProjectPage />
    
    case "sub-departments":
      return <SubDepartmentPage />
    
    case "items":
      return <ItemPage />
    
    case "sim-card-plans":
      return <SimCardPlanPage />
    
    default:
      // Use generic component for simple categories
      const title = categoryTitles[category as keyof typeof categoryTitles] || category
      return <GenericMasterDataPage category={category} title={title} />
  }
}
