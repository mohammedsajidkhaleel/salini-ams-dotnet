"use client"

import { useState, useEffect } from "react"
import { SimCardPlanTable } from "@/components/sim-card-plan-table"
import { SimCardPlanForm } from "@/components/sim-card-plan-form"
import { SimCardPlanDetails } from "@/components/sim-card-plan-details"
import { SimCardPlanService, SimCardPlan } from "@/lib/services/simCardPlanService"

interface SimCardPlanPageProps {
  // No props needed as this is a standalone page
}

export function SimCardPlanPage({}: SimCardPlanPageProps) {
  const [data, setData] = useState<SimCardPlan[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingPlan, setEditingPlan] = useState<SimCardPlan | undefined>(undefined)
  const [viewingPlan, setViewingPlan] = useState<SimCardPlan | null>(null)
  const [loading, setLoading] = useState(false)

  const loadData = async () => {
    try {
      setLoading(true)
      const plans = await SimCardPlanService.getAll()
      setData(plans)
    } catch (error) {
      console.error('Error loading SIM card plans:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
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
