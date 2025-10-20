"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, FileSpreadsheet, CheckCircle, XCircle, AlertCircle, Download, Database } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { simCardService, ProjectService, type SimCard, type Project } from "@/lib/services"

interface ImportResult {
  success: number
  errors: number
  total: number
  errorDetails: string[]
}

interface SimCardImportData {
  sim_account_no: string
  sim_service_no: string
  sim_start_date: string
  sim_type: string
  sim_provider: string
  sim_card_plan: string
  sim_status: string
  sim_serial_no: string | null
  assigned_to: string
  project: string
}

interface SimCardImportModalProps {
  isOpen: boolean
  onClose: () => void
  onImportComplete: () => void
}

export function SimCardImportModal({ isOpen, onClose, onImportComplete }: SimCardImportModalProps) {
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState("")
  const [selectedProjectId, setSelectedProjectId] = useState<string>("none")
  const [projects, setProjects] = useState<Project[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // Fetch projects when modal opens
  useEffect(() => {
    if (isOpen) {
      const fetchProjects = async () => {
        try {
          const projectList = await ProjectService.getAll()
          setProjects(projectList)
          // Set default project if available
          if (projectList.length > 0 && !selectedProjectId) {
            setSelectedProjectId(projectList[0].id)
          } else if (projectList.length === 0 && !selectedProjectId) {
            setSelectedProjectId("none")
          }
        } catch (error) {
          console.error('Failed to fetch projects:', error)
          toast({
            title: "Warning",
            description: "Failed to load projects. SIM cards will be imported without project assignment.",
            variant: "destructive"
          })
        }
      }
      fetchProjects()
    }
  }, [isOpen, selectedProjectId, toast])

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setImportResult(null)
    }
  }

  const clearFile = () => {
    setSelectedFile(null)
    setImportResult(null)
    setProgress(0)
    setCurrentStep("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const parseCSVFile = async (file: File): Promise<SimCardImportData[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string
          const lines = text.split('\n').filter(line => line.trim())
          
          if (lines.length < 2) {
            reject(new Error('CSV file must have at least a header and one data row'))
            return
          }

          const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
          const data: SimCardImportData[] = []

          for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim())
            if (values.length !== headers.length) continue

            const row: any = {}
            headers.forEach((header, index) => {
              row[header] = values[index] || ''
            })

            const simCard: SimCardImportData = {
              sim_account_no: row.sim_account_no || '',
              sim_service_no: row.sim_service_no || '',
              sim_start_date: row.sim_start_date || '',
              sim_type: row.sim_type || '',
              sim_provider: row.sim_provider || '',
              sim_card_plan: row.sim_card_plan || '',
              sim_status: row.sim_status || 'active',
              sim_serial_no: row.sim_serial_no || null,
              assigned_to: row.assigned_to || '',
              project: row.project || ''
            }

            data.push(simCard)
          }

          resolve(data)
        } catch (error) {
          reject(error)
        }
      }
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsText(file)
    })
  }

  const validateSimCardData = (simCard: SimCardImportData): string[] => {
    const errors: string[] = []
    
    if (!simCard.sim_account_no?.trim()) errors.push('SIM Account Number is required for unique identification')
    if (!simCard.sim_service_no?.trim()) errors.push('SIM Service Number is required for unique identification')
    
    return errors
  }

  const importSimCards = async () => {
    if (!selectedFile) return

    setIsImporting(true)
    setProgress(0)
    setImportResult(null)
    setCurrentStep("Parsing CSV file...")

    try {
      console.log("🚀 Starting SIM card import process...")
      
      // Step 1: Parse CSV file
      const allSimCards = await parseCSVFile(selectedFile)
      console.log(`✅ Parsed ${allSimCards.length} SIM cards from CSV`)
      
      if (allSimCards.length === 0) {
        console.error("❌ No SIM cards found in CSV file")
        toast({
          title: "No data found",
          description: "The file appears to be empty or invalid",
          variant: "destructive"
        })
        setIsImporting(false)
        return
      }

      const result: ImportResult = {
        success: 0,
        errors: 0,
        total: allSimCards.length,
        errorDetails: []
      }

      // Validate all SIM cards first
      const validSimCards = []
      for (let i = 0; i < allSimCards.length; i++) {
        const simCardData = allSimCards[i]
        const validationErrors = validateSimCardData(simCardData)
        
        if (validationErrors.length > 0) {
          result.errors++
          result.errorDetails.push({
            row: i + 1,
            message: `Validation failed: ${validationErrors.join(', ')}`
          })
        } else {
          validSimCards.push({
            SimAccountNo: simCardData.sim_account_no,
            SimServiceNo: simCardData.sim_service_no,
            SimStartDate: simCardData.sim_start_date || undefined,
            SimType: simCardData.sim_type || undefined,
            SimProvider: simCardData.sim_provider || undefined,
            SimCardPlan: simCardData.sim_card_plan || undefined,
            SimStatus: simCardData.sim_status || 'active',
            SimSerialNo: simCardData.sim_serial_no || undefined,
            AssignedTo: simCardData.assigned_to || undefined
          })
        }
      }

      if (validSimCards.length === 0) {
        throw new Error('No valid SIM cards to import')
      }

      setCurrentStep(`Importing ${validSimCards.length} valid SIM cards...`)
      setProgress(50)

      // Use bulk import API
      const projectId = selectedProjectId === "none" ? undefined : selectedProjectId
      const importRequest = {
        SimCards: validSimCards,
        ProjectId: projectId
      }

      const importResponse = await simCardService.importSimCards(importRequest)
      
      result.success = importResponse.imported
      result.errors += importResponse.errors.length
      result.errorDetails.push(...importResponse.errors)
      
      setProgress(100)

      console.log("🎉 Import process completed!")
      console.log("📊 Final results:", result)
      
      setImportResult(result)
      setCurrentStep("Import completed")
      setProgress(100)

      if (result.success > 0) {
        toast({
          title: "Import Successful",
          description: `Successfully imported ${result.success} SIM cards. ${result.errors > 0 ? `${result.errors} errors occurred.` : 'No errors.'}`,
          variant: "default"
        })
        onImportComplete()
      } else {
        toast({
          title: "Import Failed",
          description: "No SIM cards were successfully imported. Please check the error details.",
          variant: "destructive"
        })
      }

    } catch (error) {
      console.error("❌ Import process failed:", error)
      toast({
        title: "Import Failed",
        description: `An error occurred during import: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      })
    } finally {
      setIsImporting(false)
    }
  }

  const downloadTemplate = () => {
    const headers = [
      'sim_account_no',
      'sim_service_no', 
      'sim_start_date',
      'sim_type',
      'sim_provider',
      'sim_card_plan',
      'sim_status',
      'sim_serial_no',
      'assigned_to',
      'project'
    ]
    
    const sampleData = [
      'ACC001', 'SVC001', '2024-01-01', 'Data', 'Etisalat', '5GB Plan', 'active', 'SN123456', 'EMP001', 'PROJ001',
      'ACC002', 'SVC002', '2024-01-02', 'Voice', 'Du', 'Unlimited Plan', 'active', 'SN123457', '', 'PROJ002'
    ]

    const csvContent = [headers.join(','), ...sampleData].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'sim_card_import_template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleClose = () => {
    if (!isImporting) {
      clearFile()
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Import SIM Cards from CSV
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* File Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Upload CSV File</CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedFile ? (
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-900 mb-2">
                    Drop your CSV file here or click to browse
                  </p>
                  <p className="text-sm text-gray-500">
                    Supported format: CSV files only
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="h-8 w-8 text-green-600" />
                    <div>
                      <p className="font-medium text-green-900">{selectedFile.name}</p>
                      <p className="text-sm text-green-600">
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFile}
                    disabled={isImporting}
                  >
                    Remove
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Template Download */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Download Template</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Download a sample CSV template to see the required format.
              </p>
              <Button
                variant="outline"
                onClick={downloadTemplate}
                disabled={isImporting}
              >
                <Download className="h-4 w-4 mr-2" />
                Download Template
              </Button>
              <div className="text-xs text-gray-500 space-y-1">
                <p><strong>Required columns:</strong> sim_account_no, sim_service_no (combination must be unique)</p>
                <p><strong>Optional columns:</strong> sim_start_date, sim_type, sim_provider, sim_card_plan, sim_status, sim_serial_no, assigned_to, project</p>
              </div>
            </CardContent>
          </Card>

          {/* Project Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Project Assignment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Select Project (Optional)
                </label>
                <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a project for SIM card assignment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Project (Unassigned)</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name} ({project.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  SIM cards will be assigned to the selected project. Choose "No Project (Unassigned)" to import without project assignment.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Import Progress */}
          {isImporting && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Import Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{currentStep}</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Import Results */}
          {importResult && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Import Results</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{importResult.success}</div>
                    <div className="text-sm text-gray-600">Successful</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{importResult.errors}</div>
                    <div className="text-sm text-gray-600">Errors</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{importResult.total}</div>
                    <div className="text-sm text-gray-600">Total</div>
                  </div>
                </div>

                {importResult.errorDetails.length > 0 && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-2">
                        <p className="font-medium">Errors encountered:</p>
                        <div className="max-h-32 overflow-y-auto space-y-1">
                          {importResult.errorDetails.map((error, index) => (
                            <div key={index} className="text-sm">
                              <span className="font-medium">Row {error.row}:</span> {error.message}
                            </div>
                          ))}
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isImporting}
            >
              {importResult ? 'Close' : 'Cancel'}
            </Button>
            {selectedFile && !importResult && (
              <Button
                onClick={importSimCards}
                disabled={isImporting}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isImporting ? "Importing..." : "Import SIM Cards"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
