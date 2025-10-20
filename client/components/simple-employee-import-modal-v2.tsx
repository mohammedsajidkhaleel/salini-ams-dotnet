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

export function SimpleEmployeeImportModalV2({
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
      if (values.length !== headers.length) continue
      
      const employee: any = {}
      headers.forEach((header, index) => {
        employee[header] = values[index] || ''
      })
      
      // Map CSV columns to EmployeeImportData format
      if (employee.code && employee.name) {
        const nameParts = employee.name.trim().split(' ')
        const firstName = nameParts[0] || ''
        const lastName = nameParts.slice(1).join(' ') || ''
        
        employees.push({
          employeeId: employee.code,
          firstName: firstName,
          lastName: lastName,
          email: employee.email || undefined,
          phone: employee.mobile_number || employee.phone || undefined,
          status: employee.status === 'active' ? 1 : 0,
          departmentName: employee.department || undefined,
          subDepartmentName: employee.sub_department || undefined,
          companyName: employee.company || undefined,
          projectName: employee.project || undefined,
          nationalityName: employee.nationality || undefined,
          employeeCategoryName: employee.category || undefined,
          employeePositionName: employee.position || undefined,
          costCenterName: employee.cost_center || undefined
        })
      }
    }
    
    return employees
  }

  const importEmployees = async () => {
    if (!selectedFile) return

    setIsImporting(true)
    setProgress(0)
    setImportResult(null)
    setCurrentStep("Reading file...")

    try {
      const text = await selectedFile.text()
      setProgress(20)
      setCurrentStep("Parsing CSV...")
      
      const employees = parseCSV(text)
      if (employees.length === 0) {
        toast({
          title: "No valid data found",
          description: "The CSV file doesn't contain valid employee data",
          variant: "destructive"
        })
        setIsImporting(false)
        return
      }

      setProgress(40)
      setCurrentStep("Importing employees...")

      // Call the real backend API
      const result = await employeeService.importEmployees(employees)

      setProgress(100)
      setCurrentStep("Import completed!")

      const importResult: ImportResult = {
        success: result.imported + (result.updated || 0),
        errors: result.errors.length,
        total: employees.length,
        errorDetails: result.errors.map(error => `Row ${error.row}: ${error.message}`)
      }

      if (result.imported > 0 || (result.updated && result.updated > 0)) {
        const importedText = result.imported > 0 ? `${result.imported} imported` : '';
        const updatedText = result.updated > 0 ? `${result.updated} updated` : '';
        const actionText = [importedText, updatedText].filter(Boolean).join(', ');
        
        toast({
          title: "Import successful",
          description: `Successfully processed ${actionText} employees`,
          variant: "default"
        })
        onImportComplete()
      } else {
        toast({
          title: "Import failed",
          description: "No employees were imported",
          variant: "destructive"
        })
      }

      setImportResult(importResult)
      setIsImporting(false)

    } catch (error) {
      console.error("Import failed:", error)
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      })
      setIsImporting(false)
    }
  }

  const downloadTemplate = () => {
    const headers = [
      'code', 'name', 'email', 'mobile_number', 
      'department', 'sub_department', 'position', 'category', 
      'joining_date', 'nationality', 'company', 'project', 'cost_center', 'status'
    ]
    
    const sampleData = [
      'EMP001', 'John Smith', 'john.smith@company.com', '+1-555-0101',
      'Engineering', 'Frontend Team', 'Senior Developer', 'Full-time',
      '2024-01-15', 'American', 'Tech Corp', 'Project Alpha', 'CC001', 'active'
    ]
    
    const csvContent = [headers, sampleData].map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'employee_import_template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Import Employees
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* File Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Upload CSV File</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    {selectedFile ? selectedFile.name : "Choose a CSV file to upload"}
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isImporting}
                  >
                    Select File
                  </Button>
                </div>
              </div>

              {selectedFile && (
                <div className="flex gap-2">
                  <Button
                    onClick={importEmployees}
                    disabled={isImporting}
                    className="flex-1"
                  >
                    {isImporting ? "Importing..." : "Import Employees"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedFile(null)
                      setImportResult(null)
                      if (fileInputRef.current) {
                        fileInputRef.current.value = ''
                      }
                    }}
                    disabled={isImporting}
                  >
                    Clear
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Progress */}
          {isImporting && (
            <Card>
              <CardContent className="pt-6">
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

          {/* Results */}
          {importResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {importResult.success > 0 ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  Import Results
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{importResult.success}</div>
                    <div className="text-sm text-gray-600">Success</div>
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
                      <div className="space-y-1">
                        <p className="font-medium">Errors:</p>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          {importResult.errorDetails.map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {/* Template Download */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">CSV Template</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Download the template to see the required format for importing employees.
                </p>
                <Button variant="outline" onClick={downloadTemplate}>
                  <Download className="h-4 w-4 mr-2" />
                  Download Template
                </Button>
                <div className="text-xs text-gray-500 space-y-1">
                  <p><strong>Required columns:</strong> code, name</p>
                  <p><strong>Optional columns:</strong> email, mobile_number, department, sub_department, position, category, nationality, company, project, cost_center, status</p>
                  <p><strong>Status values:</strong> active, inactive</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
