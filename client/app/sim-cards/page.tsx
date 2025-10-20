"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { SimCardTable } from "@/components/sim-card-table";
import { SimCardForm } from "@/components/sim-card-form";
import { SimCardDetails } from "@/components/sim-card-details";
import { SimCardImportModal } from "@/components/sim-card-import-modal-new";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { UserHeader } from "@/components/user-header";
import { ProjectFilter } from "@/components/project-filter";
import { ProtectedRoute } from "@/components/protected-route";
import { SimCard } from "@/lib/types";
import { useAuth } from "@/contexts/auth-context-new";
import { simCardService } from "@/lib/services";

export default function SimCardsPage() {
  const { user } = useAuth();
  const [simCards, setSimCards] = useState<SimCard[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingSimCard, setEditingSimCard] = useState<SimCard | undefined>();
  const [viewingSimCard, setViewingSimCard] = useState<SimCard | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("all");
  const [showImportModal, setShowImportModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0); // Add refresh trigger
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    simCard: SimCard | null;
  }>({ isOpen: false, simCard: null });

  // Load SIM cards from API
  useEffect(() => {
    let isCancelled = false;
    
    const load = async () => {
      try {
        console.log("🔄 Loading SIM cards from API...");
        console.log("Selected project ID:", selectedProjectId);
        
        // Use the new API service
        const response = await simCardService.getSimCards({
          pageNumber: 1,
          pageSize: 1000, // Get all SIM cards for now
          projectId: selectedProjectId !== "all" ? selectedProjectId : undefined,
        });
        
        // Check if component is still mounted before updating state
        if (isCancelled) {
          console.log("🚫 Request cancelled, not updating state");
          return;
        }
        
        console.log("📊 SIM cards API response:", response);
        
        if (response && response.items) {
          console.log(`✅ Loaded ${response.items.length} SIM cards from API`);
          const mapped: SimCard[] = response.items.map((sc: any) => ({
            id: sc.id,
            sim_account_no: sc.simAccountNo,
            sim_service_no: sc.simServiceNo,
            sim_start_date: sc.simStartDate,
            sim_type_id: sc.simTypeId,
            sim_card_plan_id: sc.simCardPlanId,
            sim_provider_id: sc.simProviderId,
            sim_status: sc.simStatus,
            sim_serial_no: sc.simSerialNo,
            created_by: sc.createdBy,
            created_at: sc.createdAt,
            assigned_to: sc.assignedTo,
            project_id: sc.projectId,
            // Display names
            sim_type_name: sc.simTypeName,
            sim_provider_name: sc.simProviderName,
            sim_card_plan_name: sc.simCardPlanName,
            assigned_to_name: sc.assignedEmployeeName,
            project_name: sc.projectName,
          }));
          setSimCards(mapped);
          console.log("📋 Mapped SIM cards:", mapped);
        } else {
          console.error("❌ No SIM cards data received from API");
          // Set empty array to prevent undefined state
          setSimCards([]);
        }
      } catch (err) {
        if (!isCancelled) {
          console.error("💥 Unexpected error loading SIM cards:", err);
          setSimCards([]);
        }
      }
    };
    
    load();
    
    // Cleanup function to cancel the request if component unmounts or dependencies change
    return () => {
      isCancelled = true;
    };
  }, [selectedProjectId, user, refreshTrigger]); // Add refreshTrigger to dependencies

  const handleAdd = () => {
    setEditingSimCard(undefined);
    setShowForm(true);
  };

  const handleImport = () => {
    setShowImportModal(true);
  };

  const handleImportComplete = () => {
    setShowImportModal(false);
    // Trigger a reload of SIM cards data without full page reload
    console.log("🔄 Import completed, reloading SIM cards data...");
    setRefreshTrigger(prev => prev + 1); // Trigger refresh
  };

  const handleEdit = (simCard: SimCard) => {
    setEditingSimCard(simCard);
    setShowForm(true);
  };

  const handleView = (simCard: SimCard) => {
    setViewingSimCard(simCard);
  };

  const handleDelete = (simCard: SimCard) => {
    setDeleteConfirmation({ isOpen: true, simCard });
  };

  const confirmDelete = async () => {
    if (!deleteConfirmation.simCard) return;
    
    try {
      await simCardService.deleteSimCard(deleteConfirmation.simCard.id);
      setSimCards((prev) => prev.filter((sim) => sim.id !== deleteConfirmation.simCard!.id));
      setDeleteConfirmation({ isOpen: false, simCard: null });
    } catch (error) {
      console.error("Error deleting SIM card", error);
    }
  };

  const handleSubmit = async (simCardData: Omit<SimCard, "id" | "created_at">) => {
    try {
      // Helper function to convert undefined to null for database
      const toDbValue = (value: string | undefined) => value || null;
      
      if (editingSimCard) {
      // Update existing SIM card
      const payload = {
        simAccountNo: simCardData.sim_account_no,
        simServiceNo: simCardData.sim_service_no,
        simStartDate: toDbValue(simCardData.sim_start_date),
        simTypeId: toDbValue(simCardData.sim_type_id),
        simCardPlanId: toDbValue(simCardData.sim_card_plan_id),
        simProviderId: toDbValue(simCardData.sim_provider_id),
        simStatus: simCardData.sim_status,
        simSerialNo: toDbValue(simCardData.sim_serial_no),
        assignedTo: toDbValue(simCardData.assigned_to),
        projectId: toDbValue(simCardData.project_id),
      };
      try {
        await simCardService.updateSimCard(editingSimCard.id, payload);
        console.log("🔄 SIM card updated, reloading data...");
        setRefreshTrigger(prev => prev + 1); // Trigger refresh
      } catch (error) {
        console.error("Error updating SIM card", error);
        alert(`Error updating SIM card: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } else {
      // Add new SIM card
      const payload = {
        simAccountNo: simCardData.sim_account_no,
        simServiceNo: simCardData.sim_service_no,
        simStartDate: toDbValue(simCardData.sim_start_date),
        simTypeId: toDbValue(simCardData.sim_type_id),
        simCardPlanId: toDbValue(simCardData.sim_card_plan_id),
        simProviderId: toDbValue(simCardData.sim_provider_id),
        simStatus: simCardData.sim_status, // Send as number (1 = Active, 2 = Inactive, etc.)
        simSerialNo: toDbValue(simCardData.sim_serial_no),
        assignedTo: toDbValue(simCardData.assigned_to),
        projectId: toDbValue(simCardData.project_id),
      };
      try {
        console.log("📤 Sending SIM card payload:", JSON.stringify(payload, null, 2));
        await simCardService.createSimCard(payload);
        console.log("🔄 SIM card added, reloading data...");
        setRefreshTrigger(prev => prev + 1); // Trigger refresh
      } catch (error) {
        console.error("Error adding SIM card", error);
        console.error("Error details:", JSON.stringify(error, null, 2));
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        alert(`Error adding SIM card: ${errorMessage}`);
      }
    }
    } catch (error) {
      console.error("Error in handleSubmit:", error);
    } finally {
      setShowForm(false);
      setEditingSimCard(undefined);
    }
  };

  if (showForm) {
    return (
      <ProtectedRoute>
        <div className="flex h-screen bg-background">
          <Sidebar />
          <main className="flex-1 overflow-auto">
            <div className="p-6 space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-foreground">SIM Card Management</h1>
                  <p className="text-muted-foreground">Track and manage corporate SIM cards and mobile plans</p>
                </div>
                <UserHeader />
              </div>
              <SimCardForm
                key={editingSimCard?.id || 'new'} // Force re-render when switching between add/edit
                simCard={editingSimCard}
                onSubmit={handleSubmit}
                onCancel={() => {
                  setShowForm(false);
                  setEditingSimCard(undefined);
                }}
              />
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
                <h1 className="text-3xl font-bold text-foreground">SIM Card Management</h1>
                <p className="text-muted-foreground">Track and manage corporate SIM cards and mobile plans</p>
              </div>
              <UserHeader />
            </div>

            {/* Project Filter */}
            <div className="flex items-center gap-4">
              <ProjectFilter
                selectedProjectId={selectedProjectId}
                onProjectChange={setSelectedProjectId}
                showAllOption={true}
                className="min-w-[200px]"
              />
              {selectedProjectId !== "all" && (
                <div className="text-sm text-muted-foreground">
                  Showing {simCards.length} SIM card{simCards.length !== 1 ? 's' : ''} for selected project
                </div>
              )}
              {selectedProjectId === "all" && (
                <div className="text-sm text-muted-foreground">
                  Showing {simCards.length} SIM card{simCards.length !== 1 ? 's' : ''} total
                </div>
              )}
            </div>

            <SimCardTable
              simCards={simCards}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onAdd={handleAdd}
              onView={handleView}
              onImport={handleImport}
            />

            <SimCardDetails simCard={viewingSimCard} isOpen={!!viewingSimCard} onClose={() => setViewingSimCard(null)} />
            <SimCardImportModal 
              isOpen={showImportModal} 
              onClose={() => setShowImportModal(false)} 
              onImportComplete={handleImportComplete} 
            />
            <ConfirmationDialog
              isOpen={deleteConfirmation.isOpen}
              onClose={() => setDeleteConfirmation({ isOpen: false, simCard: null })}
              onConfirm={confirmDelete}
              title="Delete SIM Card"
              description={`Are you sure you want to delete SIM card "${deleteConfirmation.simCard?.sim_account_no}"? This action cannot be undone.`}
              confirmText="Delete"
              cancelText="Cancel"
              variant="destructive"
            />
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
