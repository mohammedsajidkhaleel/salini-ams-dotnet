"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { SimCardTable } from "@/components/sim-card-table";
import { SimCardForm } from "@/components/sim-card-form";
import { SimCardDetails } from "@/components/sim-card-details";
import { SimCardImportModal } from "@/components/sim-card-import-modal";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { UserHeader } from "@/components/user-header";
import { ProjectFilter } from "@/components/project-filter";
import { ProtectedRoute } from "@/components/protected-route";
import { useAuth } from "@/contexts/auth-context-new";
import { simCardService, type SimCard } from "@/lib/services";
import { toast } from "@/lib/toast";
import { ErrorHandler } from "@/lib/errorHandler";

export default function SimCardsPage() {
  const { user, isAuthenticated } = useAuth();
  const isAdmin = user?.role === 'SuperAdmin' || user?.role === 'Admin' || user?.permissions?.includes('simcards.create');
  
  const [simCards, setSimCards] = useState<SimCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSimCard, setEditingSimCard] = useState<SimCard | undefined>();
  const [viewingSimCard, setViewingSimCard] = useState<SimCard | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("all");
  const [showImportModal, setShowImportModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    simCard: SimCard | null;
  }>({ isOpen: false, simCard: null });

  // Pagination state
  const [pagination, setPagination] = useState({
    pageNumber: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 0,
  });

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<number | undefined>(undefined);
  const [providerFilter, setProviderFilter] = useState<string | undefined>(undefined);
  const [assignedFilter, setAssignedFilter] = useState<boolean | undefined>(undefined);

  // Load SIM cards from API
  const loadSimCards = async (
    pageNumber = 1, 
    pageSize = 10, 
    search = "", 
    status?: number,
    providerId?: string,
    assigned?: boolean,
    projectId?: string
  ) => {
    try {
      setLoading(true);
      
      const response = await simCardService.getSimCards({
        pageNumber,
        pageSize,
        search: search || undefined,
        simStatus: status,
        simProviderId: providerId,
        assigned,
        simTypeId: undefined, // TODO: Add type filter if needed
        simCardPlanId: undefined, // TODO: Add plan filter if needed
        sortBy: 'createdAt',
        sortDirection: 'desc',
      });

      // Filter by project if specified
      let filteredSimCards = response.items;
      if (projectId && projectId !== "all") {
        filteredSimCards = response.items.filter(simCard => simCard.projectId === projectId);
      } else if (user?.projectIds && user.projectIds.length > 0) {
        // Filter by user's accessible projects
        filteredSimCards = response.items.filter(simCard => 
          !simCard.projectId || user.projectIds.includes(simCard.projectId)
        );
      }

      setSimCards(filteredSimCards);
      setPagination({
        pageNumber: response.pageNumber,
        pageSize: response.pageSize,
        totalCount: filteredSimCards.length, // Use filtered count
        totalPages: Math.ceil(filteredSimCards.length / response.pageSize),
      });

      toast.success(`Loaded ${filteredSimCards.length} SIM cards`);
    } catch (error) {
      const errorMessage = ErrorHandler.showError(error as Error, 'SimCardsPage');
      toast.error(errorMessage);
      console.error("Error loading SIM cards:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadSimCards(
        pagination.pageNumber, 
        pagination.pageSize, 
        searchTerm, 
        statusFilter,
        providerFilter,
        assignedFilter,
        selectedProjectId
      );
    }
  }, [isAuthenticated, pagination.pageNumber, pagination.pageSize, searchTerm, statusFilter, providerFilter, assignedFilter, selectedProjectId]);

  const handleAdd = () => {
    setEditingSimCard(undefined);
    setShowForm(true);
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
      
      setSimCards((prev) => 
        prev.filter((simCard) => simCard.id !== deleteConfirmation.simCard!.id)
      );
      
      toast.success(`SIM card ${deleteConfirmation.simCard.simAccountNo} deleted successfully`);
      setDeleteConfirmation({ isOpen: false, simCard: null });
    } catch (error) {
      const errorMessage = ErrorHandler.showError(error as Error, 'SimCardsPage');
      toast.error(errorMessage);
    }
  };

  const handleSubmit = async (simCardData: Omit<SimCard, "id" | "createdAt" | "updatedAt">) => {
    try {
      if (editingSimCard) {
        // Update existing SIM card
        const updatedSimCard = await simCardService.updateSimCard(editingSimCard.id, {
          simAccountNo: simCardData.simAccountNo,
          simServiceNo: simCardData.simServiceNo,
          simStartDate: simCardData.simStartDate,
          simTypeId: simCardData.simTypeId,
          simCardPlanId: simCardData.simCardPlanId,
          simProviderId: simCardData.simProviderId,
          simStatus: simCardData.simStatus,
          simSerialNo: simCardData.simSerialNo,
          assignedTo: simCardData.assignedTo,
          projectId: simCardData.projectId,
        });

        setSimCards((prev) =>
          prev.map((simCard) => (simCard.id === editingSimCard.id ? updatedSimCard : simCard))
        );

        toast.success(`SIM card ${updatedSimCard.simAccountNo} updated successfully`);
      } else {
        // Add new SIM card
        const newSimCard = await simCardService.createSimCard({
          simAccountNo: simCardData.simAccountNo,
          simServiceNo: simCardData.simServiceNo,
          simStartDate: simCardData.simStartDate,
          simTypeId: simCardData.simTypeId,
          simCardPlanId: simCardData.simCardPlanId,
          simProviderId: simCardData.simProviderId,
          simStatus: simCardData.simStatus,
          simSerialNo: simCardData.simSerialNo,
          assignedTo: simCardData.assignedTo,
          projectId: simCardData.projectId,
        });

        setSimCards((prev) => [newSimCard, ...prev]);
        toast.success(`SIM card ${newSimCard.simAccountNo} created successfully`);
      }
    } catch (error) {
      const errorMessage = ErrorHandler.showError(error as Error, 'SimCardsPage');
      toast.error(errorMessage);
    } finally {
      setShowForm(false);
      setEditingSimCard(undefined);
    }
  };

  const handleImportComplete = () => {
    setShowImportModal(false);
    // Reload SIM cards to show imported data
    loadSimCards(
      pagination.pageNumber, 
      pagination.pageSize, 
      searchTerm, 
      statusFilter,
      providerFilter,
      assignedFilter,
      selectedProjectId
    );
  };

  const handleSearch = (search: string) => {
    setSearchTerm(search);
    setPagination(prev => ({ ...prev, pageNumber: 1 })); // Reset to first page
  };

  const handleStatusFilter = (status: number | undefined) => {
    setStatusFilter(status);
    setPagination(prev => ({ ...prev, pageNumber: 1 })); // Reset to first page
  };

  const handleProviderFilter = (providerId: string | undefined) => {
    setProviderFilter(providerId);
    setPagination(prev => ({ ...prev, pageNumber: 1 })); // Reset to first page
  };

  const handleAssignedFilter = (assigned: boolean | undefined) => {
    setAssignedFilter(assigned);
    setPagination(prev => ({ ...prev, pageNumber: 1 })); // Reset to first page
  };

  const handlePageChange = (pageNumber: number) => {
    setPagination(prev => ({ ...prev, pageNumber }));
  };

  const handlePageSizeChange = (pageSize: number) => {
    setPagination(prev => ({ ...prev, pageSize, pageNumber: 1 }));
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
                key={editingSimCard?.id || 'new'}
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

            {/* Search and Filter Controls */}
            <div className="flex gap-4 items-center flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <input
                  type="text"
                  placeholder="Search SIM cards..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              
              <select
                value={statusFilter || ""}
                onChange={(e) => handleStatusFilter(e.target.value ? Number(e.target.value) : undefined)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="">All Status</option>
                <option value="1">Active</option>
                <option value="2">Suspended</option>
                <option value="3">Terminated</option>
                <option value="4">Expired</option>
              </select>
              
              <select
                value={providerFilter || ""}
                onChange={(e) => handleProviderFilter(e.target.value || undefined)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="">All Providers</option>
                {/* TODO: Load providers from API */}
                <option value="1">Etisalat</option>
                <option value="2">Du</option>
                <option value="3">Virgin Mobile</option>
              </select>
              
              <select
                value={assignedFilter === undefined ? "" : assignedFilter.toString()}
                onChange={(e) => handleAssignedFilter(e.target.value === "" ? undefined : e.target.value === "true")}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="">All SIM Cards</option>
                <option value="true">Assigned</option>
                <option value="false">Unassigned</option>
              </select>
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

            {/* SIM Card Table */}
            <SimCardTable
              simCards={simCards}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onAdd={handleAdd}
              onView={handleView}
              onImport={isAdmin ? () => setShowImportModal(true) : undefined}
              loading={loading}
              pagination={pagination}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />

            {/* SIM Card Details Modal */}
            <SimCardDetails 
              simCard={viewingSimCard} 
              isOpen={!!viewingSimCard} 
              onClose={() => setViewingSimCard(null)} 
            />

            {/* Import Modal */}
            {isAdmin && (
              <SimCardImportModal 
                isOpen={showImportModal} 
                onClose={() => setShowImportModal(false)} 
                onImportComplete={handleImportComplete} 
              />
            )}
            
            {/* Delete Confirmation */}
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
