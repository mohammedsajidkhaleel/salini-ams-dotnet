"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Shield, Users, AlertTriangle } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SoftwareLicenseForm } from "@/components/software-license-form"
import { SoftwareLicenseTable } from "@/components/software-license-table"
import { SoftwareLicenseDetails } from "@/components/software-license-details"
import { SoftwareLicenseAssigneesModal } from "@/components/software-license-assignees-modal"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { ProtectedRoute } from "@/components/protected-route"
import { LayoutWrapper } from "@/components/layout-wrapper"
import { SoftwareLicenseService, SoftwareLicense } from "@/lib/softwareLicenseService"
import { ProjectDataService } from "@/lib/projectDataService"
import { ProjectService } from "@/lib/services/projectService"
import { useAuth } from "@/contexts/auth-context-new"
import { Project } from "@/lib/types"


export default function SoftwareLicensesPage() {
  const { user } = useAuth()
  const [licenses, setLicenses] = useState<SoftwareLicense[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<string>("all")
  const [showExpiringSoon, setShowExpiringSoon] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingLicense, setEditingLicense] = useState<SoftwareLicense | null>(null)
  const [viewingLicense, setViewingLicense] = useState<SoftwareLicense | null>(null)
  const [viewingAssignees, setViewingAssignees] = useState<SoftwareLicense | null>(null)
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    license: SoftwareLicense | null;
  }>({ isOpen: false, license: null })

  // Load data on component mount
  useEffect(() => {
    loadData()
  }, [user, selectedProject])

  const loadData = async () => {
    if (!user) {
      console.log("No user found, skipping data load")
      return
    }
    
    try {
      setLoading(true)
      setError(null)
      // Load projects - filtering is now handled server-side
      const projects = await ProjectService.getAll()
      
      console.log('📋 Software Licenses - Loaded projects from API:', {
        userId: user.id,
        userRole: user.role,
        totalProjects: projects.length,
        projectNames: projects.map(p => p.name)
      });
      
      setProjects(projects)

      // Load software licenses
      let licensesData: SoftwareLicense[]
      try {
        if (selectedProject === "all") {
          console.log("Loading software licenses for user:", user.id)
          licensesData = await SoftwareLicenseService.getSoftwareLicensesForUser(user.id)
        } else {
          console.log("Loading software licenses for project:", selectedProject)
          licensesData = await SoftwareLicenseService.getSoftwareLicensesByProject(selectedProject)
        }
        console.log("Loaded software licenses:", licensesData)
      } catch (licenseError) {
        console.error("Error loading software licenses:", licenseError)
        // Try to load all licenses as a fallback
        try {
          console.log("Trying fallback: loading all software licenses")
          licensesData = await SoftwareLicenseService.getAllSoftwareLicenses()
          console.log("Fallback loaded software licenses:", licensesData)
        } catch (fallbackError) {
          console.error("Fallback also failed:", fallbackError)
          throw licenseError // Throw the original error
        }
      }
      
      console.log("Setting licenses state with:", licensesData)
      setLicenses(licensesData)
    } catch (err) {
      console.error("Error loading data:", err)
      setError("Failed to load software licenses. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleAddLicense = async (licenseData: Omit<SoftwareLicense, "id" | "createdAt">) => {
    try {
      // Using new API - no Supabase configuration needed
      
      const newLicense = await SoftwareLicenseService.createSoftwareLicense(licenseData)
      setLicenses([newLicense, ...licenses])
      setError(null) // Clear any previous errors
      
      // Add a small delay before closing the form to ensure the form's finally block executes
      setTimeout(() => {
        setShowForm(false)
        setEditingLicense(null) // Reset editing state
      }, 200)
    } catch (err) {
      console.error("Error creating license:", err)
      const errorMessage = "Failed to create software license. Please try again."
      setError(errorMessage)
      throw err // Re-throw to let the form handle it
    }
  }

  const handleEditLicense = async (licenseData: Omit<SoftwareLicense, "id" | "created_at">) => {
    if (!editingLicense) return
    
    try {
      const updatedLicense = await SoftwareLicenseService.updateSoftwareLicense(editingLicense.id, licenseData)
      setLicenses(
        licenses.map((license) =>
          license.id === editingLicense.id ? updatedLicense : license
        )
      )
      setEditingLicense(null)
      setShowForm(false)
      setError(null) // Clear any previous errors
    } catch (err) {
      console.error("Error updating license:", err)
      setError("Failed to update software license. Please try again.")
      throw err // Re-throw to let the form handle it
    }
  }

  const handleDeleteLicense = (license: SoftwareLicense) => {
    setDeleteConfirmation({ isOpen: true, license });
  };

  const confirmDelete = async () => {
    if (!deleteConfirmation.license) return;
    
    try {
      await SoftwareLicenseService.deleteSoftwareLicense(deleteConfirmation.license.id)
      setLicenses(licenses.filter((license) => license.id !== deleteConfirmation.license!.id))
      setDeleteConfirmation({ isOpen: false, license: null });
    } catch (err) {
      console.error("Error deleting license:", err)
      setError("Failed to delete software license. Please try again.")
    }
  }

  const handleEditClick = (license: SoftwareLicense) => {
    setEditingLicense(license)
    setShowForm(true)
    setViewingLicense(null)
  }

  const handleViewClick = (license: SoftwareLicense) => {
    setViewingLicense(license)
    setShowForm(false)
    setEditingLicense(null)
    setViewingAssignees(null)
  }

  const handleViewAssigneesClick = (license: SoftwareLicense) => {
    setViewingAssignees(license)
    setShowForm(false)
    setEditingLicense(null)
    setViewingLicense(null)
  }

  const handleCancelForm = () => {
    setShowForm(false)
    setEditingLicense(null)
  }

  const handleCloseDetails = () => {
    setViewingLicense(null)
  }

  const handleCloseAssignees = () => {
    setViewingAssignees(null)
  }

  const handleProjectChange = (projectId: string) => {
    setSelectedProject(projectId)
  }

  const handleExpiringSoonClick = () => {
    setShowExpiringSoon(true)
  }

  const handleClearExpiringSoonFilter = () => {
    setShowExpiringSoon(false)
  }

  // Calculate statistics
  const totalSeats = licenses.reduce((sum, license) => sum + (license.seats || 0), 0)
  const expiringLicenses = licenses.filter((license) => {
    if (!license.expiryDate) return false
    const expiryDate = new Date(license.expiryDate)
    const today = new Date()
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return daysUntilExpiry <= 90 && daysUntilExpiry > 0
  }).length
  const expiredLicenses = licenses.filter((license) => {
    if (!license.expiryDate) return false
    const expiryDate = new Date(license.expiryDate)
    const today = new Date()
    return expiryDate < today
  }).length
  const activeLicenses = licenses.filter((license) => license.status === 1).length

  // Debug logging
  console.log("Software License Statistics:", {
    totalLicenses: licenses.length,
    totalSeats,
    expiringLicenses,
    expiredLicenses,
    activeLicenses,
    sampleLicense: licenses[0] // Show structure of first license
  })

  // Filter and sort licenses based on expiring soon filter
  const getFilteredAndSortedLicenses = () => {
    let filteredLicenses = licenses

    if (showExpiringSoon) {
      filteredLicenses = licenses.filter((license) => {
        if (!license.expiryDate) return false
        const expiryDate = new Date(license.expiryDate)
        const today = new Date()
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        return daysUntilExpiry <= 90 && daysUntilExpiry > 0
      })
    }

    // Sort by expiry date (ascending - closest expiry first)
    return filteredLicenses.sort((a, b) => {
      if (!a.expiryDate && !b.expiryDate) return 0
      if (!a.expiryDate) return 1
      if (!b.expiryDate) return -1
      return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()
    })
  }

  const displayLicenses = getFilteredAndSortedLicenses()

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
    )
  }

  if (showForm) {
    return (
      <ProtectedRoute>
        <LayoutWrapper title="Software Licenses" description="Manage and track software licenses across your organization">
          <SoftwareLicenseForm
            key={editingLicense?.id || 'new'} // Force re-render when switching between add/edit
            license={editingLicense}
            projects={projects}
            onSubmit={editingLicense ? handleEditLicense : handleAddLicense}
            onCancel={handleCancelForm}
          />
        </LayoutWrapper>
      </ProtectedRoute>
    )
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
    )
  }

  return (
    <ProtectedRoute>
      <LayoutWrapper title="Software Licenses" description="Manage and track software licenses across your organization">
        <div className="space-y-6">
          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-red-800">
                  <AlertTriangle className="h-5 w-5" />
                  <span>{error}</span>
                </div>
              </CardContent>
            </Card>
          )}

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
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
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
            <Button onClick={() => setShowForm(true)} className="bg-cyan-600 hover:bg-cyan-700 cursor-pointer">
              <Plus className="h-4 w-4 mr-2" />
              Add License
            </Button>
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
            licenses={displayLicenses}
            onEdit={handleEditClick}
            onDelete={handleDeleteLicense}
            onView={handleViewClick}
            onViewAssignees={handleViewAssigneesClick}
            showExpiringSoonFilter={showExpiringSoon}
          />

        </div>

        {/* Assignees Modal */}
        {viewingAssignees && (
          <SoftwareLicenseAssigneesModal
            isOpen={!!viewingAssignees}
            onClose={handleCloseAssignees}
            licenseId={viewingAssignees.id}
            licenseName={viewingAssignees.software_name}
            totalSeats={viewingAssignees.seats || 0}
          />
        )}

        {/* Delete Confirmation Dialog */}
        <ConfirmationDialog
          isOpen={deleteConfirmation.isOpen}
          onClose={() => setDeleteConfirmation({ isOpen: false, license: null })}
          onConfirm={confirmDelete}
          title="Delete Software License"
          description={`Are you sure you want to delete software license "${deleteConfirmation.license?.software_name}"? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          variant="destructive"
        />
      </LayoutWrapper>
    </ProtectedRoute>
  )
}
