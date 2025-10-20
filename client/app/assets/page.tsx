"use client"

import { useEffect, useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { AssetTable } from "@/components/asset-table"
import { AssetForm } from "@/components/asset-form"
import { AssetDetails } from "@/components/asset-details"
import { UserHeader } from "@/components/user-header"
import { AssetImportModal } from "@/components/asset-import-modal"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { ProjectFilter } from "@/components/project-filter"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/contexts/auth-context-new"
import { assetService } from "@/lib/services"
import { ProjectService } from "@/lib/services/projectService"

interface Asset {
  id: string
  assetTag: string
  assetName: string
  serialNumber: string
  item: string
  assignedEmployee: string // This contains the employee ID
  assignedEmployeeDisplay?: string // This contains the display string
  project?: string // This contains the project ID for the form
  status: "available" | "assigned" | "maintenance" | "retired"
  condition: "excellent" | "good" | "fair" | "poor"
  poNumber: string
  description: string
  project_id?: string
  project_name?: string
}

export default function AssetsPage() {
  const { user } = useAuth();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | undefined>();
  const [viewingAsset, setViewingAsset] = useState<Asset | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("all");
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    asset: Asset | null;
  }>({ isOpen: false, asset: null });

  // Helper function to map database asset to UI asset
  const mapAssetData = (a: any): Asset => {
    // Try to parse imported data from description field
    let parsedData = null;
    if (a.description) {
      try {
        parsedData = JSON.parse(a.description)
      } catch (e) {
        // If not JSON, it's a regular description
      }
    }

    // Resolve assigned employee ID and display from employee_assets table
    let assignedEmployeeId = "";
    let assignedEmployeeDisplay = "";
    
    if (a.employee_assets && a.employee_assets.length > 0) {
      // Find the active assignment - filter out any null/undefined entries first
      const validAssignments = a.employee_assets.filter((ea: any) => ea && ea.status === 'assigned');
      if (validAssignments.length > 0) {
        // Use the first active assignment (there should only be one due to unique constraint)
        const activeAssignment = validAssignments[0];
        if (activeAssignment.employees) {
          assignedEmployeeId = activeAssignment.employees.id;
          assignedEmployeeDisplay = `${activeAssignment.employees.code} - ${activeAssignment.employees.name}`;
        }
      }
    } else if (a.assigned_to) {
      // Legacy fallback for old assigned_to field
      if (typeof a.assigned_to === 'string' && a.assigned_to.includes(' - ')) {
        // Legacy format where assigned_to contains "CODE - NAME"
        assignedEmployeeDisplay = a.assigned_to;
        assignedEmployeeId = ""; // We don't have the ID in this case
      } else {
        // assigned_to contains employee ID
        assignedEmployeeId = a.assigned_to;
        assignedEmployeeDisplay = ""; // We'll need to look up the display name
      }
    } else if (parsedData?.assigned_to) {
      // Fallback to parsed data from import
      assignedEmployeeDisplay = parsedData.assigned_to;
      assignedEmployeeId = ""; // We don't have the ID in this case
    }

    return {
      id: a.id,
      assetTag: a.asset_tag,
      assetName: a.name,
      serialNumber: a.serial_number ?? parsedData?.serial_no ?? "",
      item: a.category ?? parsedData?.item ?? "",
      assignedEmployee: assignedEmployeeId, // Store the employee ID
      assignedEmployeeDisplay: assignedEmployeeDisplay, // Store the display string
      project: a.project_id || "", // Store the project ID for the form
      status: a.status,
      condition: a.condition ?? parsedData?.condition ?? "excellent",
      poNumber: "",
      description: parsedData ? `Imported: ${parsedData.item} (${parsedData.serial_no})` : (a.description ?? ""),
      project_id: a.project_id,
      project_name: a.projects?.name,
    }
  }

  const fetchAssets = async () => {
    try {
      // Project filtering is now handled automatically at the API level
      console.log('Loading assets...')
      
      const response = await assetService.getAssets({
        page: 1,
        pageSize: 1000,
      })

      console.log('API Response:', response);

      // Check if response and items exist
      if (!response || !response.items) {
        console.warn('No data received from API, setting empty array');
        setAssets([]);
        return;
      }

      // Ensure items is an array
      const assetsData = Array.isArray(response.items) ? response.items : [];
      
      // Map API response to UI format
      const mapped: Asset[] = assetsData.map(apiAsset => ({
        id: apiAsset.id,
        assetTag: apiAsset.assetTag,
        assetName: apiAsset.name,
        serialNumber: apiAsset.serialNumber || "",
        item: apiAsset.itemName || "",
        assignedEmployee: "",
        assignedEmployeeDisplay: apiAsset.assignedEmployeeName || "",
        project: apiAsset.projectName || "",
        status: apiAsset.status === 1 ? "available" : 
                apiAsset.status === 2 ? "assigned" : 
                apiAsset.status === 3 ? "maintenance" : "retired",
        condition: apiAsset.condition || "excellent",
        poNumber: apiAsset.poNumber || "",
        description: apiAsset.description || "",
        project_id: apiAsset.projectId,
        project_name: apiAsset.projectName,
      }))

      console.log('Loaded assets from API:', mapped.map(a => ({
        name: a.assetName,
        project: a.project_name,
        project_id: a.project_id,
        assignedEmployee: a.assignedEmployee,
        assignedEmployeeDisplay: a.assignedEmployeeDisplay
      })))
      
      setAssets(mapped)
    } catch (error) {
      console.error('Error fetching assets:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      // Set empty array on error to prevent UI issues
      setAssets([]);
    }
    }

  useEffect(() => {
    fetchAssets();
  }, [user])

  const handleAdd = () => {
    setEditingAsset(undefined);
    setShowForm(true);
  }

  const handleEdit = (asset: Asset) => {
    setEditingAsset(asset);
    setShowForm(true);
  }

  const handleView = (asset: Asset) => {
    setViewingAsset(asset);
  }

  const handleImport = () => {
    setShowImportModal(true);
  }

  // Debug function to assign project to assets for testing - DISABLED DURING API MIGRATION
  const handleAssignProjectToAssets = async () => {
    alert('This feature is temporarily disabled during API migration.');
    return;
    if (!confirm("This will assign the first project to all assets without a project. Continue?")) return;
    
    // Get the first project
    let projectId: string;
    try {
      const projects = await assetService.getProjects();
      if (!projects || projects.length === 0) {
        alert('No projects found. Please create a project first.');
        return;
      }
      projectId = projects[0].id;
    } catch (error) {
      console.error('Error fetching projects:', error);
      alert('Error fetching projects.');
      return;
    }
    
    // Update all assets without project_id
    try {
      await assetService.updateAssetsProject(projectId);
      alert('Project assigned to assets successfully');
      // Refresh the assets list
      await fetchAssets();
    } catch (error) {
      console.error('Error assigning project to assets:', error);
    }
  };

  const handleImportComplete = () => {
    setShowImportModal(false);
    // Refresh assets list with current project filter
    fetchAssets();
  }

  const handleDelete = (asset: Asset) => {
    setDeleteConfirmation({ isOpen: true, asset });
  };

  const confirmDelete = async () => {
    if (!deleteConfirmation.asset) return;
    
    try {
      await assetService.deleteAsset(deleteConfirmation.asset.id);
      setAssets((prev) => prev.filter((asset) => asset.id !== deleteConfirmation.asset!.id));
      setDeleteConfirmation({ isOpen: false, asset: null });
    } catch (error) {
      console.error("Error deleting asset", error);
    }
  };

  const handleSubmit = async (assetData: Omit<Asset, "id">) => {
    try {
      if (editingAsset) {
        // Update asset basic information
        const payload = {
          asset_tag: assetData.assetTag,
          name: assetData.assetName,
          category: assetData.item,
          serial_number: assetData.serialNumber,
          project_id: assetData.project || null,
          status: assetData.status,
          condition: assetData.condition,
          description: assetData.description,
        }
        console.log("🔍 Updating asset with payload:", payload);
        console.log("🔍 Project field from form:", assetData.project);
        console.log("🔍 Project ID being saved:", assetData.project || null);
        try {
          await assetService.updateAsset(editingAsset.id, payload)
          console.log("Asset updated successfully");
          
          // Handle employee assignment using the new API
          if (assetData.assignedEmployee) {
            // Assign asset to employee using the new API
            await assetService.assignAsset(editingAsset.id, {
              employeeId: assetData.assignedEmployee,
              notes: "Asset assigned via edit form"
            });
          } else {
            // Unassign asset if no employee selected
            await assetService.unassignAsset(editingAsset.id, "Asset unassigned via edit form");
          }
          
          // Update the asset in the list with the new data
          // We need to preserve the project_name by looking it up from the projects list
          const updatedAsset = { ...assetData, id: editingAsset.id }
          
          // If a project was selected, look up the project name
          if (assetData.project) {
            try {
              const projects = await ProjectService.getAll();
              const projectData = projects.find(p => p.id === assetData.project);
              
              if (projectData) {
                updatedAsset.project_name = projectData.name
                updatedAsset.project_id = assetData.project
              }
            } catch (error) {
              console.error("Error fetching project data:", error);
            }
          } else {
            // Clear project info if no project selected
            updatedAsset.project_name = undefined
            updatedAsset.project_id = undefined
          }
          
          setAssets((prev) => prev.map((a) => (a.id === editingAsset.id ? updatedAsset : a)))
        } catch (error) {
          console.error("Error updating asset:", error);
        }
      } else {
        // Create new asset
        const payload = {
          asset_tag: assetData.assetTag,
          name: assetData.assetName,
          category: assetData.item,
          serial_number: assetData.serialNumber,
          project_id: assetData.project || null,
          status: assetData.status,
          condition: assetData.condition,
          description: assetData.description,
          created_at: new Date().toISOString(),
        }
        console.log("Creating asset with payload:", payload);
        try {
          const data = await assetService.createAsset(payload)
          console.log("Asset created successfully:", data);
          
          // Handle employee assignment if provided
          if (assetData.assignedEmployee) {
            await assetService.assignAsset(data.id, {
              employeeId: assetData.assignedEmployee,
              notes: "Asset assigned during creation"
            });
          }
          
          // Look up project name if project was assigned
          let projectName = "";
          if (data.project_id) {
            try {
              const projects = await ProjectService.getAll();
              const projectData = projects.find(p => p.id === data.project_id);
              
              if (projectData) {
                projectName = projectData.name;
              }
            } catch (error) {
              console.error("Error fetching project data:", error);
            }
          }
          
          const newAsset: Asset = {
            id: data.id,
            assetTag: data.asset_tag,
            assetName: data.name,
            serialNumber: data.serial_number ?? "",
            item: data.category ?? "",
            assignedEmployee: assetData.assignedEmployee,
            assignedEmployeeDisplay: assetData.assignedEmployeeDisplay || "",
            project_id: data.project_id,
            project_name: projectName,
            status: data.status,
            condition: data.condition ?? "excellent",
            poNumber: "",
            description: data.description ?? "",
          }
          setAssets((prev) => [...prev, newAsset]);
          
          // Reload data from database to ensure consistency
          console.log("Reloading assets from database after successful add...");
          await fetchAssets();
        } catch (error) {
          console.error("Error creating asset:", error);
        }
      }
    } catch (error) {
      console.error("Unexpected error:", error);
    } finally {
      setShowForm(false);
      setEditingAsset(undefined);
    }
  }

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
                key={editingAsset?.id || 'new'} // Force re-render when switching between add/edit
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
    )
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

                    <AssetTable
              assets={assets}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onAdd={handleAdd}
              onView={handleView}
              onImport={handleImport}
            />

            <AssetDetails
              asset={
                viewingAsset
                  ? ({
                      id: viewingAsset.id,
                      assetTag: viewingAsset.assetTag,
                      name: viewingAsset.assetName,
                      category: viewingAsset.item,
                      brand: "",
                      serialNumber: viewingAsset.serialNumber,
                      purchaseDate: "",
                      purchasePrice: 0,
                      vendor: "",
                      warranty: "",
                      location: "",
                      assignedTo: viewingAsset.assignedEmployee,
                      status: viewingAsset.status,
                      condition: "good",
                      description: viewingAsset.description,
                    } as any)
                  : null
              }
              isOpen={!!viewingAsset}
              onClose={() => setViewingAsset(null)}
            />

            <AssetImportModal
              isOpen={showImportModal}
              onClose={() => setShowImportModal(false)}
              onImportComplete={handleImportComplete}
            />
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
  )
}
