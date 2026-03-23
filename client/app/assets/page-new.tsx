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
import { assetService, type Asset, itemService } from "@/lib/services";
import { toast } from "@/lib/toast";
import { ErrorHandler } from "@/lib/errorHandler";

export default function AssetsPage() {
  const { user, isAuthenticated } = useAuth();
  const isAdmin = user?.role === 'SuperAdmin' || user?.role === 'Admin' || user?.permissions?.includes('assets.create');
  
  // Check if user has import permission
  const canImport = isAdmin || user?.permissions?.includes('assets:import') || false;

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
  const [itemFilter, setItemFilter] = useState<string | undefined>(undefined);
  const [items, setItems] = useState<{ id: string; name: string }[]>([]);


  // Load assets from API
  const loadAssets = async (
    pageNumber = 1,
    pageSize = 10,
    search = "",
    status?: number,
    condition?: string,
    assigned?: boolean,
    itemId?: string,
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
        projectId: projectId && projectId !== "all" ? projectId : undefined,
        itemId: itemId || undefined,
        location: undefined, // TODO: Add location filter if needed
        sortBy: 'createdAt',
        sortDirection: 'desc',
      });

      setAssets(response.items || []);
      setPagination({
        pageNumber: response.pageNumber,
        pageSize: response.pageSize,
        totalCount: response.totalCount,
        totalPages: response.totalPages,
      });

      // Debug: Log first asset to see structure
      if (response.items && response.items.length > 0) {
        console.log('Sample asset from API:', {
          id: response.items[0].id,
          assetTag: response.items[0].assetTag,
          name: response.items[0].name,
          item: response.items[0].item,
          project: response.items[0].project,
          currentAssignment: response.items[0].currentAssignment,
          itemId: response.items[0].itemId,
          projectId: response.items[0].projectId,
        });
      }

      console.log('Assets loaded:', {
        count: response.items?.length || 0,
        totalCount: response.totalCount,
        filters: { search, status, condition, assigned, itemId, projectId }
      });
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
        itemFilter,
        selectedProjectId
      );
    }
  }, [isAuthenticated, pagination.pageNumber, pagination.pageSize, searchTerm, statusFilter, conditionFilter, assignedFilter, itemFilter, selectedProjectId]);

  // Load items for filter
  useEffect(() => {
    const loadItems = async () => {
      if (isAuthenticated) {
        try {
          const response = await itemService.getItems({ pageNumber: 1, pageSize: 1000 });
          setItems(response.items.map(i => ({ id: i.id, name: i.name })));
        } catch (error) {
          console.error("Error loading items:", error);
        }
      }
    };
    loadItems();
  }, [isAuthenticated]);

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

  const handleSubmit = async (assetData: any) => {
    try {
      if (editingAsset) {
        // Ensure ProjectId is provided
        if (!assetData.projectId) {
          toast.error("Project is required. Please select a project.");
          return;
        }

        // Update asset basic information
        // Include assignment/unassignment in the same request
        const updatedAsset = await assetService.updateAsset(editingAsset.id, {
          id: editingAsset.id,
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
          assignedEmployeeId: assetData.assignedEmployeeId,
          assignmentNotes: assetData.assignedEmployeeId ? "Asset assigned via edit form" : "Asset unassigned via edit form",
        });

        setAssets((prev) =>
          prev.map((asset) => (asset.id === editingAsset.id ? updatedAsset : asset))
        );

        toast.success(`Asset ${updatedAsset.assetTag} updated successfully`);
        // Only close form and clear editing state on success
        setShowForm(false);
        setEditingAsset(undefined);
      } else {
        // Convert status string to number for new asset
        const statusMap: Record<string, number> = {
          "available": 1,
          "assigned": 2,
          "maintenance": 3,
          "retired": 4
        };
        const statusNumber = statusMap[assetData.status] || 1;

        // Look up itemId from item name
        let itemId: string | undefined = undefined;
        if (assetData.item) {
          try {
            const items = await itemService.getItems({ pageNumber: 1, pageSize: 1000 });
            const foundItem = items.items.find(item => item.name === assetData.item);
            if (foundItem) {
              itemId = foundItem.id;
            } else {
              const errorMessage = `Item "${assetData.item}" not found. Please select a valid item.`;
              toast.error(errorMessage);
              // Don't close the form on error
              return;
            }
          } catch (error) {
            console.error("Error fetching items:", error);
            const errorMessage = ErrorHandler.showError(error as Error, 'AssetsPage');
            toast.error(`Failed to fetch items: ${errorMessage}`);
            // Don't close the form on error
            return;
          }
        }

        // Ensure ProjectId is provided
        if (!assetData.projectId) {
          toast.error("Project is required. Please select a project.");
          return;
        }

        // Build the request payload
        const createPayload: any = {
          assetTag: assetData.assetTag,
          name: assetData.name,
          status: assetData.status,
          projectId: assetData.projectId,
        };

        // Add optional fields only if they have values
        if (assetData.description) createPayload.description = assetData.description;
        if (assetData.serialNumber) createPayload.serialNumber = assetData.serialNumber;
        if (assetData.condition) createPayload.condition = assetData.condition;
        if (assetData.poNumber) createPayload.poNumber = assetData.poNumber;
        if (assetData.location) createPayload.location = assetData.location;
        if (assetData.notes) createPayload.notes = assetData.notes;
        if (assetData.itemId) createPayload.itemId = assetData.itemId;

        // If assigning to an employee, create asset with "Available" status first
        // The assignment will automatically change status to "Assigned"
        if (assetData.assignedEmployeeId) {
          createPayload.status = 1; // Force to Available (1) when assigning
        }

        const newAsset = await assetService.createAsset(createPayload);

        // Handle employee assignment for new asset
        if (assetData.assignedEmployeeId) {
          try {
            await assetService.assignAsset({
              assetId: newAsset.id,
              employeeId: assetData.assignedEmployeeId,
              notes: "Asset assigned during creation"
            });
            console.log("Asset assigned to employee successfully");
          } catch (error: any) {
            console.error("Error assigning asset to employee:", error);
            // Extract error message from API response
            let errorMessage = "Failed to assign asset to employee";
            if (error?.details?.message) {
              errorMessage = error.details.message;
            } else if (error?.message) {
              errorMessage = error.message;
            } else if (typeof error === 'string') {
              errorMessage = error;
            } else {
              const errorInfo = ErrorHandler.handleApiError(error);
              errorMessage = errorInfo.userMessage;
            }
            toast.error(`Asset created but failed to assign: ${errorMessage}`);
            // Asset was created successfully, but assignment failed
            // Still show success for asset creation, but warn about assignment
          }
        }

        setAssets((prev) => [newAsset, ...prev]);
        toast.success(`Asset ${newAsset.assetTag} created successfully`);
        // Only close form and clear editing state on success
        setShowForm(false);
        setEditingAsset(undefined);
      }
    } catch (error) {
      const errorMessage = ErrorHandler.showError(error as Error, 'AssetsPage');
      toast.error(errorMessage);
      // Don't close the form on error - let user fix the issue
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
      itemFilter,
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

  const handleItemFilter = (itemId: string | undefined) => {
    setItemFilter(itemId);
    setPagination(prev => ({ ...prev, pageNumber: 1 })); // Reset to first page
  };

  const handleProjectChange = (projectId: string) => {
    setSelectedProjectId(projectId);
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

            {/* Asset Table */}
            <AssetTable
              assets={assets}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onAdd={handleAdd}
              onView={handleView}
              onImport={canImport ? () => setShowImportModal(true) : undefined}
              loading={loading}
              pagination={pagination}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}

              // Filter props
              searchTerm={searchTerm}
              onSearchChange={handleSearch}
              statusFilter={statusFilter}
              onStatusChange={handleStatusFilter}
              conditionFilter={conditionFilter}
              onConditionChange={handleConditionFilter}
              assignedFilter={assignedFilter}
              onAssignedChange={handleAssignedFilter}
              itemFilter={itemFilter}
              onItemChange={handleItemFilter}
              selectedProjectId={selectedProjectId}
              onProjectChange={handleProjectChange}
              items={items}
            />

            {/* Asset Details Modal */}
            <AssetDetails
              asset={viewingAsset}
              isOpen={!!viewingAsset}
              onClose={() => setViewingAsset(null)}
            />

            {/* Import Modal */}
            {canImport && (
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
