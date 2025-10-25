"use client"

import { useState, useEffect, useRef } from "react"
import { SimCardPlanTable } from "@/components/sim-card-plan-table"
import { SimCardPlanForm } from "@/components/sim-card-plan-form"
import { SimCardPlanDetails } from "@/components/sim-card-plan-details"
import { SimCardPlanService, SimCardPlan, SimProvider } from "@/lib/services/simCardPlanService"

interface SimCardPlanPageProps {
  // No props needed as this is a standalone page
}

export function SimCardPlanPage({}: SimCardPlanPageProps) {
  const [data, setData] = useState<SimCardPlan[]>([])
  const [providers, setProviders] = useState<SimProvider[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingPlan, setEditingPlan] = useState<SimCardPlan | undefined>(undefined)
  const [viewingPlan, setViewingPlan] = useState<SimCardPlan | null>(null)
  const [loading, setLoading] = useState(false)
  const isLoadingRef = useRef(false)
  const hasLoadedRef = useRef(false)

  const loadData = async () => {
    // Prevent multiple simultaneous calls
    if (isLoadingRef.current) {
      console.log('SIM Card Plans API call already in progress, skipping...')
      return
    }

    try {
      console.log('Loading SIM card plans and providers data...')
      isLoadingRef.current = true
      setLoading(true)
      
      const [plans, providersData] = await Promise.all([
        SimCardPlanService.getAll(),
        SimCardPlanService.getProviders()
      ])
      
      setData(plans)
      setProviders(providersData)
      hasLoadedRef.current = true
    } catch (error) {
      console.error('Error loading SIM card plans:', error)
    } finally {
      setLoading(false)
      isLoadingRef.current = false
    }
  }

  useEffect(() => {
    // Only load if not already loaded
    if (!hasLoadedRef.current) {
      loadData()
    }
  }, [])

  const handleAdd = () => {
    setEditingPlan(undefined)
    setShowForm(true)
  }

  const handleEdit = (plan: SimCardPlan) => {
    setEditingPlan(plan)
    setShowForm(true)
  }

  const handleView = (plan: SimCardPlan) => {
    setViewingPlan(plan)
  }

  const handleDelete = async (id: string): Promise<void> => {
    if (!confirm("Are you sure you want to delete this SIM card plan?")) {
      return
    }

    try {
      await SimCardPlanService.delete(id)
      setData(prev => prev.filter(plan => plan.id !== id))
    } catch (error) {
      console.error('Error deleting SIM card plan:', error)
      alert("Failed to delete SIM card plan. Please try again.")
    }
  }

  const handleSubmit = async (planData: any) => {
    try {
      if (editingPlan) {
        // Update existing plan
        await SimCardPlanService.update(editingPlan.id, planData)
        
        // Update local state
        setData(prev => prev.map(plan =>
          plan.id === editingPlan.id
            ? { ...plan, ...planData, status: (planData.is_active ? "active" : "inactive") as "active" | "inactive" }
            : plan
        ))
      } else {
        // Add new plan
        const newPlan = await SimCardPlanService.create(planData)
        setData(prev => [newPlan, ...prev])
      }

      setShowForm(false)
      setEditingPlan(undefined)
    } catch (error) {
      console.error('Error submitting SIM card plan:', error)
      alert("Failed to save SIM card plan. Please try again.")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading SIM Card Plans...</div>
      </div>
    )
  }

  return (
    <>
      <SimCardPlanTable
        simCardPlans={data}
        providers={providers}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onAdd={handleAdd}
        onView={handleView}
      />
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <SimCardPlanForm
              simCardPlan={editingPlan}
              providers={providers}
              onSubmit={handleSubmit}
              onCancel={() => {
                setShowForm(false)
                setEditingPlan(undefined)
              }}
            />
          </div>
        </div>
      )}
      <SimCardPlanDetails
        simCardPlan={viewingPlan}
        isOpen={!!viewingPlan}
        onClose={() => setViewingPlan(null)}
      />
    </>
  )
}
