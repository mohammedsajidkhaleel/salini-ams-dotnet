"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, FileSpreadsheet, CheckCircle, XCircle, AlertCircle, Download } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { employeeService, type EmployeeImportData } from "@/lib/services"

interface ImportResult {
  success: number
  errors: number
  total: number
  errorDetails: string[]
}

interface SimpleEmployeeImportModalProps {
  isOpen: boolean
  onClose: () => void
  onImportComplete: () => void
}

export function SimpleEmployeeImportModal({
  isOpen,
  onClose,
  onImportComplete
}: SimpleEmployeeImportModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState("")
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setImportResult(null)
    }
  }

  const parseCSV = (csvText: string): EmployeeImportData[] => {
    const lines = csvText.split('\n').filter(line => line.trim())
    if (lines.length < 2) return []
    
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
    const employees: EmployeeImportData[] = []
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim())
      if (values.length < headers.length) continue
      
      // Map CSV columns to EmployeeImportData
      const employee: EmployeeImportData = {
        employeeId: values[headers.indexOf('code')] || values[headers.indexOf('employee id')] || '',
        firstName: values[headers.indexOf('first_name')] || values[headers.indexOf('first name')] || '',
        lastName: values[headers.indexOf('last_name')] || values[headers.indexOf('last name')] || '',
        email: values[headers.indexOf('email')] || '',
        phone: values[headers.indexOf('mobile_number')] || values[headers.indexOf('phone')] || values[headers.indexOf('mobile number')] || '',
        status: values[headers.indexOf('status')] === 'active' ? 1 : 0,
        departmentName: values[headers.indexOf('department')] || '',
        companyName: values[headers.indexOf('company')] || '',
        projectName: values[headers.indexOf('project')] || '',
        nationalityName: values[headers.indexOf('nationality')] || '',
        employeeCategoryName: values[headers.indexOf('category')] || '',
        employeePositionName: values[headers.indexOf('position')] || '',
        costCenterName: values[headers.indexOf('cost_center')] || values[headers.indexOf('cost center')] || ''
      }
      
      // Handle the case where name is in a single field (like your sample data)
      if (!employee.firstName && !employee.lastName) {
        const nameField = values[headers.indexOf('name')] || ''
        const nameParts = nameField.split(' ')
        if (nameParts.length >= 2) {
          employee.firstName = nameParts[0]
          employee.lastName = nameParts.slice(1).join(' ')
        } else {
          employee.firstName = nameField
          employee.lastName = ''
        }
      }
      
      employees.push(employee)
    }
    
    return employees
  }

  const downloadTemplate = () => {
    const headers = [
      "code",
      "first_name", 
      "last_name",
      "email",
      "mobile_number",
      "status",
      "department",
      "sub_department", 
      "position",
      "category",
      "nationality",
      "company",
      "project",
      "cost_center"
    ]
    
    const csvContent = headers.join(",") + "\n"
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "employee_import_template.csv"
    link.click()
    window.URL.revokeObjectURL(url)
  }

  const importEmployees = async () => {
    if (!selectedFile) return

    setIsImporting(true)
    setProgress(0)
    setImportResult(null)
    setCurrentStep("Reading CSV file...")

    try {
      // Use the employee service's import method
      setProgress(20)
      setCurrentStep("Parsing CSV data...")
      
      // Read and parse the CSV file
      const csvText = await selectedFile.text()
      const employees = parseCSV(csvText)
      
      if (employees.length === 0) {
        throw new Error("No valid employee data found in the CSV file")
      }
      
      setProgress(40)
      setCurrentStep(`Sending ${employees.length} employees to server...`)
      
      // Send the parsed data to the backend
      const result = await employeeService.importEmployees(employees)
      
      setProgress(75)
      setCurrentStep("Finalizing import...")
      
      // Create import result for display
      const importResult: ImportResult = {
        success: result.imported + (result.updated || 0),
        errors: result.errors.length,
        total: result.imported + (result.updated || 0) + result.errors.length,
        errorDetails: result.errors.map(error => `Row ${error.row}: ${error.message}`)
      }

      setProgress(100)
      setCurrentStep("Import completed!")
      setImportResult(importResult)

      // Show success message
      if (result.success && (result.imported > 0 || (result.updated && result.updated > 0))) {
        const importedText = result.imported > 0 ? `${result.imported} imported` : '';
        const updatedText = result.updated > 0 ? `${result.updated} updated` : '';
        const actionText = [importedText, updatedText].filter(Boolean).join(', ');
        
        toast({
          title: "Import completed successfully",
          description: `Successfully processed ${actionText} employees.`,
        })
        onImportComplete()
      } else if (result.errors.length > 0) {
        toast({
          title: "Import completed with errors",
          description: `${result.errors.length} employees failed to import. Check the details below.`,
          variant: "destructive"
        })
      } else {
        toast({
          title: "No employees processed",
          description: "No valid employees were found in the file.",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Import error:', error)
      toast({
        title: "Import failed",
        description: `An error occurred during import: ${error}`,
        variant: "destructive"
      })
      
      setImportResult({
        success: 0,
        errors: 1,
        total: 1,
        errorDetails: [`Import failed: ${error}`]
      })
    } finally {
      setIsImporting(false)
    }
  }

  const resetModal = () => {
    setSelectedFile(null)
    setImportResult(null)
    setProgress(0)
    setCurrentStep("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleClose = () => {
    resetModal()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import Employees
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* File Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Select File</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isImporting}
                >
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Choose File
                </Button>
                <Button
                  variant="outline"
                  onClick={downloadTemplate}
                  disabled={isImporting}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Template
                </Button>
              </div>
              
              {selectedFile && (
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <FileSpreadsheet className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">{selectedFile.name}</span>
                  <span className="text-xs text-gray-500">
                    ({(selectedFile.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
              )}
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
                    <div className="text-2xl font-bold text-green-600">
                      {importResult.success}
                    </div>
                    <div className="text-sm text-gray-600">Successful</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {importResult.errors}
                    </div>
                    <div className="text-sm text-gray-600">Errors</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {importResult.total}
                    </div>
                    <div className="text-sm text-gray-600">Total</div>
                  </div>
                </div>

                {importResult.errorDetails.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-red-600">Error Details:</h4>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {importResult.errorDetails.map((error, index) => (
                        <div key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                          {error}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose} disabled={isImporting}>
              {importResult ? "Close" : "Cancel"}
            </Button>
            {selectedFile && !importResult && (
              <Button onClick={importEmployees} disabled={isImporting}>
                {isImporting ? "Importing..." : "Import Employees"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
