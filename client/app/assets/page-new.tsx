"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { AssetTable } from "@/components/asset-table";
import { AssetForm } from "@/components/asset-form";
import { AssetDetails } from "@/components/asset-details";
import { UserHeader } from "@/components/user-header";
import { AssetImportModal } from "@/components/asset-import-modal";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { ProjectFilter } from "@/components/project-filter";
import { ProtectedRoute } from "@/components/protected-route";
import { useAuth } from "@/contexts/auth-context-new";
import { assetService, type Asset } from "@/lib/services";
import { toast } from "@/lib/toast";
import { ErrorHandler } from "@/lib/errorHandler";

export default function AssetsPage() {
  const { user, isAuthenticated } = useAuth();
  const isAdmin = user?.role === 'SuperAdmin' || user?.role === 'Admin' || user?.permissions?.includes('assets.create');
  
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | undefined>();
  const [viewingAsset, setViewingAsset] = useState<Asset | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("all");
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    asset: Asset | null;
  }>({ isOpen: false, asset: null });

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
  const [conditionFilter, setConditionFilter] = useState<string | undefined>(undefined);
  const [assignedFilter, setAssignedFilter] = useState<boolean | undefined>(undefined);

  // Load assets from API
  const loadAssets = async (
    pageNumber = 1, 
    pageSize = 10, 
    search = "", 
    status?: number,
    condition?: string,
    assigned?: boolean,
    projectId?: string
  ) => {
    try {
      setLoading(true);
      
      const response = await assetService.getAssets({
        pageNumber,
        pageSize,
        search: search || undefined,
        status,
        condition,
        assigned,
        itemId: undefined, // TODO: Add item filter if needed
        location: undefined, // TODO: Add location filter if needed
        sortBy: 'createdAt',
        sortDirection: 'desc',
      });

      // Filter by project if specified
      let filteredAssets = response.items;
      if (projectId && projectId !== "all") {
        filteredAssets = response.items.filter(asset => asset.projectId === projectId);
      } else if (user?.projectIds && user.projectIds.length > 0) {
        // Filter by user's accessible projects
        filteredAssets = response.items.filter(asset => 
          !asset.projectId || user.projectIds.includes(asset.projectId)
        );
      }

      setAssets(filteredAssets);
      setPagination({
        pageNumber: response.pageNumber,
        pageSize: response.pageSize,
        totalCount: filteredAssets.length, // Use filtered count
        totalPages: Math.ceil(filteredAssets.length / response.pageSize),
      });

      toast.success(`Loaded ${filteredAssets.length} assets`);
    } catch (error) {
      const errorMessage = ErrorHandler.showError(error as Error, 'AssetsPage');
      toast.error(errorMessage);
      console.error("Error loading assets:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadAssets(
        pagination.pageNumber, 
        pagination.pageSize, 
        searchTerm, 
        statusFilter,
        conditionFilter,
        assignedFilter,
        selectedProjectId
      );
    }
  }, [isAuthenticated, pagination.pageNumber, pagination.pageSize, searchTerm, statusFilter, conditionFilter, assignedFilter, selectedProjectId]);

  const handleAdd = () => {
    setEditingAsset(undefined);
    setShowForm(true);
  };

  const handleEdit = (asset: Asset) => {
    setEditingAsset(asset);
    setShowForm(true);
  };

  const handleView = (asset: Asset) => {
    setViewingAsset(asset);
  };

  const handleDelete = (asset: Asset) => {
    setDeleteConfirmation({ isOpen: true, asset });
  };

  const confirmDelete = async () => {
    if (!deleteConfirmation.asset) return;
    
    try {
      await assetService.deleteAsset(deleteConfirmation.asset.id);
      
      setAssets((prev) => 
        prev.filter((asset) => asset.id !== deleteConfirmation.asset!.id)
      );
      
      toast.success(`Asset ${deleteConfirmation.asset.assetTag} deleted successfully`);
      setDeleteConfirmation({ isOpen: false, asset: null });
    } catch (error) {
      const errorMessage = ErrorHandler.showError(error as Error, 'AssetsPage');
      toast.error(errorMessage);
    }
  };

  const handleSubmit = async (assetData: Omit<Asset, "id" | "createdAt" | "updatedAt">) => {
    try {
      if (editingAsset) {
        // Update existing asset
        const updatedAsset = await assetService.updateAsset(editingAsset.id, {
          name: assetData.name,
          description: assetData.description,
          serialNumber: assetData.serialNumber,
          status: assetData.status,
          condition: assetData.condition,
          poNumber: assetData.poNumber,
          location: assetData.location,
          notes: assetData.notes,
          itemId: assetData.itemId,
          projectId: assetData.projectId,
        });

        setAssets((prev) =>
          prev.map((asset) => (asset.id === editingAsset.id ? updatedAsset : asset))
        );

        toast.success(`Asset ${updatedAsset.assetTag} updated successfully`);
      } else {
        // Add new asset
        const newAsset = await assetService.createAsset({
          assetTag: assetData.assetTag,
          name: assetData.name,
          description: assetData.description,
          serialNumber: assetData.serialNumber,
          status: assetData.status,
          condition: assetData.condition,
          poNumber: assetData.poNumber,
          location: assetData.location,
          notes: assetData.notes,
          itemId: assetData.itemId,
          projectId: assetData.projectId,
        });

        setAssets((prev) => [newAsset, ...prev]);
        toast.success(`Asset ${newAsset.assetTag} created successfully`);
      }
    } catch (error) {
      const errorMessage = ErrorHandler.showError(error as Error, 'AssetsPage');
      toast.error(errorMessage);
    } finally {
      setShowForm(false);
      setEditingAsset(undefined);
    }
  };

  const handleImportComplete = () => {
    setShowImportModal(false);
    // Reload assets to show imported data
    loadAssets(
      pagination.pageNumber, 
      pagination.pageSize, 
      searchTerm, 
      statusFilter,
      conditionFilter,
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

  const handleConditionFilter = (condition: string | undefined) => {
    setConditionFilter(condition);
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
                  <h1 className="text-3xl font-bold text-foreground">Asset Management</h1>
                  <p className="text-muted-foreground">Track and manage IT assets across your organization</p>
                </div>
                <UserHeader />
              </div>
              <AssetForm
                key={editingAsset?.id || 'new'}
                asset={editingAsset}
                onSubmit={handleSubmit}
                onCancel={() => {
                  setShowForm(false);
                  setEditingAsset(undefined);
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
                <h1 className="text-3xl font-bold text-foreground">Asset Management</h1>
                <p className="text-muted-foreground">Track and manage IT assets across your organization</p>
              </div>
              <UserHeader />
            </div>

            {/* Search and Filter Controls */}
            <div className="flex gap-4 items-center flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <input
                  type="text"
                  placeholder="Search assets..."
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
                <option value="1">Available</option>
                <option value="2">Assigned</option>
                <option value="3">Maintenance</option>
                <option value="4">Retired</option>
              </select>
              
              <select
                value={conditionFilter || ""}
                onChange={(e) => handleConditionFilter(e.target.value || undefined)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="">All Conditions</option>
                <option value="excellent">Excellent</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="poor">Poor</option>
              </select>
              
              <select
                value={assignedFilter === undefined ? "" : assignedFilter.toString()}
                onChange={(e) => handleAssignedFilter(e.target.value === "" ? undefined : e.target.value === "true")}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="">All Assets</option>
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
                  Showing {assets.length} asset{assets.length !== 1 ? 's' : ''} for selected project
                </div>
              )}
              {selectedProjectId === "all" && (
                <div className="text-sm text-muted-foreground">
                  Showing {assets.length} asset{assets.length !== 1 ? 's' : ''} total
                </div>
              )}
            </div>

            {/* Asset Table */}
            <AssetTable
              assets={assets}
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

            {/* Asset Details Modal */}
            <AssetDetails
              asset={viewingAsset}
              isOpen={!!viewingAsset}
              onClose={() => setViewingAsset(null)}
            />

            {/* Import Modal */}
            {isAdmin && (
              <AssetImportModal
                isOpen={showImportModal}
                onClose={() => setShowImportModal(false)}
                onImportComplete={handleImportComplete}
              />
            )}
            
            {/* Delete Confirmation */}
            <ConfirmationDialog
              isOpen={deleteConfirmation.isOpen}
              onClose={() => setDeleteConfirmation({ isOpen: false, asset: null })}
              onConfirm={confirmDelete}
              title="Delete Asset"
              description={`Are you sure you want to delete asset "${deleteConfirmation.asset?.assetTag}"? This action cannot be undone.`}
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
