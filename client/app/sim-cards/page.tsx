"use client";

import { useEffect, useState, useRef } from "react";
import { Sidebar } from "@/components/sidebar";
import { SimCardTable } from "@/components/sim-card-table";
import { SimCardForm } from "@/components/sim-card-form";
import { SimCardDetails } from "@/components/sim-card-details";
import { SimCardImportModal } from "@/components/sim-card-import-modal-new";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { UserHeader } from "@/components/user-header";
import { ProtectedRoute } from "@/components/protected-route";
import { SimCard } from "@/lib/types";
import { useAuth } from "@/contexts/auth-context-new";
import { simCardService } from "@/lib/services";

export default function SimCardsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const isAdmin = user?.role === 'SuperAdmin' || user?.role === 'Admin';
  
  // Check if user has import permission
  const canImport = isAdmin || user?.permissions?.includes('sim_cards:import') || false;
  
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
  const isFetchingRef = useRef(false);
  const lastFetchKeyRef = useRef<string>("");

  // Load SIM cards from API
  useEffect(() => {
    let isCancelled = false;

    // Prevent duplicate calls - only skip if currently fetching the exact same data
    const fetchKey = `${user?.id}_${selectedProjectId}_${refreshTrigger}`;

    // Skip only if we're currently fetching the exact same data
    if (isFetchingRef.current && lastFetchKeyRef.current === fetchKey) {
      console.log('⏭️ SIM Cards - Skipping duplicate call (already fetching same data)');
      return;
    }

    // Wait for auth to be initialized before fetching
    if (authLoading) {
      console.log('⏳ SIM Cards - Waiting for authentication to initialize...');
      return;
    }

    lastFetchKeyRef.current = fetchKey;
    isFetchingRef.current = true;

    const load = async () => {
      try {
        console.log("🔄 Loading SIM cards from API...");
        console.log("Selected project ID:", selectedProjectId);
        console.log("User ID:", user?.id);

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
          // Use API response directly without field name conversion
          setSimCards(response.items);
          console.log("📋 SIM cards loaded:", response.items);
        } else {
          console.error("❌ No SIM cards data received from API");
          // Set empty array to prevent undefined state
          setSimCards([]);
        }
      } catch (err: any) {
        if (!isCancelled) {
          console.error("💥 Unexpected error loading SIM cards:", err);
          console.error("Error message:", err?.message);
          console.error("Error stack:", err?.stack);
          try {
            console.error("Error JSON:", JSON.stringify(err, null, 2));
          } catch (e) {
            console.error("Error could not be stringified");
          }
          setSimCards([]);
        }
      }
    };

    load().finally(() => {
      isFetchingRef.current = false;
    });

    // Cleanup function to cancel the request if component unmounts or dependencies change
    return () => {
      isCancelled = true;
      isFetchingRef.current = false;
    };
  }, [selectedProjectId, user?.id, refreshTrigger, authLoading]); // Include authLoading to wait for auth

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

  const handleSubmit = async (simCardData: Omit<SimCard, "id" | "createdAt">) => {
    try {
      // Helper function to convert empty string to undefined for database
      const toDbValue = (value: string | undefined) => value || undefined;

      if (editingSimCard) {
        // Update existing SIM card - data is already in camelCase
        // Backend requires: id, simAccountNo, simServiceNo, projectId (all required)
        const payload = {
          id: editingSimCard.id, // Required by backend
          simAccountNo: simCardData.simAccountNo,
          simServiceNo: simCardData.simServiceNo,
          simStartDate: toDbValue(simCardData.simStartDate),
          simTypeId: toDbValue(simCardData.simTypeId),
          simCardPlanId: toDbValue(simCardData.simCardPlanId),
          simProviderId: toDbValue(simCardData.simProviderId),
          simStatus: Number(simCardData.simStatus),
          simSerialNo: toDbValue(simCardData.simSerialNo),
          assignedTo: toDbValue(simCardData.assignedTo),
          projectId: toDbValue(simCardData.projectId),
        };
        try {
          console.log("📤 Sending SIM card update payload:", JSON.stringify(payload, null, 2));
          await simCardService.updateSimCard(editingSimCard.id, payload);
          console.log("🔄 SIM card updated, reloading data...");
          setRefreshTrigger(prev => prev + 1); // Trigger refresh
          // Only close form on success
          setShowForm(false);
          setEditingSimCard(undefined);
        } catch (error: any) {
          console.error("Error updating SIM card", error);
          console.error("Error details:", error);

          // Try to extract more detailed error message from ApiError
          let errorMessage = 'Unknown error';

          if (error && typeof error === 'object' && 'statusCode' in error && 'message' in error) {
            const apiError = error as { message: string; statusCode: number; details?: any };
            errorMessage = apiError.message || 'API Error';

            if (apiError.details) {
              if (typeof apiError.details === 'string') {
                errorMessage = apiError.details;
              } else if (typeof apiError.details === 'object') {
                const errorData = apiError.details;
                if (errorData.errors) {
                  // Validation errors from ASP.NET Core
                  const validationErrors = Object.entries(errorData.errors)
                    .map(([field, messages]: [string, any]) => {
                      const fieldName = field.charAt(0).toLowerCase() + field.slice(1); // Convert to camelCase
                      return `${fieldName}: ${Array.isArray(messages) ? messages.join(', ') : messages}`;
                    })
                    .join('; ');
                  errorMessage = validationErrors || errorData.title || error.message || 'Validation failed';
                } else if (errorData.title) {
                  errorMessage = errorData.title;
                } else if (errorData.message) {
                  errorMessage = errorData.message;
                }
              }
            }
          } else if (error?.message) {
            errorMessage = error.message;
          }

          alert(`Error updating SIM card: ${errorMessage}`);
          // Don't close form on error - keep user on form to fix issues
          return;
        }
      } else {
        // Add new SIM card - data is already in camelCase
        const payload = {
          simAccountNo: simCardData.simAccountNo,
          simServiceNo: simCardData.simServiceNo,
          simStartDate: toDbValue(simCardData.simStartDate),
          simTypeId: toDbValue(simCardData.simTypeId),
          simCardPlanId: toDbValue(simCardData.simCardPlanId),
          simProviderId: toDbValue(simCardData.simProviderId),
          simStatus: Number(simCardData.simStatus),
          simSerialNo: toDbValue(simCardData.simSerialNo),
          assignedTo: toDbValue(simCardData.assignedTo),
          projectId: toDbValue(simCardData.projectId),
        };
        try {
          console.log("📤 Sending SIM card payload:", JSON.stringify(payload, null, 2));
          await simCardService.createSimCard(payload);
          console.log("🔄 SIM card added, reloading data...");
          setRefreshTrigger(prev => prev + 1); // Trigger refresh
          // Only close form on success
          setShowForm(false);
          setEditingSimCard(undefined);
        } catch (error: any) {
          console.error("Error adding SIM card", error);
          console.error("Error details:", error);

          // Try to extract more detailed error message from ApiError
          let errorMessage = 'Unknown error occurred';

          if (error && typeof error === 'object' && 'statusCode' in error && 'message' in error) {
            const apiError = error as { message: string; statusCode: number; details?: any };
            errorMessage = apiError.message || 'API Error';

            if (apiError.details) {
              if (typeof apiError.details === 'string') {
                errorMessage = apiError.details;
              } else if (typeof apiError.details === 'object') {
                const details = apiError.details as any;
                if (details.errors) {
                  // Validation errors from ASP.NET Core
                  const validationErrors = Object.entries(details.errors)
                    .map(([field, messages]: [string, any]) => {
                      const fieldName = field.charAt(0).toLowerCase() + field.slice(1); // Convert to camelCase
                      return `${fieldName}: ${Array.isArray(messages) ? messages.join(', ') : messages}`;
                    })
                    .join('; ');
                  errorMessage = validationErrors || details.title || error.message || 'Validation failed';
                } else if (details.title) {
                  errorMessage = details.title;
                } else if (details.message) {
                  errorMessage = details.message;
                }
              }
            }
          } else if (error?.message) {
            errorMessage = error.message;
          }

          alert(`Error adding SIM card: ${errorMessage}`);
          // Don't close form on error - keep user on form to fix issues
          return;
        }
      }
    } catch (error) {
      console.error("Error in handleSubmit:", error);
      // Don't close form on error
      return;
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

            <SimCardTable
              simCards={simCards}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onAdd={handleAdd}
              onView={handleView}
              onImport={canImport ? handleImport : undefined}
              selectedProjectId={selectedProjectId}
              onProjectChange={setSelectedProjectId}
            />

            <SimCardDetails simCard={viewingSimCard} isOpen={!!viewingSimCard} onClose={() => setViewingSimCard(null)} />
            {canImport && (
              <SimCardImportModal
                isOpen={showImportModal}
                onClose={() => setShowImportModal(false)}
                onImportComplete={handleImportComplete}
              />
            )}
            <ConfirmationDialog
              isOpen={deleteConfirmation.isOpen}
              onClose={() => setDeleteConfirmation({ isOpen: false, simCard: null })}
              onConfirm={confirmDelete}
              title="Delete SIM Card"
              description={`Are you sure you want to delete SIM card "${deleteConfirmation.simCard?.simAccountNo}"? This action cannot be undone.`}
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
