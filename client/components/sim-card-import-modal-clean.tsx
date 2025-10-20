"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, FileSpreadsheet, CheckCircle, XCircle, AlertCircle, Download, Database } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { simTypeService } from "@/lib/services/simTypeService"
import { simProviderService } from "@/lib/services/simProviderService"
import { simCardPlanService } from "@/lib/services/simCardPlanService"
import { simCardService } from "@/lib/services/simCardService"
import { employeeService } from "@/lib/services/employeeService"
import { ProjectService } from "@/lib/services/projectService"

interface ImportResult {
  success: number
  errors: number
  total: number
  errorDetails: string[]
  masterDataCreated: {
    simTypes: number
    simProviders: number
    simCardPlans: number
  }
}

interface SimCardImportData {
  sim_account_no: string
  sim_service_no: string
  sim_start_date: string
  sim_type: string
  sim_provider: string
  sim_card_plan: string
  sim_status: string
  sim_serial_no: string
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
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // Timeout wrapper for database operations
  const withTimeout = async (promise: Promise<any>, timeoutMs: number, operation: string) => {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Operation '${operation}' timed out after ${timeoutMs}ms`)), timeoutMs)
    })
    
    return Promise.race([promise, timeoutPromise])
  }

  const importSimCards = async () => {
    if (!selectedFile) return

    setIsImporting(true)
    setProgress(0)
    setImportResult(null)
    setCurrentStep("Parsing CSV file...")

    try {
      console.log("🚀 Starting SIM card import process...")
      console.log("📁 File selected:", selectedFile.name, "Size:", selectedFile.size, "bytes")
      
      // Step 1: Parse CSV file
      console.log("📊 Step 1: Parsing CSV file...")
      const allSimCards = await parseCSVFile(selectedFile)
      console.log(`✅ Parsed ${allSimCards.length} SIM cards from CSV`)
      
      // TRUE BATCH PROCESSING: Process entries in batches of 100
      const BATCH_SIZE_LIMIT = 100
      const totalBatches = Math.ceil(allSimCards.length / BATCH_SIZE_LIMIT)
      
      console.log("📦 TRUE BATCH PROCESSING: Processing", allSimCards.length, "entries in", totalBatches, "batches of", BATCH_SIZE_LIMIT)
      
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
        errorDetails: [],
        masterDataCreated: {
          simTypes: 0,
          simProviders: 0,
          simCardPlans: 0
        }
      }

      // TRUE BATCH PROCESSING: Process each batch of 100 records
      for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
        const startIndex = batchIndex * BATCH_SIZE_LIMIT
        const endIndex = Math.min(startIndex + BATCH_SIZE_LIMIT, allSimCards.length)
        const batchSimCards = allSimCards.slice(startIndex, endIndex)
        const batchNumber = batchIndex + 1
        
        console.log(`📦 Processing Batch ${batchNumber}/${totalBatches}: Records ${startIndex + 1}-${endIndex} (${batchSimCards.length} records)`)
        
        setProgress(10 + (batchIndex / totalBatches) * 80)
        setCurrentStep(`Processing batch ${batchNumber}/${totalBatches} (${batchSimCards.length} records)...`)
        
        // Process this batch
        await processBatch(batchSimCards, batchNumber, totalBatches, result)
      }

      // Complete the import
      setProgress(100)
      setCurrentStep("Import completed!")
      setImportResult(result)

      // Verification: Check if project_id was actually saved
      if (result.success > 0) {
        console.log("✅ Import completed successfully!")
        console.log(`📊 Final results: ${result.success} successful, ${result.errors} errors`)
        console.log(`📊 Master data created:`, result.masterDataCreated)
        
        toast({
          title: "Import completed!",
          description: `Successfully imported ${result.success} SIM cards. ${result.errors > 0 ? `${result.errors} errors occurred.` : 'No errors.'}`,
          variant: result.errors > 0 ? "destructive" : "default"
        })
        
        onImportComplete?.()
      } else {
        console.error("❌ Import failed - no records were successfully processed")
        toast({
          title: "Import failed",
          description: "No SIM cards were successfully imported. Please check the error details.",
          variant: "destructive"
        })
      }

      setIsImporting(false)
    } catch (error) {
      console.error("💥 Import process failed:", error)
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive"
      })
      setIsImporting(false)
    }
  }

  // Process a single batch of SIM cards
  const processBatch = async (batchSimCards: SimCardImportData[], batchNumber: number, totalBatches: number, result: ImportResult) => {
    try {
      console.log(`🔍 Batch ${batchNumber}: Starting validation of ${batchSimCards.length} SIM cards...`)
      
      // Step 1: Validate this batch
      const validSimCards = []
      const validationErrors = []

      for (let i = 0; i < batchSimCards.length; i++) {
        const simCard = batchSimCards[i]
        const errors = validateSimCardData(simCard)
        
        if (errors.length > 0) {
          console.log(`❌ Validation errors for SIM card ${simCard.sim_account_no}:`, errors)
          validationErrors.push({
            row: i + 1,
            simAccountNo: simCard.sim_account_no,
            errors: errors
          })
          result.errors++
        } else {
          const cleanedSimCard = cleanSimCardData(simCard)
          validSimCards.push(cleanedSimCard)
        }
      }

      console.log(`✅ Batch ${batchNumber}: Validated ${validSimCards.length} valid SIM cards, ${validationErrors.length} with errors`)

      if (validSimCards.length === 0) {
        console.log(`⚠️ Batch ${batchNumber}: No valid SIM cards to process`)
        return
      }

      // Step 2: Load master data for this batch
      await loadMasterDataForBatch(validSimCards, result)

      // Step 3: Process this batch
      await processValidatedBatch(validSimCards, batchNumber, result)

    } catch (error) {
      console.error(`💥 Batch ${batchNumber} processing failed:`, error)
      result.errors += batchSimCards.length
      result.errorDetails.push(`Batch ${batchNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Load master data for a batch
  const loadMasterDataForBatch = async (validSimCards: SimCardImportData[], result: ImportResult) => {
    console.log("🏗️ Loading master data for batch...")
    
    // Get unique values from this batch
    const uniqueSimTypes = [...new Set(validSimCards.map(sc => sc.sim_type).filter(Boolean))]
    const uniqueProviders = [...new Set(validSimCards.map(sc => sc.sim_provider).filter(Boolean))]
    const uniquePlans = [...new Set(validSimCards.map(sc => sc.sim_card_plan).filter(Boolean))]

    // Load existing master data
    const existingSimTypesResponse = await simTypeService.getSimTypes({ pageNumber: 1, pageSize: 1000 });
    const existingProvidersResponse = await simProviderService.getSimProviders({ pageNumber: 1, pageSize: 1000 });
    const existingPlansResponse = await simCardPlanService.getSimCardPlans({ pageNumber: 1, pageSize: 1000 });

    const existingSimTypes = existingSimTypesResponse?.items || [];
    const existingProviders = existingProvidersResponse?.items || [];
    const existingPlans = existingPlansResponse?.items || [];

    // Create missing master data
    await createMissingMasterData(uniqueSimTypes, existingSimTypes, 'sim_types', result)
    await createMissingMasterData(uniqueProviders, existingProviders, 'sim_providers', result)
    await createMissingMasterData(uniquePlans, existingPlans, 'sim_card_plans', result)
  }

  // Create missing master data
  const createMissingMasterData = async (uniqueItems: string[], existingItems: any[], tableName: string, result: ImportResult) => {
    const existingNames = new Set(existingItems?.map(item => item.name) || [])
    const newItems = uniqueItems.filter(item => !existingNames.has(item))

    if (newItems.length > 0) {
      console.log(`📊 Creating ${newItems.length} new ${tableName}...`)
      
      const itemsToCreate = newItems.map(name => ({
        id: `${tableName.toUpperCase()}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: name,
        created_at: new Date().toISOString()
      }))

      try {
        // Create items using the appropriate service
        for (const item of itemsToCreate) {
          switch (tableName) {
            case 'sim_types':
              await simTypeService.createSimType({ name: item.name, isActive: true });
              break;
            case 'sim_providers':
              await simProviderService.createSimProvider({ name: item.name, isActive: true });
              break;
            case 'sim_card_plans':
              await simCardPlanService.createSimCardPlan({ name: item.name, isActive: true });
              break;
            default:
              console.warn(`Unknown table name: ${tableName}`);
          }
        }
      } catch (error) {
        console.error(`❌ Failed to create ${tableName}:`, error)
        throw new Error(`Failed to create ${tableName}: ${error}`)
      }

      result.masterDataCreated[tableName as keyof typeof result.masterDataCreated] += newItems.length
    }
  }

  // Process validated batch
  const processValidatedBatch = async (validSimCards: SimCardImportData[], batchNumber: number, result: ImportResult) => {
    console.log(`🚀 Batch ${batchNumber}: Processing ${validSimCards.length} validated SIM cards...`)

    // Load master data maps
    const simTypesResponse = await simTypeService.getSimTypes({ pageNumber: 1, pageSize: 1000 });
    const simProvidersResponse = await simProviderService.getSimProviders({ pageNumber: 1, pageSize: 1000 });
    const simCardPlansResponse = await simCardPlanService.getSimCardPlans({ pageNumber: 1, pageSize: 1000 });
    const employeesResponse = await employeeService.getEmployees({ pageNumber: 1, pageSize: 10000 });
    const projectsResponse = await ProjectService.getAll();

    const simTypes = simTypesResponse?.items || [];
    const simProviders = simProvidersResponse?.items || [];
    const simCardPlans = simCardPlansResponse?.items || [];
    const employees = employeesResponse?.items || [];
    const projects = projectsResponse || [];

    const simTypeMap = new Map(simTypes.map(st => [st.name, st.id]))
    const simProviderMap = new Map(simProviders.map(sp => [sp.name, sp.id]))
    const simCardPlanMap = new Map(simCardPlans.map(scp => [scp.name, scp.id]))
    const employeeCodeMap = new Map(employees.map(emp => [emp.employeeId, emp.id]))
    const projectMap = new Map(projects.map(proj => [proj.name, proj.id]))

    // Process each SIM card in this batch
    const simCardsToInsert = []

    for (const simCard of validSimCards) {
      // Resolve master data IDs
      const simTypeId = simTypeMap.get(simCard.sim_type) || null
      const simProviderId = simProviderMap.get(simCard.sim_provider) || null
      const simCardPlanId = simCardPlanMap.get(simCard.sim_card_plan) || null
      const projectId = projectMap.get(simCard.project) || null

      // Resolve employee assignment
      let assignedEmployeeId = null
      if (simCard.assigned_to && simCard.assigned_to.trim()) {
        const employeeCode = simCard.assigned_to.trim()
        const employeeId = employeeCodeMap.get(employeeCode)
        if (employeeId) {
          assignedEmployeeId = employeeId
        } else {
          // Case-insensitive fallback
          const caseInsensitiveMatch = employees?.find(emp => 
            emp.employee_id?.toLowerCase() === employeeCode.toLowerCase()
          )
          if (caseInsensitiveMatch) {
            assignedEmployeeId = caseInsensitiveMatch.id
          }
        }
      }

      const simCardData = {
        sim_account_no: simCard.sim_account_no,
        sim_service_no: simCard.sim_service_no,
        sim_start_date: simCard.sim_start_date || null,
        sim_type_id: simTypeId,
        sim_card_plan_id: simCardPlanId,
        sim_provider_id: simProviderId,
        sim_status: simCard.sim_status.toLowerCase() || 'active',
        sim_serial_no: simCard.sim_serial_no || null,
        assigned_to: assignedEmployeeId,
        project_id: projectId,
        created_at: new Date().toISOString(),
      }

      simCardsToInsert.push(simCardData)
    }

    // Insert this batch
    if (simCardsToInsert.length > 0) {
      console.log(`📦 Batch ${batchNumber}: Inserting ${simCardsToInsert.length} SIM cards...`)
      
      try {
        // Insert SIM cards one by one using the API
        for (const simCardData of simCardsToInsert) {
          try {
            await simCardService.createSimCard(simCardData);
            result.success++;
          } catch (error) {
            result.errors++;
            console.error(`❌ Failed to insert SIM card:`, error);
          }
        }
      } catch (error) {
        console.error(`❌ Batch ${batchNumber} insert failed:`, error)
        result.errors += simCardsToInsert.length
        result.errorDetails.push(`Batch ${batchNumber}: ${error}`)
      }
      
      console.log(`✅ Batch ${batchNumber}: Completed processing ${simCardsToInsert.length} SIM cards`)
    }
  }

  // Test CSV parsing function
  const testCSVParsing = async () => {
    if (!selectedFile) return

    try {
      console.log("🧪 Testing CSV parsing with first 5 records...")
      const simCards = await parseCSVFile(selectedFile)
      console.log("🧪 Parsed SIM cards:", simCards.slice(0, 5))
      
      toast({
        title: "CSV parsing test completed",
        description: `Successfully parsed ${simCards.length} records. Check console for details.`,
        variant: "default"
      })
    } catch (error) {
      console.error("🧪 CSV parsing test failed:", error)
      toast({
        title: "CSV parsing test failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      })
    }
  }

  // Parse CSV file
  const parseCSVFile = async (file: File): Promise<SimCardImportData[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string
          const lines = text.split('\n').filter(line => line.trim())
          
          if (lines.length < 2) {
            throw new Error('CSV file must have at least a header and one data row')
          }

          const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''))
          console.log('📋 CSV Headers:', headers)

          const data: SimCardImportData[] = []
          for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim().replace(/['"]/g, ''))
            
            if (values.length !== headers.length) {
              console.warn(`⚠️ Row ${i + 1} has ${values.length} values but expected ${headers.length}`)
              continue
            }

            const row: any = {}
            headers.forEach((header, index) => {
              row[header] = values[index] || ''
            })

            // Map various header formats to our standard format
            const simCard: SimCardImportData = {
              sim_account_no: row['sim account no'] || row['sim_account_no'] || row['account no'] || row['account_no'] || '',
              sim_service_no: row['sim service no'] || row['sim_service_no'] || row['service no'] || row['service_no'] || '',
              sim_start_date: row['sim start date'] || row['sim_start_date'] || row['start date'] || row['start_date'] || '',
              sim_type: row['sim type'] || row['sim_type'] || row['type'] || '',
              sim_provider: row['sim provider'] || row['sim_provider'] || row['provider'] || '',
              sim_card_plan: row['sim card plan'] || row['sim_card_plan'] || row['card plan'] || row['card_plan'] || row['plan'] || '',
              sim_status: row['sim status'] || row['sim_status'] || row['status'] || 'active',
              sim_serial_no: row['sim serial no'] || row['sim_serial_no'] || row['serial no'] || row['serial_no'] || '',
              assigned_to: row['assigned to'] || row['assigned_to'] || row['assigned'] || '',
              project: row['project'] || ''
            }

            data.push(simCard)
          }

          console.log(`✅ Parsed ${data.length} SIM cards from CSV`)
          resolve(data)
        } catch (error) {
          reject(error)
        }
      }
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsText(file)
    })
  }

  // Clean SIM card data
  const cleanSimCardData = (simCard: SimCardImportData): SimCardImportData => {
    let cleanDate = simCard.sim_start_date
    if (cleanDate) {
      // Handle various date formats like "9-Jan-24", "09-Jan-2024", etc.
      const dateMatch = cleanDate.match(/(\d{1,2})-([A-Za-z]{3})-(\d{2,4})/)
      if (dateMatch) {
        const day = dateMatch[1].padStart(2, '0')
        const month = dateMatch[2]
        const year = dateMatch[3].length === 2 ? `20${dateMatch[3]}` : dateMatch[3]
        
        const monthMap: { [key: string]: string } = {
          'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
          'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
          'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
        }
        
        const monthNum = monthMap[month]
        if (monthNum) {
          cleanDate = `${year}-${monthNum}-${day}`
        }
      }
    }

    // Clean serial number - handle scientific notation and invalid values
    let cleanSerialNo = simCard.sim_serial_no
    if (cleanSerialNo) {
      // Handle scientific notation like "8.31E+11"
      if (cleanSerialNo.includes('E+') || cleanSerialNo.includes('e+')) {
        const num = parseFloat(cleanSerialNo)
        if (!isNaN(num)) {
          cleanSerialNo = Math.round(num).toString()
        }
      }
      // Handle invalid serial numbers
      if (cleanSerialNo === '-' || cleanSerialNo === '') {
        cleanSerialNo = null
      }
    }

    // Clean service number - handle scientific notation
    let cleanServiceNo = simCard.sim_service_no
    if (cleanServiceNo && (cleanServiceNo.includes('E+') || cleanServiceNo.includes('e+'))) {
      const num = parseFloat(cleanServiceNo)
      if (!isNaN(num)) {
        cleanServiceNo = Math.round(num).toString()
      }
    }

    return {
      ...simCard,
      sim_start_date: cleanDate,
      sim_serial_no: cleanSerialNo,
      sim_service_no: cleanServiceNo,
      sim_status: simCard.sim_status?.toLowerCase() || 'active'
    }
  }

  // Validate SIM card data
  const validateSimCardData = (simCard: SimCardImportData): string[] => {
    const errors: string[] = []
    
    if (!simCard.sim_account_no || simCard.sim_account_no.trim() === '') {
      errors.push("SIM account number is required")
    }
    
    if (!simCard.sim_service_no || simCard.sim_service_no.trim() === '') {
      errors.push("SIM service number is required")
    }
    
    if (simCard.sim_start_date && simCard.sim_start_date.trim() !== '') {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/
      if (!dateRegex.test(simCard.sim_start_date)) {
        errors.push("Invalid date format. Expected YYYY-MM-DD")
      }
    }
    
    if (simCard.sim_serial_no && simCard.sim_serial_no !== '-' && simCard.sim_serial_no.trim() !== '') {
      // Check if serial number contains only digits and is reasonable length
      const serialRegex = /^\d{10,20}$/
      if (!serialRegex.test(simCard.sim_serial_no)) {
        errors.push("Invalid serial number format")
      }
    }
    
    return errors
  }

  // Download template
  const downloadTemplate = () => {
    const csvContent = `sim_account_no,sim_service_no,sim_start_date,sim_type,sim_provider,sim_card_plan,sim_status,sim_serial_no,assigned_to,project
ACC001,1234567890,2024-01-15,Physical SIM,STC,230,active,12345678901234567890,EMP001,Project Alpha
ACC002,1234567891,2024-01-16,E-SIM,Mobily,450,active,12345678901234567891,EMP002,Project Beta`

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'sim_card_import_template.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  // Download CSV template
  const downloadCSVTemplate = () => {
    downloadTemplate()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            SIM Card Import
          </DialogTitle>
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

          {/* Batch Processing Indicator */}
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <span className="text-green-600">📦</span>
                <span className="text-sm font-medium text-green-800">Batch Processing Active</span>
              </div>
              <div className="text-xs text-green-700 mt-1">
                Processing all entries in batches of 100 records. For 600 entries = 6 batches.
              </div>
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
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <FileSpreadsheet className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-sm text-gray-600 mb-4">
                  {selectedFile ? selectedFile.name : "Choose a CSV file to import"}
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <div className="space-y-2">
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    disabled={isImporting}
                  >
                    Choose File
                  </Button>
                  {selectedFile && (
                    <Button
                      onClick={importSimCards}
                      disabled={isImporting}
                      className="w-full"
                    >
                      {isImporting ? "Importing..." : "Import SIM Cards"}
                    </Button>
                  )}
                  {selectedFile && (
                    <Button
                      onClick={() => {
                        setSelectedFile(null)
                        setImportResult(null)
                        setProgress(0)
                        setCurrentStep("")
                      }}
                      variant="outline"
                      size="sm"
                      className="w-full"
                      disabled={isImporting}
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </div>

              {/* Debug Test Button */}
              {selectedFile && (
                <Button onClick={testCSVParsing} variant="outline" size="sm" className="w-full" disabled={isImporting}>
                  🧪 Test CSV Parsing (Debug)
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Progress */}
          {isImporting && (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{currentStep}</span>
                    <span className="text-sm text-muted-foreground">{progress}%</span>
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
                  {importResult.errors > 0 ? (
                    <AlertCircle className="h-5 w-5 text-yellow-500" />
                  ) : (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  )}
                  Import Results
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{importResult.success}</div>
                    <div className="text-sm text-muted-foreground">Successful</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{importResult.errors}</div>
                    <div className="text-sm text-muted-foreground">Errors</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{importResult.total}</div>
                    <div className="text-sm text-muted-foreground">Total</div>
                  </div>
                </div>

                {importResult.masterDataCreated.simTypes > 0 || 
                 importResult.masterDataCreated.simProviders > 0 || 
                 importResult.masterDataCreated.simCardPlans > 0 ? (
                  <div className="space-y-2">
                    <h4 className="font-medium">Master Data Created:</h4>
                    <div className="flex gap-2">
                      {importResult.masterDataCreated.simTypes > 0 && (
                        <Badge variant="secondary">
                          {importResult.masterDataCreated.simTypes} SIM Types
                        </Badge>
                      )}
                      {importResult.masterDataCreated.simProviders > 0 && (
                        <Badge variant="secondary">
                          {importResult.masterDataCreated.simProviders} Providers
                        </Badge>
                      )}
                      {importResult.masterDataCreated.simCardPlans > 0 && (
                        <Badge variant="secondary">
                          {importResult.masterDataCreated.simCardPlans} Plans
                        </Badge>
                      )}
                    </div>
                  </div>
                ) : null}

                {importResult.errorDetails.length > 0 && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-1">
                        <p className="font-medium">Errors:</p>
                        {importResult.errorDetails.slice(0, 5).map((error, index) => (
                          <p key={index} className="text-sm text-red-600">{error}</p>
                        ))}
                        {importResult.errorDetails.length > 5 && (
                          <p className="text-sm text-muted-foreground">
                            ... and {importResult.errorDetails.length - 5} more errors
                          </p>
                        )}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {/* Import Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>Import Instructions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>• <strong>Auto-Creation:</strong> Missing master data (SIM types, providers, card plans) will be automatically created</p>
              <p>• <strong>Bulk Operations:</strong> All operations are performed in bulk for maximum performance</p>
              <p>• <strong>Smart Mapping:</strong> Flexible column header recognition (e.g., "sim account no", "sim_account_no", or "account no")</p>
              <p>• <strong>Upsert Support:</strong> Updates existing SIM cards and creates new ones in a single operation</p>
              <p>• <strong>Validation:</strong> Comprehensive data validation with detailed error reporting</p>
              <p>• <strong>Progress Tracking:</strong> Real-time progress updates during import</p>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
