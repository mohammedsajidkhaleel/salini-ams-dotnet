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
    
    // Helper function to parse CSV line properly handling empty fields and quoted values
    const parseCSVLine = (line: string): string[] => {
      const result: string[] = []
      let current = ''
      let inQuotes = false
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i]
        const nextChar = line[i + 1]
        
        if (char === '"') {
          if (inQuotes && nextChar === '"') {
            // Escaped quote
            current += '"'
            i++ // Skip next quote
          } else {
            // Toggle quote state
            inQuotes = !inQuotes
          }
        } else if (char === ',' && !inQuotes) {
          // End of field
          result.push(current.trim())
          current = ''
        } else {
          current += char
        }
      }
      
      // Add the last field
      result.push(current.trim())
      
      return result
    }
    
    // Parse header row
    const headerLine = lines[0]
    const headers = parseCSVLine(headerLine).map(h => h.replace(/^"|"$/g, '').trim().toLowerCase())
    
    const employees: EmployeeImportData[] = []
    
    // Create column index mapping for flexible header matching
    const columnMap: { [key: string]: number } = {}
    headers.forEach((header, index) => {
      columnMap[header] = index
      // Also map common variations
      if (header === 'code' || header === 'employee_code' || header === 'employee_id') {
        columnMap['code'] = index
        columnMap['employee_code'] = index
        columnMap['employee_id'] = index
      }
      if (header === 'name' || header === 'employee_name' || header === 'full_name') {
        columnMap['name'] = index
        columnMap['employee_name'] = index
        columnMap['full_name'] = index
      }
      if (header === 'mobile_number' || header === 'mobile' || header === 'phone') {
        columnMap['mobile_number'] = index
        columnMap['mobile'] = index
        columnMap['phone'] = index
      }
      if (header === 'sub_department' || header === 'subdept' || header === 'sub_dept') {
        columnMap['sub_department'] = index
        columnMap['subdept'] = index
        columnMap['sub_dept'] = index
      }
    })
    
    for (let i = 1; i < lines.length; i++) {
      try {
        // Parse row using proper CSV parsing
        const values = parseCSVLine(lines[i])
        
        // Ensure values array matches headers length (pad with empty strings if needed)
        while (values.length < headers.length) {
          values.push('')
        }
        
        if (values.length === 0) continue
        
        // Get values using column mapping - only return non-empty values
        const getValue = (key: string): string => {
          const index = columnMap[key]
          if (index === undefined || index >= values.length) {
            return ''
          }
          const value = values[index] || ''
          return value.trim()
        }
        
        const code = getValue('code') || getValue('employee_code') || getValue('employee_id')
        const name = getValue('name') || getValue('employee_name') || getValue('full_name')
        
        // Skip rows without required fields
        if (!code || !name) {
          console.log(`Skipping row ${i + 1}: missing code or name. Code: "${code}", Name: "${name}"`)
          continue
        }
        
        const nameParts = name.split(' ').filter(p => p.trim())
        const firstName = nameParts[0] || ''
        const lastName = nameParts.slice(1).join(' ') || ''
        
        // Determine status
        const statusStr = (getValue('status') || 'active').toLowerCase()
        const status = statusStr === 'active' ? 1 : 0
        
        // Helper to get value only if it's not empty
        const getValueOrUndefined = (...keys: string[]): string | undefined => {
          for (const key of keys) {
            const value = getValue(key)
            if (value) return value
          }
          return undefined
        }
        
        const employeeData = {
          employeeId: code,
          firstName: firstName,
          lastName: lastName,
          email: getValueOrUndefined('email'),
          phone: getValueOrUndefined('mobile_number', 'mobile', 'phone'),
          status: status,
          departmentName: getValueOrUndefined('department', 'dept'),
          subDepartmentName: getValueOrUndefined('sub_department', 'subdept', 'sub_dept'),
          companyName: getValueOrUndefined('company', 'sponsor'),
          projectName: getValueOrUndefined('project', 'project_name'),
          nationalityName: getValueOrUndefined('nationality', 'country'),
          employeeCategoryName: getValueOrUndefined('category', 'emp_category'),
          employeePositionName: getValueOrUndefined('position', 'job_title', 'title'),
          costCenterName: getValueOrUndefined('cost_center', 'costcenter')
        }
        
        employees.push(employeeData)
      } catch (rowError) {
        console.error(`Error parsing row ${i + 1}:`, rowError)
        // Continue with other rows
      }
    }
    
    console.log(`Parsed ${employees.length} employees from CSV`)
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
      console.log(`Parsed ${employees.length} employees from CSV`)
      
      if (employees.length === 0) {
        // Try to provide more helpful error message
        const lines = text.split('\n').filter(line => line.trim())
        const headerLine = lines[0] || ''
        const headers = headerLine.split(',').map(h => h.trim().toLowerCase())
        
        const hasCode = headers.some(h => h.includes('code') || h.includes('employee_id'))
        const hasName = headers.some(h => h.includes('name') || h.includes('employee_name'))
        
        let errorMessage = "The CSV file doesn't contain valid employee data."
        if (!hasCode || !hasName) {
          errorMessage += ` Missing required columns: ${!hasCode ? 'code/employee_id' : ''} ${!hasName ? 'name/employee_name' : ''}.`
        } else if (lines.length < 2) {
          errorMessage += " The file appears to have only headers and no data rows."
        } else {
          errorMessage += " Please check that each row has both 'code' and 'name' fields."
        }
        
        toast({
          title: "No valid data found",
          description: errorMessage,
          variant: "destructive"
        })
        setIsImporting(false)
        return
      }
      
      // Log first few employees for debugging
      console.log('Sample employees to import:', employees.slice(0, 3))

      setProgress(40)
      setCurrentStep(`Importing ${employees.length} employees...`)

      // Call the real backend API
      console.log('Sending employees to backend API:', employees.length)
      const result = await employeeService.importEmployees(employees)
      console.log('Import result:', result)

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

    } catch (error: any) {
      console.error("Import failed:", error)
      
      // Try to stringify error for debugging, but handle cases where it might fail
      try {
        const errorString = JSON.stringify(error, Object.getOwnPropertyNames(error), 2);
        console.error("Error details:", errorString);
      } catch (stringifyError) {
        console.error("Error details (could not stringify):", error);
        console.error("Error type:", typeof error);
        console.error("Error constructor:", error?.constructor?.name);
      }
      
      // Try to extract meaningful error message
      let errorMessage = "Unknown error occurred";
      
      if (error) {
        // Handle ApiError from apiClient
        if (typeof error === 'object' && 'statusCode' in error) {
          errorMessage = error.message || `HTTP ${error.statusCode}`;
          
          // If there are details, try to extract more information
          if (error.details) {
            if (typeof error.details === 'string') {
              errorMessage = error.details;
            } else if (typeof error.details === 'object' && error.details !== null) {
              // Check if it's the import result with errors
              if (Array.isArray(error.details.errors)) {
                const errorCount = error.details.errors.length;
                const importedCount = error.details.imported || 0;
                const updatedCount = error.details.updated || 0;
                
                if (importedCount > 0 || updatedCount > 0) {
                  errorMessage = `Import completed with ${errorCount} error(s). ${importedCount} imported, ${updatedCount} updated.`;
                } else {
                  errorMessage = `Import failed with ${errorCount} error(s).`;
                }
              } else if (error.details.message) {
                errorMessage = error.details.message;
              } else if (error.details.title) {
                errorMessage = error.details.title;
              }
            }
          }
        } else if (error instanceof Error) {
          errorMessage = error.message;
        } else if (typeof error === 'string') {
          errorMessage = error;
        } else if (error?.message) {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Import failed",
        description: errorMessage,
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
