"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, FileSpreadsheet, CheckCircle, XCircle, AlertCircle, Download, Database } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { assetService, ProjectService, type AssetImportData, type Project } from "@/lib/services"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ImportResult {
  success: number
  errors: number
  total: number
  errorDetails: string[]
  masterDataCreated: {
    itemCategories: number
    items: number
  }
}


interface AssetImportModalProps {
  isOpen: boolean
  onClose: () => void
  onImportComplete: () => void
}

export function AssetImportModal({ isOpen, onClose, onImportComplete }: AssetImportModalProps) {
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedProjectId, setSelectedProjectId] = useState<string>("")
  const [projects, setProjects] = useState<Project[]>([])
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState("")
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
            description: "Failed to load projects. Assets will be imported without project assignment.",
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
      if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        toast({
          title: "Invalid file type",
          description: "Please select a CSV file",
          variant: "destructive"
        })
        return
      }
        setSelectedFile(file)
        setImportResult(null)
    }
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const file = event.dataTransfer.files[0]
    if (file) {
      if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        toast({
          title: "Invalid file type",
          description: "Please select a CSV file",
          variant: "destructive"
        })
        return
      }
      setSelectedFile(file)
      setImportResult(null)
    }
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
  }

  const clearFile = () => {
    setSelectedFile(null)
    setImportResult(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const normalizeSerialNumber = (serialNo: string): string | null => {
    const normalized = serialNo.trim().toLowerCase()
    if (normalized === 'n/a' || normalized === '-' || normalized === '') {
      return null
    }
    return serialNo.trim()
  }

  const parseCSVFile = (file: File): Promise<AssetImportData[]> => {
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
          const data: AssetImportData[] = []

          for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim())
            if (values.length !== headers.length) continue

            const row: any = {}
            headers.forEach((header, index) => {
              row[header] = values[index] || ''
            })

            data.push({
              assetTag: row.asset_tag || '',
              assetName: row.asset_name || '',
              itemCategory: row.item_category || '',
              item: row.item || '',
              serialNo: normalizeSerialNumber(row.serial_no || ''),
              assignedTo: row.assigned_to || '',
              condition: row.condition || 'excellent'
            })
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

  const validateAssetData = (asset: AssetImportData): string[] => {
    const errors: string[] = []
    
    if (!asset.assetTag?.trim()) errors.push('Asset tag is required')
    if (!asset.assetName?.trim()) errors.push('Asset name is required')
    if (!asset.itemCategory?.trim()) errors.push('Item category is required')
    if (!asset.item?.trim()) errors.push('Item is required')
    // Serial number is optional - can be null for assets without serial numbers
    
    return errors
  }

  const importAssets = async () => {
    if (!selectedFile) return

    setIsImporting(true)
    setProgress(0)
    setImportResult(null)
    setCurrentStep("Parsing CSV file...")

    try {
      // Step 1: Parse CSV file
      const assets = await parseCSVFile(selectedFile)
      setProgress(10)
      setCurrentStep("Validating asset data...")
      
      if (assets.length === 0) {
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
        total: assets.length,
        errorDetails: [],
        masterDataCreated: {
          itemCategories: 0,
          items: 0
        }
      }

      // Step 2: Validate asset data
      const validAssets = []
      for (let i = 0; i < assets.length; i++) {
        const asset = assets[i]
        setProgress(10 + (i / assets.length) * 20)

        const validationErrors = validateAssetData(asset)
        if (validationErrors.length > 0) {
          result.errors++
          const errorMessage = `Row ${i + 2}: ${validationErrors.join(', ')}`
          result.errorDetails.push(errorMessage)
          continue
        }

        validAssets.push(asset)
      }

      setProgress(50)
      setCurrentStep("Importing assets...")

      // Step 3: Import assets using the new API
      try {
        const projectId = selectedProjectId === "none" ? undefined : selectedProjectId
        const importResult = await assetService.importAssets(validAssets, projectId)
        
        result.success = importResult.imported
        result.errors = importResult.errors.length
        result.errorDetails = importResult.errors.map(error => `Row ${error.row}: ${error.message}`)
        
        // Add updated count to success for display
        if (importResult.updated > 0) {
          result.success += importResult.updated
        }
      } catch (error) {
        result.errors++
        const errorMessage = `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        result.errorDetails.push(errorMessage)
      }

      setProgress(100)
      setCurrentStep("Import completed!")

      // Step 4: Show results
      setImportResult(result)

      if (result.success > 0) {
        toast({
          title: "Import completed successfully",
          description: `Successfully imported ${result.success} assets. ${result.errors > 0 ? `${result.errors} assets had errors.` : ''}`,
        })
        onImportComplete()
      } else if (result.errors > 0) {
        toast({
          title: "Import completed with errors",
          description: `${result.errors} assets had errors. Check the details below.`,
          variant: "destructive"
        })
      }

    } catch (error) {
      console.error('Import error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      
      toast({
        title: "Import failed",
        description: `Failed to process the file: ${errorMessage}`,
        variant: "destructive"
      })
      
      setImportResult({
        success: 0,
        errors: 1,
        total: 0,
        errorDetails: [`Import failed: ${errorMessage}`],
        masterDataCreated: {
          itemCategories: 0,
          items: 0
        }
      })
    } finally {
      setIsImporting(false)
    }
  }

  const downloadTemplate = () => {
    const headers = [
      'asset_tag', 'asset_name', 'item_category', 'item', 'serial_no', 'assigned_to', 'condition'
    ]
    
    const sampleData = [
      'AT-001', 'Dell Laptop', 'Computers', 'Dell Latitude 5520', 'SN123456789', 'EMP001', 'excellent',
      'AT-002', 'Office Chair', 'Furniture', 'Ergonomic Office Chair', 'n/a', '', 'good'
    ]

    const csvContent = [headers, sampleData].map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'asset_import_template.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
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
            Import Assets from CSV
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
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
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
                    <SelectValue placeholder="Choose a project for asset assignment" />
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
                  Assets will be assigned to the selected project. Choose "No Project (Unassigned)" to import without project assignment.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Template Download */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">CSV Template</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-2">
                    Download the template to see the required format and column headers.
                  </p>
                  <div className="text-xs text-gray-500 space-y-1">
                    <p><strong>Required columns:</strong> asset_tag, asset_name, item_category, item</p>
                    <p><strong>Optional columns:</strong> serial_no (use "n/a" or "-" for assets without serial numbers), assigned_to, condition</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={downloadTemplate}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download Template
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Import Progress */}
          {isImporting && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Import Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{currentStep}</span>
                    <span className="text-sm text-gray-500">{progress}%</span>
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
                <CardTitle className="text-lg flex items-center gap-2">
                  {importResult.errors === 0 ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                  )}
                  Import Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{importResult.total}</div>
                      <div className="text-sm text-gray-600">Total Records</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{importResult.success}</div>
                      <div className="text-sm text-gray-600">Successfully Imported</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{importResult.errors}</div>
                      <div className="text-sm text-gray-600">Errors</div>
                  </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {importResult.masterDataCreated.itemCategories + importResult.masterDataCreated.items}
                      </div>
                      <div className="text-sm text-gray-600">Master Data Created</div>
                    </div>
                  </div>

                  {importResult.masterDataCreated.itemCategories > 0 && (
                    <Alert>
                      <AlertDescription>
                        <strong>Master Data Created:</strong> {importResult.masterDataCreated.itemCategories} item categories, {importResult.masterDataCreated.items} items
                      </AlertDescription>
                    </Alert>
                  )}

                  {importResult.errorDetails.length > 0 && (
                    <div>
                      <h4 className="font-medium text-red-600 mb-2">Error Details:</h4>
                      <div className="max-h-40 overflow-y-auto space-y-1">
                        {importResult.errorDetails.map((error, index) => (
                          <div key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                            {error}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
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
            <Button
              onClick={importAssets}
              disabled={!selectedFile || isImporting}
              className="flex items-center gap-2"
            >
              {isImporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Import Assets
                </>
              )}
            </Button>
              </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}