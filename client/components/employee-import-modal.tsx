"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, FileSpreadsheet, CheckCircle, XCircle, AlertCircle, Download } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { employeeService } from "@/lib/services/employeeService"
import { departmentService } from "@/lib/services/departmentService"
import { subDepartmentService } from "@/lib/services/subDepartmentService"
import { employeePositionService } from "@/lib/services/employeePositionService"
import { employeeCategoryService } from "@/lib/services/employeeCategoryService"
import { nationalityService } from "@/lib/services/nationalityService"
import { companyService } from "@/lib/services/companyService"
import { ProjectService } from "@/lib/services/projectService"
import { costCenterService } from "@/lib/services/costCenterService"

interface ImportResult {
  success: number
  errors: number
  total: number
  errorDetails: string[]
}

interface EmployeeImportData {
  code: string
  name: string
  email: string
  mobile_number?: string
  id_number?: string
  department?: string
  sub_department?: string
  position?: string
  category?: string
  joining_date?: string
  nationality?: string
  sponsor?: string
  project?: string
  status?: string
  address?: string
}

interface EmployeeImportModalProps {
  isOpen: boolean
  onClose: () => void
  onImportComplete: () => void
}

export function EmployeeImportModal({ isOpen, onClose, onImportComplete }: EmployeeImportModalProps) {
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [progress, setProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // Debug: Log when modal opens
  console.log('EmployeeImportModal rendered, isOpen:', isOpen)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.name.endsWith('.csv') || file.type === 'text/csv') {
        setSelectedFile(file)
        setImportResult(null)
      } else {
        toast({
          title: "Invalid file type",
          description: "Please select a CSV file (.csv)",
          variant: "destructive"
        })
      }
    }
  }

  const parseCSVFile = async (file: File): Promise<EmployeeImportData[]> => {
    try {
      const text = await file.text()
      const lines = text.split('\n').filter(line => line.trim())
      if (lines.length < 2) return []
      
      const employees: EmployeeImportData[] = []
      
      // Parse header row to get column mapping
      const headerLine = lines[0]
      const headers = headerLine.match(/("([^"]*)"|([^,]*))/g)?.map(h => h.replace(/^"|"$/g, '').trim().toLowerCase()) || []
      
      // Create column index mapping
      const columnMap: { [key: string]: number } = {}
      headers.forEach((header, index) => {
        columnMap[header] = index
      })
      
      console.log('CSV Headers found:', headers)
      console.log('Column mapping:', columnMap)
      
      // Process data rows
      let processedRows = 0
      let skippedRows = 0
      
      for (let i = 1; i < lines.length; i++) {
        try {
          const values = lines[i].match(/("([^"]*)"|([^,]*))/g)?.map(v => v.replace(/^"|"$/g, '').trim()) || []
          
          if (values.length > 0) {
            const employee: EmployeeImportData = {
              code: values[columnMap['code']] || '',
              name: values[columnMap['name']] || '',
              email: values[columnMap['email']] || '',
              mobile_number: values[columnMap['mobile_number']] || values[columnMap['mobile']] || values[columnMap['phone']] || '',
              id_number: values[columnMap['id_number']] || values[columnMap['id']] || values[columnMap['employee_id']] || '',
              department: values[columnMap['department']] || values[columnMap['dept']] || '',
              sub_department: values[columnMap['sub_department']] || values[columnMap['subdept']] || values[columnMap['sub_dept']] || '',
              position: values[columnMap['position']] || values[columnMap['job_title']] || values[columnMap['title']] || '',
              category: values[columnMap['category']] || values[columnMap['emp_category']] || '',
              joining_date: values[columnMap['joining_date']] || values[columnMap['join_date']] || values[columnMap['start_date']] || '',
              nationality: values[columnMap['nationality']] || values[columnMap['country']] || '',
              sponsor: values[columnMap['sponsor']] || values[columnMap['sponsorship']] || '',
              project: values[columnMap['project']] || values[columnMap['project_name']] || '',
              status: values[columnMap['status']] || 'active',
              address: values[columnMap['address']] || values[columnMap['location']] || ''
            }
            
            // Debug: Log the parsed employee data for the first few rows
            if (i <= 3) {
              console.log(`Row ${i + 1} parsed data:`, employee)
              console.log(`Row ${i + 1} raw values:`, values)
            }
            
            // Check for empty rows
            if (!employee.code && !employee.name) {
              console.log(`Skipping empty row ${i + 1}`)
              skippedRows++
              continue
            }
            
            employees.push(employee)
            processedRows++
          } else {
            skippedRows++
          }
        } catch (rowError) {
          console.error(`Error parsing row ${i + 1}:`, rowError)
          skippedRows++
          // Continue with other rows
        }
      }
      
      console.log(`CSV Parsing Summary:`)
      console.log(`- Total lines in file: ${lines.length}`)
      console.log(`- Header line: 1`)
      console.log(`- Data lines: ${lines.length - 1}`)
      console.log(`- Successfully parsed: ${processedRows}`)
      console.log(`- Skipped (empty/error): ${skippedRows}`)
      console.log(`- Total employees to process: ${employees.length}`)
      
      return employees
    } catch (error) {
      console.error('Error parsing CSV file:', error)
      throw new Error(`Failed to parse CSV file: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const validateEmployeeData = (employee: EmployeeImportData): string[] => {
    const errors: string[] = []
    
    if (!employee.code) errors.push("Employee code is required")
    if (!employee.name) errors.push("Employee name is required")
    
    // Email validation - if provided, it must be valid format
    if (employee.email && employee.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(employee.email.trim())) {
        errors.push(`Invalid email format: "${employee.email}"`)
      }
    }
    // Note: If email is not provided, we'll generate a default email using employee code
    
    // Note: Invalid joining date formats will be handled gracefully during import (set to null)
    // We don't treat them as blocking errors since the import logic already handles this
    
    return errors
  }

  const importEmployees = async () => {
    if (!selectedFile) return

    setIsImporting(true)
    setProgress(0)
    setImportResult(null)

    // Add timeout mechanism
    const timeoutId = setTimeout(() => {
      if (progress < 20) {
        console.warn('Import seems stuck, showing timeout message')
        toast({
          title: "Import Taking Longer",
          description: "The import is taking longer than expected. Please wait or try refreshing the page.",
          variant: "default"
        })
      }
    }, 10000) // 10 second timeout

    try {
      console.log('Starting import process...')
      setProgress(5)
      
      const employees = await parseCSVFile(selectedFile)
      clearTimeout(timeoutId)
      
      if (employees.length === 0) {
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
        total: employees.length,
        errorDetails: []
      }

      setProgress(10)
      console.log('Progress: 10% - Starting database connection test...')

      // Step 1: Load all master data
      console.log('Loading master data...')
      
      // First, let's check if the employees table exists and get a sample
      try {
        console.log('Testing database connection...')
        const sampleResponse = await employeeService.getEmployees({
          pageNumber: 1,
          pageSize: 1
        });
        
        if (!sampleResponse) {
          console.error('Error accessing employees table: No response')
          toast({
            title: "Database Error",
            description: "Cannot access employees table: No response",
            variant: "destructive"
          })
          setIsImporting(false)
          return
        }
        
        console.log('Database connection successful. Sample employee:', sampleResponse.items?.[0])
        setProgress(15)
      } catch (error) {
        console.error('Database connection failed:', error)
        toast({
          title: "Connection Error",
          description: `Failed to connect to database: ${error}`,
          variant: "destructive"
        })
        setIsImporting(false)
        return
      }
      
      console.log('Loading master data tables...')
      setProgress(18)
      
      // Declare variables in outer scope
      let departments = []
      let subDepartments = []
      let positions = []
      let categories = []
      let nationalities = []
      let companies = []
      let projects = []
      let costCenters = []
      
      try {
        const [deptRes, subDeptRes, posRes, catRes, natRes, compRes, projRes, ccRes] = await Promise.all([
          departmentService.getDepartments({ pageNumber: 1, pageSize: 1000 }),
          subDepartmentService.getSubDepartments({ pageNumber: 1, pageSize: 1000 }),
          employeePositionService.getEmployeePositions({ pageNumber: 1, pageSize: 1000 }),
          employeeCategoryService.getEmployeeCategories({ pageNumber: 1, pageSize: 1000 }),
          nationalityService.getNationalities({ pageNumber: 1, pageSize: 1000 }),
          companyService.getCompanies({ pageNumber: 1, pageSize: 1000 }),
          ProjectService.getAll(),
          costCenterService.getCostCenters({ pageNumber: 1, pageSize: 1000 })
        ])

        // Extract data from responses
        departments = deptRes?.items || []
        subDepartments = subDeptRes?.items || []
        positions = posRes?.items || []
        categories = catRes?.items || []
        nationalities = natRes?.items || []
        companies = compRes?.items || []
        projects = projRes || []
        costCenters = ccRes?.items || []

        console.log('Master data loaded successfully:', {
          departments: departments.length,
          subDepartments: subDepartments.length,
          positions: positions.length,
          categories: categories.length,
          nationalities: nationalities.length,
          companies: companies.length,
          projects: projects.length,
          costCenters: costCenters.length
        })

        setProgress(25)
      } catch (error) {
        console.error('Error loading master data:', error)
        toast({
          title: "Data Loading Error",
          description: `Failed to load master data: ${error}`,
          variant: "destructive"
        })
        setIsImporting(false)
        return
      }

      // Step 2: Get existing employees to check for duplicates
      console.log('Checking existing employees...')
      setProgress(28)
      
      // Declare variables in outer scope
      let existingCodes = new Set()
      let existingEmployeeMap = new Map()
      
      try {
        const employeeCodes = employees.map(emp => emp.code).filter(Boolean)
        console.log(`Checking for ${employeeCodes.length} employee codes...`)
        
        const existingResponse = await employeeService.getEmployees({
          pageNumber: 1,
          pageSize: 10000 // Get all employees to check for existing codes
        });

        if (!existingResponse) {
          console.error('Error checking existing employees: No response')
          toast({
            title: "Database Error",
            description: "Failed to check existing employees: No response",
            variant: "destructive"
          })
          setIsImporting(false)
          return
        }

        const existingEmployees = existingResponse.items || [];
        existingCodes = new Set(existingEmployees.map(emp => emp.employeeId).filter(Boolean))
        existingEmployeeMap = new Map(existingEmployees.map(emp => [emp.employeeId, emp.id]).filter(([code]) => code))

        console.log(`Found ${existingCodes.size} existing employees out of ${employeeCodes.length} codes`)
        setProgress(30)
      } catch (error) {
        console.error('Error checking existing employees:', error)
        toast({
          title: "Database Error",
          description: `Failed to check existing employees: ${error}`,
          variant: "destructive"
        })
        setIsImporting(false)
        return
      }

      // Step 3: Validate and prepare data
      console.log('Validating and preparing data...')
      console.log('Total employees parsed:', employees.length)
      console.log('Sample parsed employee:', employees[0])
      const validEmployees = []
      const employeesToInsert = []
      const employeesToUpdate = []
      const validationErrors = []

      for (let i = 0; i < employees.length; i++) {
        const employee = employees[i]
        setProgress(30 + (i / employees.length) * 40)

        // Validate employee data
        const employeeValidationErrors = validateEmployeeData(employee)
        if (employeeValidationErrors.length > 0) {
          result.errors++
          const errorMessage = `Row ${i + 2}: ${employeeValidationErrors.join(', ')}`
          result.errorDetails.push(errorMessage)
          validationErrors.push(errorMessage)
          console.log(`Validation failed for row ${i + 2}:`, employee, employeeValidationErrors)
          continue
        }

        // Resolve master data IDs - only use IDs if they exist, otherwise use null
        const departmentId = departments.find(d => d.name === employee.department)?.id || null
        const subDepartmentId = subDepartments.find(s => s.name === employee.sub_department)?.id || null
        const positionId = positions.find(p => p.name === employee.position)?.id || null
        const categoryId = categories.find(c => c.name === employee.category)?.id || null
        const nationalityId = nationalities.find(n => n.name === employee.nationality)?.id || null
        const companyId = companies.find(c => c.name === employee.sponsor)?.id || null
        const projectId = projects.find(p => p.name === employee.project)?.id || null

        // Validate and format joining_date
        let joiningDate = null
        if (employee.joining_date && employee.joining_date.trim()) {
          const dateRegex = /^\d{4}-\d{2}-\d{2}$/
          if (dateRegex.test(employee.joining_date.trim())) {
            joiningDate = employee.joining_date.trim()
          } else {
            console.warn(`⚠️ Invalid joining date format for employee ${employee.code}: "${employee.joining_date}". Expected YYYY-MM-DD format. Setting to null.`)
            // Add a warning to the result but don't block the import
            result.errorDetails.push(`Row ${i + 2}: Invalid joining date format "${employee.joining_date}" for ${employee.code}. Expected YYYY-MM-DD format. Date set to null.`)
          }
        }

        // Split name into first_name and last_name for database compatibility
        const nameParts = employee.name.trim().split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        const employeeData = {
          code: employee.code,
          name: employee.name,
          first_name: firstName,
          last_name: lastName,
          email: employee.email && employee.email.trim() ? employee.email.trim() : null,
          mobile_number: employee.mobile_number || null,
          id_number: employee.id_number || null,
          department: departmentId,
          sub_department: subDepartmentId,
          position: positionId,
          category: categoryId,
          joining_date: joiningDate,
          nationality: nationalityId,
          company: companyId,
          project: projectId,
          cost_center: null, // Will be set if needed
          status: employee.status || 'active',
          address: employee.address || null,
          created_at: new Date().toISOString(),
        }

        if (existingCodes.has(employee.code)) {
          // Update existing employee
          employeesToUpdate.push({
            ...employeeData,
            id: existingEmployeeMap.get(employee.code)
          })
        } else {
          // Insert new employee
          employeesToInsert.push({
            ...employeeData,
            id: `EMP${Date.now()}${i}`
          })
        }
      }

      console.log(`Final counts - To insert: ${employeesToInsert.length}, To update: ${employeesToUpdate.length}`)
      console.log(`Validation errors: ${validationErrors.length}`)
      console.log(`Total processed: ${employeesToInsert.length + employeesToUpdate.length + validationErrors.length}`)
      console.log(`Original count: ${employees.length}`)
      
      if (validationErrors.length > 0) {
        console.log('First 10 validation errors:', validationErrors.slice(0, 10))
      }
      
      // Debug: Show sample of employees that will be inserted
      if (employeesToInsert.length > 0) {
        console.log('Sample employees to insert:', employeesToInsert.slice(0, 3))
      }
      
      // Debug: Show sample of employees that will be updated
      if (employeesToUpdate.length > 0) {
        console.log('Sample employees to update:', employeesToUpdate.slice(0, 3))
      }
      
      setProgress(70)

      // Step 4: Separate bulk operations for inserts and updates to avoid ON CONFLICT issues
      console.log(`Performing bulk operations for ${employeesToInsert.length} new employees and ${employeesToUpdate.length} updates...`)
      
      // Insert new employees
      if (employeesToInsert.length > 0) {
        console.log('Inserting new employees:', employeesToInsert.length)
        try {
          // Insert employees one by one using the API
          for (const employee of employeesToInsert) {
            try {
              await employeeService.createEmployee(employee);
              result.success++;
            } catch (error) {
              result.errors++;
              result.errorDetails.push(`Insert failed for employee ${employee.code}: ${error}`);
              console.error('Insert error for employee:', employee.code, error);
            }
          }
          console.log(`Bulk insert completed, processed ${employeesToInsert.length} new employees`)
        } catch (error) {
          result.errors += employeesToInsert.length
          result.errorDetails.push(`Bulk insert failed: ${error}`)
          console.error('Bulk insert error:', error)
        }
      }

      // Update existing employees
      if (employeesToUpdate.length > 0) {
        console.log('Updating existing employees:', employeesToUpdate.length)
        for (const employee of employeesToUpdate) {
          try {
            await employeeService.updateEmployee(employee.id, employee);
            result.success++;
            console.log(`Update successful for employee: ${employee.code}`)
          } catch (error) {
            result.errors++;
            result.errorDetails.push(`Update failed for employee ${employee.code}: ${error}`);
            console.error('Update error for employee:', employee.code, error);
          }
        }
      }

      setProgress(100)
      setImportResult(result)

      // Log final summary
      console.log('=== IMPORT SUMMARY ===')
      console.log(`Total employees in CSV: ${employees.length}`)
      console.log(`Successfully processed: ${result.success}`)
      console.log(`Errors: ${result.errors}`)
      console.log(`New employees: ${employeesToInsert.length}`)
      console.log(`Updated employees: ${employeesToUpdate.length}`)
      console.log(`Validation errors: ${validationErrors.length}`)
      console.log('=====================')

      if (result.success > 0) {
        toast({
          title: "Import completed",
          description: `Successfully processed ${result.success} employees (${employeesToInsert.length} new, ${employeesToUpdate.length} updated). ${result.errors} employees had errors.`,
        })
        onImportComplete()
      } else if (result.errors > 0) {
        toast({
          title: "Import failed",
          description: `All ${result.errors} employees had validation errors. Check console for details.`,
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
      
      // Set a basic error result
      setImportResult({
        success: 0,
        errors: 1,
        total: 0,
        errorDetails: [`Import failed: ${errorMessage}`]
      })
    } finally {
      clearTimeout(timeoutId)
      setIsImporting(false)
    }
  }

  const downloadTemplate = () => {
    const headers = [
      'code', 'name', 'email', 'mobile_number', 'id_number', 
      'department', 'sub_department', 'position', 'category', 
      'joining_date', 'nationality', 'sponsor', 'project', 'status', 'address'
    ]
    
    const sampleData = [
      'EMP001', 'John Smith', 'john.smith@company.com', '+1-555-0101', 'ID123456789',
      'Information Technology', 'Software Development', 'Senior Developer', 'Full-time',
      '2024-01-15', 'United States', 'Company Sponsored', 'Digital Transformation', 'active', '123 Main St'
    ]

    const csvContent = [headers, sampleData].map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'employee_import_template.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const handleClose = () => {
    setSelectedFile(null)
    setImportResult(null)
    setProgress(0)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Employees from CSV</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Template Download */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Download Template
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Download the template file to see the required format and column headers.
              </p>
              <Button onClick={downloadTemplate} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Download CSV Template
              </Button>
            </CardContent>
          </Card>

          {/* File Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload CSV File
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <FileSpreadsheet className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-sm text-gray-600 mb-2">
                    {selectedFile ? selectedFile.name : "Select a CSV file (.csv)"}
                  </p>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    disabled={isImporting}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Choose File
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
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
                      onClick={() => setSelectedFile(null)}
                      variant="outline"
                      disabled={isImporting}
                    >
                      Clear
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Progress */}
          {isImporting && (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Importing employees...</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${progress}%` }}
                    ></div>
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
                  {importResult.errors === 0 ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-yellow-500" />
                  )}
                  Import Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <Badge variant="default" className="bg-green-500">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Success: {importResult.success}
                    </Badge>
                    <Badge variant="destructive">
                      <XCircle className="h-3 w-3 mr-1" />
                      Errors: {importResult.errors}
                    </Badge>
                    <Badge variant="outline">
                      Total: {importResult.total}
                    </Badge>
                  </div>

                  {importResult.errorDetails.length > 0 && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="space-y-1">
                          <p className="font-medium">Error Details:</p>
                          <ul className="text-sm space-y-1 max-h-32 overflow-y-auto">
                            {importResult.errorDetails.map((error, index) => (
                              <li key={index} className="text-red-600">
                                {error}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>Import Instructions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p><strong>Required columns:</strong> code, name</p>
                <p><strong>Optional columns:</strong> email, mobile_number (or mobile/phone), id_number (or id/employee_id), department (or dept), sub_department (or subdept/sub_dept), position (or job_title/title), category (or emp_category), joining_date (or join_date/start_date), nationality (or country), sponsor (or sponsorship), project (or project_name), status, address (or location)</p>
                <p><strong>Flexible headers:</strong> The system recognizes multiple header name variations (e.g., "mobile", "phone", or "mobile_number" all work)</p>
                <p><strong>Date format:</strong> YYYY-MM-DD (e.g., 2024-01-15). Leave empty for null values. Invalid date formats will be set to null with a warning.</p>
                <p><strong>Status values:</strong> active, inactive</p>
                <p><strong>Note:</strong> Employee codes must be unique. Email, ID number, and joining date are optional. If email is provided, it must be in valid format. Master data fields (department, position, company, project, etc.) will be set to null if not found in the system.</p>
                <p><strong>Admin Only:</strong> This feature is only available to Super Admins.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
