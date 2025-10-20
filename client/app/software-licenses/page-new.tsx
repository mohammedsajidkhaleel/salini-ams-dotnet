"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Shield, Users, AlertTriangle, Download, Upload } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SoftwareLicenseForm } from "@/components/software-license-form";
import { SoftwareLicenseTable } from "@/components/software-license-table";
import { SoftwareLicenseDetails } from "@/components/software-license-details";
import { SoftwareLicenseAssigneesModal } from "@/components/software-license-assignees-modal";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { ProtectedRoute } from "@/components/protected-route";
import { LayoutWrapper } from "@/components/layout-wrapper";
import { useAuth } from "@/contexts/auth-context-new";
import { softwareLicenseService, type SoftwareLicense } from "@/lib/services";
import { toast } from "@/lib/toast";
import { ErrorHandler } from "@/lib/errorHandler";

export default function SoftwareLicensesPage() {
  const { user, isAuthenticated } = useAuth();
  const isAdmin = user?.role === 'SuperAdmin' || user?.role === 'Admin' || user?.permissions?.includes('softwarelicenses.create');
  
  const [licenses, setLicenses] = useState<SoftwareLicense[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [showExpiringSoon, setShowExpiringSoon] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingLicense, setEditingLicense] = useState<SoftwareLicense | null>(null);
  const [viewingLicense, setViewingLicense] = useState<SoftwareLicense | null>(null);
  const [viewingAssignees, setViewingAssignees] = useState<SoftwareLicense | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    license: SoftwareLicense | null;
  }>({ isOpen: false, license: null });

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
  const [vendorFilter, setVendorFilter] = useState<string | undefined>(undefined);
  const [expiringSoonFilter, setExpiringSoonFilter] = useState<boolean | undefined>(undefined);

  // Load software licenses from API
  const loadLicenses = async (
    pageNumber = 1, 
    pageSize = 10, 
    search = "", 
    status?: number,
    vendor?: string,
    expiringSoon?: boolean,
    projectId?: string
  ) => {
    try {
      setLoading(true);
      
      const response = await softwareLicenseService.getSoftwareLicenses({
        pageNumber,
        pageSize,
        search: search || undefined,
        status,
        vendor,
        expiringSoon,
        licenseType: undefined, // TODO: Add license type filter if needed
        sortBy: 'createdAt',
        sortDirection: 'desc',
      });

      // Filter by project if specified
      let filteredLicenses = response.items;
      if (projectId && projectId !== "all") {
        filteredLicenses = response.items.filter(license => license.projectId === projectId);
      } else if (user?.projectIds && user.projectIds.length > 0) {
        // Filter by user's accessible projects
        filteredLicenses = response.items.filter(license => 
          !license.projectId || user.projectIds.includes(license.projectId)
        );
      }

      setLicenses(filteredLicenses);
      setPagination({
        pageNumber: response.pageNumber,
        pageSize: response.pageSize,
        totalCount: filteredLicenses.length, // Use filtered count
        totalPages: Math.ceil(filteredLicenses.length / response.pageSize),
      });

      toast.success(`Loaded ${filteredLicenses.length} software licenses`);
    } catch (error) {
      const errorMessage = ErrorHandler.showError(error as Error, 'SoftwareLicensesPage');
      toast.error(errorMessage);
      console.error("Error loading software licenses:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadLicenses(
        pagination.pageNumber, 
        pagination.pageSize, 
        searchTerm, 
        statusFilter,
        vendorFilter,
        expiringSoonFilter,
        selectedProject
      );
    }
  }, [isAuthenticated, pagination.pageNumber, pagination.pageSize, searchTerm, statusFilter, vendorFilter, expiringSoonFilter, selectedProject]);

  const handleAddLicense = async (licenseData: Omit<SoftwareLicense, "id" | "createdAt" | "updatedAt">) => {
    try {
      const newLicense = await softwareLicenseService.createSoftwareLicense({
        softwareName: licenseData.softwareName,
        licenseKey: licenseData.licenseKey,
        licenseType: licenseData.licenseType,
        seats: licenseData.seats,
        vendor: licenseData.vendor,
        purchaseDate: licenseData.purchaseDate,
        expiryDate: licenseData.expiryDate,
        cost: licenseData.cost,
        status: licenseData.status,
        notes: licenseData.notes,
        poNumber: licenseData.poNumber,
        projectId: licenseData.projectId,
      });

      setLicenses([newLicense, ...licenses]);
      toast.success(`Software license ${newLicense.softwareName} created successfully`);
      
      setTimeout(() => {
        setShowForm(false);
        setEditingLicense(null);
      }, 200);
    } catch (error) {
      const errorMessage = ErrorHandler.showError(error as Error, 'SoftwareLicensesPage');
      toast.error(errorMessage);
      throw error;
    }
  };

  const handleEditLicense = async (licenseData: Omit<SoftwareLicense, "id" | "createdAt" | "updatedAt">) => {
    if (!editingLicense) return;
    
    try {
      const updatedLicense = await softwareLicenseService.updateSoftwareLicense(editingLicense.id, {
        softwareName: licenseData.softwareName,
        licenseKey: licenseData.licenseKey,
        licenseType: licenseData.licenseType,
        seats: licenseData.seats,
        vendor: licenseData.vendor,
        purchaseDate: licenseData.purchaseDate,
        expiryDate: licenseData.expiryDate,
        cost: licenseData.cost,
        status: licenseData.status,
        notes: licenseData.notes,
        poNumber: licenseData.poNumber,
        projectId: licenseData.projectId,
      });

      setLicenses(
        licenses.map((license) =>
          license.id === editingLicense.id ? updatedLicense : license
        )
      );
      
      toast.success(`Software license ${updatedLicense.softwareName} updated successfully`);
      setEditingLicense(null);
      setShowForm(false);
    } catch (error) {
      const errorMessage = ErrorHandler.showError(error as Error, 'SoftwareLicensesPage');
      toast.error(errorMessage);
      throw error;
    }
  };

  const handleDeleteLicense = (license: SoftwareLicense) => {
    setDeleteConfirmation({ isOpen: true, license });
  };

  const confirmDelete = async () => {
    if (!deleteConfirmation.license) return;
    
    try {
      await softwareLicenseService.deleteSoftwareLicense(deleteConfirmation.license.id);
      setLicenses(licenses.filter((license) => license.id !== deleteConfirmation.license!.id));
      toast.success(`Software license ${deleteConfirmation.license.softwareName} deleted successfully`);
      setDeleteConfirmation({ isOpen: false, license: null });
    } catch (error) {
      const errorMessage = ErrorHandler.showError(error as Error, 'SoftwareLicensesPage');
      toast.error(errorMessage);
    }
  };

  const handleEditClick = (license: SoftwareLicense) => {
    setEditingLicense(license);
    setShowForm(true);
    setViewingLicense(null);
  };

  const handleViewClick = (license: SoftwareLicense) => {
    setViewingLicense(license);
    setShowForm(false);
    setEditingLicense(null);
    setViewingAssignees(null);
  };

  const handleViewAssigneesClick = (license: SoftwareLicense) => {
    setViewingAssignees(license);
    setShowForm(false);
    setEditingLicense(null);
    setViewingLicense(null);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingLicense(null);
  };

  const handleCloseDetails = () => {
    setViewingLicense(null);
  };

  const handleCloseAssignees = () => {
    setViewingAssignees(null);
  };

  const handleProjectChange = (projectId: string) => {
    setSelectedProject(projectId);
  };

  const handleExpiringSoonClick = () => {
    setExpiringSoonFilter(true);
    setShowExpiringSoon(true);
  };

  const handleClearExpiringSoonFilter = () => {
    setExpiringSoonFilter(undefined);
    setShowExpiringSoon(false);
  };

  const handleSearch = (search: string) => {
    setSearchTerm(search);
    setPagination(prev => ({ ...prev, pageNumber: 1 }));
  };

  const handleStatusFilter = (status: number | undefined) => {
    setStatusFilter(status);
    setPagination(prev => ({ ...prev, pageNumber: 1 }));
  };

  const handleVendorFilter = (vendor: string | undefined) => {
    setVendorFilter(vendor);
    setPagination(prev => ({ ...prev, pageNumber: 1 }));
  };

  const handlePageChange = (pageNumber: number) => {
    setPagination(prev => ({ ...prev, pageNumber }));
  };

  const handlePageSizeChange = (pageSize: number) => {
    setPagination(prev => ({ ...prev, pageSize, pageNumber: 1 }));
  };

  const handleExportLicenses = async () => {
    try {
      const blob = await softwareLicenseService.exportSoftwareLicenses({
        pageNumber: 1,
        pageSize: 1000, // Export all
      });
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `software-licenses-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Software licenses exported successfully');
    } catch (error) {
      toast.error('Failed to export software licenses');
      console.error('Export error:', error);
    }
  };

  // Calculate statistics
  const totalSeats = licenses.reduce((sum, license) => sum + (license.seats || 0), 0);
  const expiringLicenses = licenses.filter((license) => {
    if (!license.expiryDate) return false;
    const expiryDate = new Date(license.expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 90 && daysUntilExpiry > 0;
  }).length;
  const expiredLicenses = licenses.filter((license) => {
    if (!license.expiryDate) return false;
    const expiryDate = new Date(license.expiryDate);
    const today = new Date();
    return expiryDate < today;
  }).length;
  const activeLicenses = licenses.filter((license) => license.status === 1).length;

  if (loading) {
    return (
      <ProtectedRoute>
        <LayoutWrapper title="Software Licenses" description="Manage and track software licenses across your organization">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading software licenses...</p>
            </div>
          </div>
        </LayoutWrapper>
      </ProtectedRoute>
    );
  }

  if (showForm) {
    return (
      <ProtectedRoute>
        <LayoutWrapper title="Software Licenses" description="Manage and track software licenses across your organization">
          <SoftwareLicenseForm
            key={editingLicense?.id || 'new'}
            license={editingLicense}
            projects={[]} // TODO: Load projects from API
            onSubmit={editingLicense ? handleEditLicense : handleAddLicense}
            onCancel={handleCancelForm}
          />
        </LayoutWrapper>
      </ProtectedRoute>
    );
  }

  if (viewingLicense) {
    return (
      <ProtectedRoute>
        <LayoutWrapper title="Software License Details" description="View detailed information about the software license">
          <SoftwareLicenseDetails
            license={viewingLicense}
            onEdit={() => handleEditClick(viewingLicense)}
            onClose={handleCloseDetails}
          />
        </LayoutWrapper>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <LayoutWrapper title="Software Licenses" description="Manage and track software licenses across your organization">
        <div className="space-y-6">
          {/* Search and Filter Controls */}
          <div className="flex gap-4 items-center flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="Search software licenses..."
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
              <option value="2">Expired</option>
              <option value="3">Suspended</option>
            </select>
            
            <select
              value={vendorFilter || ""}
              onChange={(e) => handleVendorFilter(e.target.value || undefined)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="">All Vendors</option>
              {/* TODO: Load vendors from API */}
              <option value="Microsoft">Microsoft</option>
              <option value="Adobe">Adobe</option>
              <option value="Oracle">Oracle</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label htmlFor="project-filter" className="text-sm font-medium text-gray-700">
                  Filter by Project:
                </label>
                <Select value={selectedProject} onValueChange={handleProjectChange}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Projects</SelectItem>
                    {/* TODO: Load projects from API */}
                    <SelectItem value="1">Project Alpha</SelectItem>
                    <SelectItem value="2">Project Beta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {showExpiringSoon && (
                <div className="flex items-center gap-2">
                  <Badge className="bg-amber-100 text-amber-800">
                    Showing Expiring Soon
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearExpiringSoonFilter}
                    className="text-amber-700 border-amber-300 hover:bg-amber-50"
                  >
                    Clear Filter
                  </Button>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportLicenses}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
              <Button onClick={() => setShowForm(true)} className="bg-cyan-600 hover:bg-cyan-700 cursor-pointer">
                <Plus className="h-4 w-4 mr-2" />
                Add License
              </Button>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Licenses</CardTitle>
                <Shield className="h-4 w-4 text-cyan-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{licenses.length}</div>
                <p className="text-xs text-gray-600">
                  Total software licenses
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Seats</CardTitle>
                <Users className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalSeats}</div>
                <p className="text-xs text-gray-600">Total license seats available</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Licenses</CardTitle>
                <Shield className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeLicenses}</div>
                <p className="text-xs text-gray-600">Currently active licenses</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Alerts</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {expiredLicenses > 0 && (
                    <div className="flex items-center gap-2">
                      <Badge className="bg-red-100 text-red-800 hover:bg-red-100">{expiredLicenses} Expired</Badge>
                      <span className="text-sm text-gray-600">Licenses have expired and need renewal</span>
                    </div>
                  )}
                  {expiringLicenses > 0 && (
                    <div className="flex items-center gap-2">
                      <Badge 
                        className="bg-amber-100 text-amber-800 hover:bg-amber-200 cursor-pointer transition-colors"
                        onClick={handleExpiringSoonClick}
                      >
                        {expiringLicenses} Expiring Soon
                      </Badge>
                      <span className="text-sm text-gray-600">Licenses expiring within 90 days</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Alerts */}
          {(expiringLicenses > 0 || expiredLicenses > 0) && (
            <Card className="border-amber-200 bg-amber-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-800">
                  <AlertTriangle className="h-5 w-5" />
                  License Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {expiredLicenses > 0 && (
                    <div className="flex items-center gap-2">
                      <Badge className="bg-red-100 text-red-800 hover:bg-red-100">{expiredLicenses} Expired</Badge>
                      <span className="text-sm text-gray-600">Licenses have expired and need renewal</span>
                    </div>
                  )}
                  {expiringLicenses > 0 && (
                    <div className="flex items-center gap-2">
                      <Badge 
                        className="bg-amber-100 text-amber-800 hover:bg-amber-200 cursor-pointer transition-colors"
                        onClick={handleExpiringSoonClick}
                      >
                        {expiringLicenses} Expiring Soon
                      </Badge>
                      <span className="text-sm text-gray-600">Licenses expiring within 90 days</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <SoftwareLicenseTable
            licenses={licenses}
            onEdit={handleEditClick}
            onDelete={handleDeleteLicense}
            onView={handleViewClick}
            onViewAssignees={handleViewAssigneesClick}
            showExpiringSoonFilter={showExpiringSoon}
            loading={loading}
            pagination={pagination}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        </div>

        {/* Assignees Modal */}
        {viewingAssignees && (
          <SoftwareLicenseAssigneesModal
            isOpen={!!viewingAssignees}
            onClose={handleCloseAssignees}
            licenseId={viewingAssignees.id}
            licenseName={viewingAssignees.softwareName}
            totalSeats={viewingAssignees.seats || 0}
          />
        )}

        {/* Delete Confirmation Dialog */}
        <ConfirmationDialog
          isOpen={deleteConfirmation.isOpen}
          onClose={() => setDeleteConfirmation({ isOpen: false, license: null })}
          onConfirm={confirmDelete}
          title="Delete Software License"
          description={`Are you sure you want to delete software license "${deleteConfirmation.license?.softwareName}"? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          variant="destructive"
        />
      </LayoutWrapper>
    </ProtectedRoute>
  );
}
