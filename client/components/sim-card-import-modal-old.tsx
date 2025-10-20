"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, FileSpreadsheet, CheckCircle, XCircle, AlertCircle, Download, Database } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabaseClient"

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

  // Helper function to clean and normalize data
  const cleanSimCardData = (simCard: SimCardImportData): SimCardImportData => {
    // Clean date format - handle various date formats
    let cleanDate = simCard.sim_start_date
    if (cleanDate) {
      // Handle formats like "9-Jan-24", "1-Jan-90", "15-Aug-25"
      const dateMatch = cleanDate.match(/(\d{1,2})-([A-Za-z]{3})-(\d{2,4})/)
      if (dateMatch) {
        const [, day, month, year] = dateMatch
        const monthMap: { [key: string]: string } = {
          'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
          'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
          'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
        }
        const fullYear = year.length === 2 ? (parseInt(year) > 50 ? `19${year}` : `20${year}`) : year
        cleanDate = `${fullYear}-${monthMap[month] || '01'}-${day.padStart(2, '0')}`
      }
    }

    // Clean serial number - handle scientific notation and invalid values
    let cleanSerialNo = simCard.sim_serial_no
    if (cleanSerialNo) {
      // Handle scientific notation like "8.31E+11", "1.73E+11"
      if (cleanSerialNo.includes('E+') || cleanSerialNo.includes('e+')) {
        try {
          const num = parseFloat(cleanSerialNo)
          if (!isNaN(num)) {
            cleanSerialNo = Math.round(num).toString()
          }
        } catch (e) {
          cleanSerialNo = ''
        }
      }
      // Remove invalid values like "-"
      if (cleanSerialNo === '-' || cleanSerialNo === '') {
        cleanSerialNo = null
      }
    }

    // Clean service number - handle scientific notation
    let cleanServiceNo = simCard.sim_service_no
    if (cleanServiceNo && (cleanServiceNo.includes('E+') || cleanServiceNo.includes('e+'))) {
      try {
        const num = parseFloat(cleanServiceNo)
        if (!isNaN(num)) {
          cleanServiceNo = Math.round(num).toString()
        }
      } catch (e) {
        // Keep original if parsing fails
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

  const parseCSVFile = async (file: File): Promise<SimCardImportData[]> => {
    try {
      const text = await file.text()
      const lines = text.split('\n').filter(line => line.trim())
      if (lines.length < 2) return []
      
      const simCards: SimCardImportData[] = []
      
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
      for (let i = 1; i < lines.length; i++) {
        try {
          const values = lines[i].match(/("([^"]*)"|([^,]*))/g)?.map(v => v.replace(/^"|"$/g, '').trim()) || []
          
          if (values.length > 0) {
            const rawSimCard: SimCardImportData = {
              sim_account_no: values[columnMap['sim_account_no']] || values[columnMap['sim account no']] || values[columnMap['account_no']] || values[columnMap['account no']] || '',
              sim_service_no: values[columnMap['sim_service_no']] || values[columnMap['sim service no']] || values[columnMap['service_no']] || values[columnMap['service no']] || '',
              sim_start_date: values[columnMap['sim_start_date']] || values[columnMap['sim start date']] || values[columnMap['start_date']] || values[columnMap['start date']] || '',
              sim_type: values[columnMap['sim_type']] || values[columnMap['sim type']] || values[columnMap['type']] || '',
              sim_provider: values[columnMap['sim_provider']] || values[columnMap['sim provider']] || values[columnMap['provider']] || '',
              sim_card_plan: values[columnMap['sim_card_plan']] || values[columnMap['sim card plan']] || values[columnMap['card_plan']] || values[columnMap['card plan']] || values[columnMap['plan']] || '',
              sim_status: values[columnMap['sim_status']] || values[columnMap['sim status']] || values[columnMap['status']] || 'active',
              sim_serial_no: values[columnMap['sim_serial_no']] || values[columnMap['sim serial no']] || values[columnMap['serial_no']] || values[columnMap['serial no']] || values[columnMap['serial']] || '',
              assigned_to: values[columnMap['assigned_to']] || values[columnMap['assigned to']] || values[columnMap['employee_code']] || values[columnMap['employee code']] || '',
              project: values[columnMap['project']] || values[columnMap['project_name']] || values[columnMap['project name']] || ''
            }
            
            // Clean and normalize the data
            const cleanSimCard = cleanSimCardData(rawSimCard)
            
            // Check for empty rows and valid data
            if (cleanSimCard.sim_account_no && cleanSimCard.sim_service_no) {
              simCards.push(cleanSimCard)
            }
          }
        } catch (rowError) {
          console.error(`Error parsing row ${i + 1}:`, rowError)
        }
      }
      
      console.log(`Parsed ${simCards.length} SIM cards from CSV`)
      return simCards
    } catch (error) {
      console.error('Error parsing CSV file:', error)
      throw new Error(`Failed to parse CSV file: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const validateSimCardData = (simCard: SimCardImportData): string[] => {
    const errors: string[] = []
    
    if (!simCard.sim_account_no || simCard.sim_account_no.trim() === '') {
      errors.push("SIM account number is required")
    }
    
    if (!simCard.sim_service_no || simCard.sim_service_no.trim() === '') {
      errors.push("SIM service number is required")
    }
    
    // Validate date format if provided
    if (simCard.sim_start_date && simCard.sim_start_date.trim() !== '') {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/
      if (!dateRegex.test(simCard.sim_start_date)) {
        errors.push("Invalid date format. Expected YYYY-MM-DD")
      }
    }
    
    // Validate status
    const validStatuses = ['active', 'inactive', 'suspended', 'expired']
    if (simCard.sim_status && !validStatuses.includes(simCard.sim_status.toLowerCase())) {
      errors.push(`Invalid status: ${simCard.sim_status}. Must be one of: ${validStatuses.join(', ')}`)
    }
    
    // Validate serial number if provided
    if (simCard.sim_serial_no && simCard.sim_serial_no.trim() !== '') {
      // Check if it's a valid number (not scientific notation or invalid characters)
      if (isNaN(Number(simCard.sim_serial_no)) && simCard.sim_serial_no !== '-') {
        errors.push("Invalid serial number format")
      }
    }
    
    return errors
  }

  // Timeout wrapper to prevent infinite hanging
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
    const { data: existingSimTypes } = await supabase.from('sim_types').select('id,name')
    const { data: existingProviders } = await supabase.from('sim_providers').select('id,name')
    const { data: existingPlans } = await supabase.from('sim_card_plans').select('id,name')

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

      const { error } = await withTimeout(
        supabase.from(tableName).insert(itemsToCreate),
        30000,
        `${tableName} creation`
      )

      if (error) {
        console.error(`❌ Failed to create ${tableName}:`, error)
        throw new Error(`Failed to create ${tableName}: ${error.message}`)
      }

      result.masterDataCreated[tableName as keyof typeof result.masterDataCreated] += newItems.length
    }
  }

  // Process validated batch
  const processValidatedBatch = async (validSimCards: SimCardImportData[], batchNumber: number, result: ImportResult) => {
    console.log(`🚀 Batch ${batchNumber}: Processing ${validSimCards.length} validated SIM cards...`)

    // Load master data maps
    const { data: simTypes } = await supabase.from('sim_types').select('id,name')
    const { data: simProviders } = await supabase.from('sim_providers').select('id,name')
    const { data: simCardPlans } = await supabase.from('sim_card_plans').select('id,name')
    const { data: employees } = await supabase.from('employees').select('id,employee_id')
    const { data: projects } = await supabase.from('projects').select('id,name')

    const simTypeMap = new Map(simTypes?.map(st => [st.name, st.id]) || [])
    const simProviderMap = new Map(simProviders?.map(sp => [sp.name, sp.id]) || [])
    const simCardPlanMap = new Map(simCardPlans?.map(scp => [scp.name, scp.id]) || [])
    const employeeCodeMap = new Map(employees?.map(emp => [emp.employee_id, emp.id]) || [])
    const projectMap = new Map(projects?.map(proj => [proj.name, proj.id]) || [])

    // Process each SIM card in this batch
    const simCardsToInsert = []
    const simCardsToUpdate = []

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

      // Check if this combination already exists
      const compositeKey = `${simCard.sim_account_no}|${simCard.sim_service_no}`
      
      // For now, we'll insert all records and let the database handle duplicates
      // In a real implementation, you'd check existing records first
      simCardsToInsert.push(simCardData)
    }

    // Insert this batch
    if (simCardsToInsert.length > 0) {
      console.log(`📦 Batch ${batchNumber}: Inserting ${simCardsToInsert.length} SIM cards...`)
      
      const { error } = await withTimeout(
        supabase.from('sim_cards').insert(simCardsToInsert),
        30000,
        `Batch ${batchNumber} insert`
      )

      if (error) {
        console.error(`❌ Batch ${batchNumber} insert failed:`, error)
        result.errors += simCardsToInsert.length
        result.errorDetails.push(`Batch ${batchNumber}: ${error.message}`)
      } else {
        result.success += simCardsToInsert.length
        console.log(`✅ Batch ${batchNumber}: Successfully inserted ${simCardsToInsert.length} SIM cards`)
      }
    }
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
          .filter(name => name && name.trim() && !existingTypeNames.has(name.trim()))
          .map(name => ({
            id: `TYPE_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: name.trim(),
            description: `Auto-created from SIM card import`,
            is_active: true,
            created_at: new Date().toISOString()
          }))

        console.log(`📊 New SIM types to create: ${newTypes.length}`, newTypes.map(t => t.name))

        if (newTypes.length > 0) {
          console.log(`⏳ Creating ${newTypes.length} SIM types in database...`)
          const startTime = Date.now()
          
          const { data: typeData, error: typeError } = await withTimeout(
            supabase
              .from('sim_types')
              .insert(newTypes)
              .select(),
            30000, // 30 second timeout
            'SIM types creation'
          )

          const endTime = Date.now()
          console.log(`⏱️ SIM types creation took ${endTime - startTime}ms`)

          if (typeError) {
            console.error(`❌ Failed to create SIM types:`, typeError)
            console.error(`❌ SIM types error details:`, {
              message: typeError.message,
              details: typeError.details,
              hint: typeError.hint,
              code: typeError.code
            })
            result.errorDetails.push(`Failed to create SIM types: ${typeError.message}`)
          } else {
            result.masterDataCreated.simTypes = typeData?.length || 0
            console.log(`✅ Successfully created ${typeData?.length || 0} SIM types`)
          }
        } else {
          console.log(`ℹ️ No new SIM types to create (all already exist)`)
        }
        setProgress(40)
      } else {
        console.log(`ℹ️ No SIM types found in CSV data`)
      }

      // Step 7: Create missing SIM providers
      console.log("🏗️ Step 7: Creating missing SIM providers...")
      if (uniqueSimProviders.length > 0) {
        console.log(`📊 Found ${uniqueSimProviders.length} unique SIM providers:`, uniqueSimProviders)
        setCurrentStep(`Creating ${uniqueSimProviders.length} SIM providers...`)
        
        const existingProviderNames = new Set(existingSimProviders?.map(p => p.name) || [])
        console.log(`📊 Existing SIM provider names:`, Array.from(existingProviderNames))
        
        const newProviders = uniqueSimProviders
          .filter(name => name && name.trim() && !existingProviderNames.has(name.trim()))
          .map(name => ({
            id: `PROV_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: name.trim(),
            description: `Auto-created from SIM card import`,
            contact_info: '',
            is_active: true,
            created_at: new Date().toISOString()
          }))

        console.log(`📊 New SIM providers to create: ${newProviders.length}`, newProviders.map(p => p.name))

        if (newProviders.length > 0) {
          console.log(`⏳ Creating ${newProviders.length} SIM providers in database...`)
          const startTime = Date.now()
          
          const { data: providerData, error: providerError } = await withTimeout(
            supabase
              .from('sim_providers')
              .insert(newProviders)
              .select(),
            30000, // 30 second timeout
            'SIM providers creation'
          )

          const endTime = Date.now()
          console.log(`⏱️ SIM providers creation took ${endTime - startTime}ms`)

          if (providerError) {
            console.error(`❌ Failed to create SIM providers:`, providerError)
            console.error(`❌ SIM providers error details:`, {
              message: providerError.message,
              details: providerError.details,
              hint: providerError.hint,
              code: providerError.code
            })
            result.errorDetails.push(`Failed to create SIM providers: ${providerError.message}`)
          } else {
            result.masterDataCreated.simProviders = providerData?.length || 0
            console.log(`✅ Successfully created ${providerData?.length || 0} SIM providers`)
          }
        } else {
          console.log(`ℹ️ No new SIM providers to create (all already exist)`)
        }
        setProgress(50)
      } else {
        console.log(`ℹ️ No SIM providers found in CSV data`)
      }

      // Step 8: Create missing SIM card plans
      console.log("🏗️ Step 8: Creating missing SIM card plans...")
      if (uniqueSimCardPlans.length > 0) {
        console.log(`📊 Found ${uniqueSimCardPlans.length} unique SIM card plans:`, uniqueSimCardPlans)
        setCurrentStep(`Creating ${uniqueSimCardPlans.length} SIM card plans...`)
        
        // Reload providers to get newly created ones
        console.log(`⏳ Reloading SIM providers to get newly created ones...`)
        const { data: updatedSimProviders, error: reloadError } = await supabase
          .from('sim_providers')
          .select('id,name')
          .eq('is_active', true)

        if (reloadError) {
          console.error(`❌ Failed to reload SIM providers:`, reloadError)
        } else {
          console.log(`✅ Reloaded ${updatedSimProviders?.length || 0} SIM providers`)
        }

        const existingPlanNames = new Set(existingSimCardPlans?.map(p => p.name) || [])
        console.log(`📊 Existing SIM card plan names:`, Array.from(existingPlanNames))
        
        const newPlans = []

        for (const planName of uniqueSimCardPlans) {
          if (planName && planName.trim() && !existingPlanNames.has(planName.trim())) {
            // Find a provider for this plan (use first available provider or create a default one)
            const providerId = updatedSimProviders?.[0]?.id || null

            newPlans.push({
              id: `PLAN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              name: planName.trim(),
              description: `Auto-created from SIM card import`,
              data_limit: '',
              monthly_fee: 0,
              provider_id: providerId,
              is_active: true,
              created_at: new Date().toISOString()
            })
          }
        }

        console.log(`📊 New SIM card plans to create: ${newPlans.length}`, newPlans.map(p => p.name))

        if (newPlans.length > 0) {
          console.log(`⏳ Creating ${newPlans.length} SIM card plans in database...`)
          const startTime = Date.now()
          
          const { data: planData, error: planError } = await withTimeout(
            supabase
              .from('sim_card_plans')
              .insert(newPlans)
              .select(),
            30000, // 30 second timeout
            'SIM card plans creation'
          )

          const endTime = Date.now()
          console.log(`⏱️ SIM card plans creation took ${endTime - startTime}ms`)

          if (planError) {
            console.error(`❌ Failed to create SIM card plans:`, planError)
            console.error(`❌ SIM card plans error details:`, {
              message: planError.message,
              details: planError.details,
              hint: planError.hint,
              code: planError.code
            })
            result.errorDetails.push(`Failed to create SIM card plans: ${planError.message}`)
          } else {
            result.masterDataCreated.simCardPlans = planData?.length || 0
            console.log(`✅ Successfully created ${planData?.length || 0} SIM card plans`)
          }
        } else {
          console.log(`ℹ️ No new SIM card plans to create (all already exist)`)
        }
        setProgress(60)
      } else {
        console.log(`ℹ️ No SIM card plans found in CSV data`)
      }

      // Step 9: Reload master data with newly created entries
      console.log("🔄 Step 9: Reloading master data with newly created entries...")
      setCurrentStep("Reloading master data...")
      
      console.log(`⏳ Reloading final SIM types...`)
      const { data: finalSimTypes, error: finalTypesError } = await supabase
        .from('sim_types')
        .select('id,name')
        .eq('is_active', true)

      if (finalTypesError) {
        console.error(`❌ Failed to reload final SIM types:`, finalTypesError)
      } else {
        console.log(`✅ Reloaded ${finalSimTypes?.length || 0} final SIM types`)
      }

      console.log(`⏳ Reloading final SIM providers...`)
      const { data: finalSimProviders, error: finalProvidersError } = await supabase
        .from('sim_providers')
        .select('id,name')
        .eq('is_active', true)

      if (finalProvidersError) {
        console.error(`❌ Failed to reload final SIM providers:`, finalProvidersError)
      } else {
        console.log(`✅ Reloaded ${finalSimProviders?.length || 0} final SIM providers`)
      }

      console.log(`⏳ Reloading final SIM card plans...`)
      const { data: finalSimCardPlans, error: finalPlansError } = await supabase
        .from('sim_card_plans')
        .select('id,name,provider_id')
        .eq('is_active', true)

      if (finalPlansError) {
        console.error(`❌ Failed to reload final SIM card plans:`, finalPlansError)
      } else {
        console.log(`✅ Reloaded ${finalSimCardPlans?.length || 0} final SIM card plans`)
      }

      console.log(`✅ Master data reload completed`)
      setProgress(70)

      // Step 10: Prepare SIM card data for bulk insert
      setCurrentStep("Preparing SIM card data...")
      const simCardsToInsert = []
      const simCardsToUpdate = []

      // Get existing SIM cards to check for duplicates
      const accountNumbers = validSimCards.map(sc => sc.sim_account_no).filter(Boolean)
      const serviceNumbers = validSimCards.map(sc => sc.sim_service_no).filter(Boolean)
      const { data: existingSimCards } = await supabase
        .from('sim_cards')
        .select('id,sim_account_no,sim_service_no')
        .or(`sim_account_no.in.(${accountNumbers.join(',')}),sim_service_no.in.(${serviceNumbers.join(',')})`)

      const existingAccountNumbers = new Set(existingSimCards?.map(sc => sc.sim_account_no) || [])
      const existingServiceNumbers = new Set(existingSimCards?.map(sc => sc.sim_service_no) || [])
      // Create map using composite key (sim_account_no|sim_service_no) -> id
      const existingSimCardMap = new Map(existingSimCards?.map(sc => [`${sc.sim_account_no}|${sc.sim_service_no}`, sc.id]) || [])

      for (let i = 0; i < validSimCards.length; i++) {
        const simCard = validSimCards[i]
        setProgress(70 + (i / validSimCards.length) * 20)

        // Resolve master data IDs
        const simTypeId = finalSimTypes?.find(type => type.name === simCard.sim_type)?.id || null
        const simProviderId = finalSimProviders?.find(provider => provider.name === simCard.sim_provider)?.id || null
        const simCardPlanId = finalSimCardPlans?.find(plan => plan.name === simCard.sim_card_plan)?.id || null

        // Resolve employee assignment - store null if not found
        let assignedEmployeeId = null
        if (simCard.assigned_to && simCard.assigned_to.trim()) {
          const employeeCode = simCard.assigned_to.trim()
          const employeeId = employeeCodeMap.get(employeeCode)
          if (employeeId) {
            assignedEmployeeId = employeeId
            const employee = existingEmployees?.find(emp => emp.id === employeeId)
            console.log(`✅ Resolved employee assignment: ${employeeCode} (code) -> ${employeeId} (ID) (${employee?.code} - ${employee?.name})`)
          } else {
            console.log(`ℹ️ Employee code "${employeeCode}" not found - will store as null`)
            // Try case-insensitive matching as fallback
            const caseInsensitiveMatch = Array.from(employeeCodeMap.keys()).find(code => 
              code.toLowerCase() === employeeCode.toLowerCase()
            )
            if (caseInsensitiveMatch) {
              assignedEmployeeId = employeeCodeMap.get(caseInsensitiveMatch)
              console.log(`✅ Found case-insensitive match: "${employeeCode}" -> "${caseInsensitiveMatch}" (${assignedEmployeeId})`)
            } else {
              console.log(`ℹ️ No case-insensitive match found for "${employeeCode}" - storing as null`)
            }
          }
        } else {
          console.log(`ℹ️ No employee code provided for SIM card ${simCard.sim_account_no} - storing as null`)
        }

        // Resolve project assignment with enhanced matching
        let projectId = null
        if (simCard.project && simCard.project.trim()) {
          const projectName = simCard.project.trim()
          console.log(`🔍 Attempting to resolve project: "${projectName}" for SIM card ${simCard.sim_account_no}`)
          
          // Try multiple matching strategies
          let projId = projectNameMap.get(projectName) || 
                      projectNameMap.get(projectName.toLowerCase()) ||
                      projectNameMap.get(projectName.trim().toLowerCase())
          
          console.log(`🔍 Direct lookup results for "${projectName}":`, {
            exact: projectNameMap.get(projectName),
            lowercase: projectNameMap.get(projectName.toLowerCase()),
            trimmed_lowercase: projectNameMap.get(projectName.trim().toLowerCase())
          })
          
          if (projId) {
            projectId = projId
            console.log(`✅ Resolved project assignment: "${simCard.project}" -> ${projId}`)
          } else {
            // Try to find a close match (case-insensitive partial match)
            const availableProjects = existingProjects?.map(p => p.name) || []
            console.log(`🔍 Trying partial matching. Available projects:`, availableProjects.slice(0, 5))
            
            // Try exact case-insensitive match first
            const exactMatch = availableProjects.find(p => 
              p.toLowerCase() === projectName.toLowerCase()
            )
            
            if (exactMatch) {
              projectId = projectNameMap.get(exactMatch)
              console.log(`✅ Found exact case-insensitive match: "${simCard.project}" -> "${exactMatch}" (${projectId})`)
            } else {
              // Try partial matching
              const closeMatch = availableProjects.find(p => 
                p.toLowerCase().includes(projectName.toLowerCase()) || 
                projectName.toLowerCase().includes(p.toLowerCase())
              )
              
              if (closeMatch) {
                projectId = projectNameMap.get(closeMatch)
                console.log(`✅ Found close match for project: "${simCard.project}" -> "${closeMatch}" (${projectId})`)
              } else {
                console.warn(`❌ Project not found: "${simCard.project}". Available projects: ${availableProjects.slice(0, 5).join(', ')}${availableProjects.length > 5 ? '...' : ''}`)
                console.warn(`❌ Project name map keys:`, Array.from(projectNameMap.keys()).slice(0, 5))
              }
            }
          }
        } else {
          console.log(`ℹ️ No project specified for SIM card ${simCard.sim_account_no}`)
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

        // Debug logging for the data being prepared
        console.log(`📝 Final SIM card data for ${simCard.sim_account_no}:`, {
          project_from_csv: simCard.project,
          resolved_project_id: projectId,
          project_id_in_data: simCardData.project_id,
          full_sim_card_data: simCardData
        })

        // Check if the combination of sim_account_no and sim_service_no already exists
        const compositeKey = `${simCard.sim_account_no}|${simCard.sim_service_no}`
        const existingId = existingSimCardMap.get(compositeKey)
        
        if (existingId) {
          console.log(`🔄 SIM card combination ${simCard.sim_account_no}/${simCard.sim_service_no} already exists (ID: ${existingId}), will update with project_id: ${projectId}`)
          simCardsToUpdate.push({
            ...simCardData,
            id: existingId
          })
        } else {
          console.log(`➕ SIM card combination ${simCard.sim_account_no}/${simCard.sim_service_no} is new, will insert with project_id: ${projectId}`)
          simCardsToInsert.push(simCardData)
        }
      }

      setProgress(90)
      setCurrentStep("Performing bulk SIM card operations...")

        // Step 11: Batch insert/update SIM cards (100 entries per batch)
        console.log("🚀 Step 11: Starting batch processing...")
        const allSimCardsToProcess = [...simCardsToInsert, ...simCardsToUpdate]
      const BATCH_SIZE = 100
      
      console.log(`📊 Total SIM cards to process: ${allSimCardsToProcess.length}`)
      console.log(`📊 SIM cards to insert: ${simCardsToInsert.length}`)
      console.log(`📊 SIM cards to update: ${simCardsToUpdate.length}`)
      console.log(`📊 Batch size: ${BATCH_SIZE}`)
      console.log(`📊 Total batches to process: ${Math.ceil(allSimCardsToProcess.length / BATCH_SIZE)}`)
      
      if (allSimCardsToProcess.length > 0) {
        // Handle inserts and updates separately to ensure project_id is properly updated
        let successCount = 0
        let errorCount = 0
        
        // Process inserts in batches
        if (simCardsToInsert.length > 0) {
          console.log(`🔄 Starting insert processing: ${simCardsToInsert.length} new SIM cards in batches of ${BATCH_SIZE}`)
          
          for (let i = 0; i < simCardsToInsert.length; i += BATCH_SIZE) {
            const batch = simCardsToInsert.slice(i, i + BATCH_SIZE)
            const batchNumber = Math.floor(i / BATCH_SIZE) + 1
            const totalBatches = Math.ceil(simCardsToInsert.length / BATCH_SIZE)
            
            console.log(`🔄 Processing insert batch ${batchNumber}/${totalBatches} with ${batch.length} SIM cards`)
            console.log(`📊 Progress: ${Math.round((i / simCardsToInsert.length) * 100)}%`)
            
            setCurrentStep(`Inserting batch ${batchNumber}/${totalBatches} (${batch.length} SIM cards)...`)
            setProgress(90 + (i / simCardsToInsert.length) * 5)
            
            // Log sample data from this batch
            if (batchNumber === 1) {
              console.log(`📋 Sample data from first batch:`, batch.slice(0, 2))
            }
            
            try {
              console.log(`⏳ Sending batch ${batchNumber} to database...`)
              const startTime = Date.now()
              
              const { data: insertData, error: insertError } = await supabase
                .from('sim_cards')
                .insert(batch)
                .select()

              const endTime = Date.now()
              console.log(`⏱️ Batch ${batchNumber} database operation took ${endTime - startTime}ms`)

              if (insertError) {
                console.error(`❌ Batch ${batchNumber} insert failed:`, insertError)
                console.error(`❌ Error details:`, {
                  message: insertError.message,
                  details: insertError.details,
                  hint: insertError.hint,
                  code: insertError.code
                })
                
                console.log(`🔄 Falling back to individual inserts for batch ${batchNumber}...`)
                // If batch insert fails, try individual inserts for this batch
                for (let j = 0; j < batch.length; j++) {
                  const simCard = batch[j]
                  try {
                    console.log(`⏳ Inserting individual SIM card ${j + 1}/${batch.length}: ${simCard.sim_account_no}`)
                    const { error: fullError } = await supabase
                      .from('sim_cards')
                      .insert(simCard)
                    
                    if (fullError) {
                      console.error(`❌ Failed to insert SIM card ${simCard.sim_account_no}:`, fullError)
                      errorCount++
                      result.errorDetails.push(`SIM card ${simCard.sim_account_no}: ${fullError.message}`)
                    } else {
                      successCount++
                      console.log(`✅ Successfully inserted SIM card ${simCard.sim_account_no}`)
                    }
                  } catch (error) {
                    console.error(`💥 Unexpected error for SIM card ${simCard.sim_account_no}:`, error)
                    errorCount++
                    result.errorDetails.push(`SIM card ${simCard.sim_account_no}: ${error}`)
                  }
                }
              } else {
                successCount += insertData?.length || 0
                console.log(`✅ Successfully inserted batch ${batchNumber}: ${insertData?.length || 0} SIM cards`)
                console.log(`📊 Batch ${batchNumber} success details:`, {
                  expected: batch.length,
                  actual: insertData?.length || 0,
                  successCount: successCount,
                  errorCount: errorCount
                })
              }
            } catch (error) {
              console.error(`💥 Unexpected error in batch ${batchNumber}:`, error)
              console.error(`💥 Error stack:`, error instanceof Error ? error.stack : 'No stack trace')
              errorCount += batch.length
              result.errorDetails.push(`Batch ${batchNumber} failed: ${error}`)
            }
            
            // Add a small delay between batches to prevent overwhelming the database
            if (i + BATCH_SIZE < simCardsToInsert.length) {
              console.log(`⏳ Waiting 100ms before next batch...`)
              await new Promise(resolve => setTimeout(resolve, 100))
              console.log(`✅ Delay completed, proceeding to next batch`)
            }
          }
          
          console.log(`✅ Insert processing completed. Total: ${successCount} success, ${errorCount} errors`)
        }

        // Process updates in batches
        if (simCardsToUpdate.length > 0) {
          console.log(`🔄 Starting update processing: ${simCardsToUpdate.length} existing SIM cards in batches of ${BATCH_SIZE}`)
          
          for (let i = 0; i < simCardsToUpdate.length; i += BATCH_SIZE) {
            const batch = simCardsToUpdate.slice(i, i + BATCH_SIZE)
            const batchNumber = Math.floor(i / BATCH_SIZE) + 1
            const totalBatches = Math.ceil(simCardsToUpdate.length / BATCH_SIZE)
            
            console.log(`🔄 Processing update batch ${batchNumber}/${totalBatches} with ${batch.length} SIM cards`)
            console.log(`📊 Update progress: ${Math.round((i / simCardsToUpdate.length) * 100)}%`)
            
            setCurrentStep(`Updating batch ${batchNumber}/${totalBatches} (${batch.length} SIM cards)...`)
            setProgress(95 + (i / simCardsToUpdate.length) * 5)
            
            // Process each SIM card in the batch individually for updates
            console.log(`🔄 Processing ${batch.length} individual updates for batch ${batchNumber}`)
            for (let j = 0; j < batch.length; j++) {
              const simCard = batch[j]
              try {
                console.log(`⏳ Updating SIM card ${j + 1}/${batch.length}: ${simCard.sim_account_no} (ID: ${simCard.id})`)
                
                const updateData = {
                  sim_service_no: simCard.sim_service_no,
                  sim_start_date: simCard.sim_start_date,
                  sim_type_id: simCard.sim_type_id,
                  sim_card_plan_id: simCard.sim_card_plan_id,
                  sim_provider_id: simCard.sim_provider_id,
                  sim_status: simCard.sim_status,
                  sim_serial_no: simCard.sim_serial_no,
                  assigned_to: simCard.assigned_to,
                  project_id: simCard.project_id, // Explicitly include project_id in update
                }
                
                const startTime = Date.now()
                const { data: updateResult, error: updateError } = await supabase
                  .from('sim_cards')
                  .update(updateData)
                  .eq('id', simCard.id)
                  .select()
                
                const endTime = Date.now()
                console.log(`⏱️ Update operation took ${endTime - startTime}ms`)
                
                if (updateError) {
                  console.error(`❌ Failed to update SIM card ${simCard.sim_account_no}:`, updateError)
                  console.error(`❌ Update error details:`, {
                    message: updateError.message,
                    details: updateError.details,
                    hint: updateError.hint,
                    code: updateError.code
                  })
                  errorCount++
                  result.errorDetails.push(`SIM card ${simCard.sim_account_no}: ${updateError.message}`)
                } else {
                  successCount++
                  console.log(`✅ Successfully updated SIM card ${simCard.sim_account_no}`)
                  console.log(`📊 Updated project_id: ${simCard.project_id} for SIM card ${simCard.sim_account_no}`)
                }
              } catch (error) {
                console.error(`💥 Unexpected error for SIM card ${simCard.sim_account_no}:`, error)
                console.error(`💥 Error stack:`, error instanceof Error ? error.stack : 'No stack trace')
                errorCount++
                result.errorDetails.push(`SIM card ${simCard.sim_account_no}: ${error}`)
              }
            }
            
            // Add a small delay between batches to prevent overwhelming the database
            if (i + BATCH_SIZE < simCardsToUpdate.length) {
              console.log(`⏳ Waiting 100ms before next update batch...`)
              await new Promise(resolve => setTimeout(resolve, 100))
              console.log(`✅ Update delay completed, proceeding to next batch`)
            }
          }
          
          console.log(`✅ Update processing completed. Total: ${successCount} success, ${errorCount} errors`)
        }
        
        console.log(`🏁 Batch processing completed. Final results:`, {
          totalSuccess: successCount,
          totalErrors: errorCount,
          insertsProcessed: simCardsToInsert.length,
          updatesProcessed: simCardsToUpdate.length
        })
        
        result.success += successCount
        result.errors += errorCount
      } else {
        console.log(`ℹ️ No SIM cards to process (allSimCardsToProcess.length = 0)`)
      }

      setProgress(100)
      setCurrentStep("Import completed!")
      setImportResult(result)

      // Verification: Check if project_id was actually saved
      if (result.success > 0) {
        console.log("🔍 Verifying project assignments...")
        const accountNumbers = validSimCards.map(sc => sc.sim_account_no).filter(Boolean)
        const { data: verificationData } = await supabase
          .from('sim_cards')
          .select('sim_account_no, project_id, projects(name)')
          .in('sim_account_no', accountNumbers)
        
        console.log("📋 Verification results:", verificationData)
        
        // Check for any missing project assignments
        const missingProjects = verificationData?.filter(sim => 
          validSimCards.find(sc => sc.sim_account_no === sim.sim_account_no && sc.project) && 
          !sim.project_id
        )
        
        if (missingProjects && missingProjects.length > 0) {
          console.warn("⚠️ Some SIM cards are missing project assignments:", missingProjects)
          
          // Try to manually update one missing project to test if it's a database issue
          if (missingProjects.length > 0) {
            const testSim = missingProjects[0]
            const expectedProject = validSimCards.find(sc => sc.sim_account_no === testSim.sim_account_no)
            if (expectedProject && expectedProject.project) {
              console.log(`🧪 Testing manual project update for ${testSim.sim_account_no}...`)
              const { data: testUpdate, error: testError } = await supabase
                .from('sim_cards')
                .update({ project_id: projectNameMap.get(expectedProject.project.trim()) })
                .eq('sim_account_no', testSim.sim_account_no)
                .select()
              
              if (testError) {
                console.error("❌ Manual project update failed:", testError)
              } else {
                console.log("✅ Manual project update succeeded:", testUpdate)
              }
            }
          }
        } else {
          console.log("✅ All project assignments verified successfully")
        }
      }

      // Count successful employee assignments
      const assignedSimCards = allSimCards.filter(sc => sc.assigned_to)
      const unassignedSimCards = allSimCards.filter(sc => !sc.assigned_to)
      console.log(`Successfully assigned ${assignedSimCards.length} SIM cards to employees`)
      console.log(`${unassignedSimCards.length} SIM cards have no employee assignment (stored as null)`)

      // Show success message
      const masterDataSummary = Object.entries(result.masterDataCreated)
        .filter(([_, count]) => count > 0)
        .map(([key, count]) => `${count} ${key.replace(/([A-Z])/g, ' $1').toLowerCase()}`)
        .join(', ')

      if (result.success > 0) {
        let assignmentSummary = ''
        if (assignedSimCards.length > 0 && unassignedSimCards.length > 0) {
          assignmentSummary = ` (${assignedSimCards.length} assigned to employees, ${unassignedSimCards.length} unassigned)`
        } else if (assignedSimCards.length > 0) {
          assignmentSummary = ` (${assignedSimCards.length} assigned to employees)`
        } else if (unassignedSimCards.length > 0) {
          assignmentSummary = ` (${unassignedSimCards.length} unassigned - employee codes not found)`
        }
        
        toast({
          title: "Import completed successfully",
          description: `Processed ${result.success} SIM cards (${simCardsToInsert.length} new, ${simCardsToUpdate.length} updated)${assignmentSummary}. Created: ${masterDataSummary}`,
        })
        onImportComplete()
      } else if (result.errors > 0) {
        toast({
          title: "Import completed with errors",
          description: `${result.errors} SIM cards had errors. Created: ${masterDataSummary}`,
          variant: "destructive"
        })
      }

    } catch (error) {
      console.error('💥 Import error occurred:', error)
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      
      // Show detailed error in toast
      toast({
        title: "Import failed",
        description: `Failed to process the file: ${errorMessage}. Check console for details.`,
        variant: "destructive"
      })
      
      setImportResult({
        success: 0,
        errors: 1,
        total: 0,
        errorDetails: [`Import failed: ${errorMessage}`],
        masterDataCreated: {
          simTypes: 0,
          simProviders: 0,
          simCardPlans: 0
        }
      })
    } finally {
      console.log("🏁 Import process finished")
      setIsImporting(false)
    }
  }

  // Debug function to test CSV parsing with a small sample
  const testCSVParsing = async () => {
    if (!selectedFile) return
    
    try {
      console.log("🧪 Testing CSV parsing with first 5 lines...")
      const text = await selectedFile.text()
      const lines = text.split('\n').filter(line => line.trim())
      
      console.log("📄 Total lines in file:", lines.length)
      console.log("📄 First 5 lines:", lines.slice(0, 5))
      
      // Test header parsing
      const headerLine = lines[0]
      const headers = headerLine.match(/("([^"]*)"|([^,]*))/g)?.map(h => h.replace(/^"|"$/g, '').trim().toLowerCase()) || []
      console.log("📋 Parsed headers:", headers)
      
      // Test first data row parsing
      if (lines.length > 1) {
        const firstDataLine = lines[1]
        const values = firstDataLine.match(/("([^"]*)"|([^,]*))/g)?.map(v => v.replace(/^"|"$/g, '').trim()) || []
        console.log("📊 First data row values:", values)
        console.log("📊 Values count:", values.length, "Headers count:", headers.length)
      }
      
    } catch (error) {
      console.error("❌ CSV parsing test failed:", error)
    }
  }

  const downloadTemplate = async () => {
    // Load current projects to show in template
    const { data: projects } = await supabase
      .from('projects')
      .select('name')
      .eq('status', 'active')
      .order('name')

    const headers = [
      'sim_account_no', 'sim_service_no', 'sim_start_date', 'sim_type', 'sim_provider', 'sim_card_plan', 'sim_status', 'sim_serial_no', 'assigned_to', 'project'
    ]
    
    // Use first available project or default
    const sampleProject = projects?.[0]?.name || 'Project Alpha'
    const sampleData = [
      'ACC001', 'SVC001', '2024-01-01', 'Physical SIM', 'Etisalat', 'Unlimited Plan', 'active', 'SN123456789', 'EMP001', sampleProject
    ]

    // Add a comment row with available projects
    const availableProjects = projects?.map(p => p.name).join(', ') || 'No projects available'
    const commentRow = `# Available projects: ${availableProjects}`
    
    const csvContent = [commentRow, headers.join(','), sampleData.join(',')].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'sim_card_import_template.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const handleClose = () => {
    setSelectedFile(null)
    setImportResult(null)
    setProgress(0)
    setCurrentStep("")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
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
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Button
                        onClick={importSimCards}
                        disabled={isImporting}
                        className="flex-1"
                      >
                        {isImporting ? "Importing..." : "Import SIM Cards"}
                      </Button>
                      <Button
                        onClick={() => setSelectedFile(null)}
                        variant="outline"
                        disabled={isImporting}
                      >
                        Clear
                      </Button>
                    </div>
                    <Button
                      onClick={testCSVParsing}
                      variant="outline"
                      size="sm"
                      className="w-full"
                      disabled={isImporting}
                    >
                      🧪 Test CSV Parsing (Debug)
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
                    <span>{currentStep}</span>
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
                  <div className="flex gap-4 flex-wrap">
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

                  {/* Master Data Created Summary */}
                  {Object.values(importResult.masterDataCreated).some(count => count > 0) && (
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">Master Data Created:</h4>
                      <div className="flex gap-2 flex-wrap">
                        {Object.entries(importResult.masterDataCreated)
                          .filter(([_, count]) => count > 0)
                          .map(([key, count]) => (
                            <Badge key={key} variant="secondary" className="bg-blue-100 text-blue-800">
                              {count} {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                            </Badge>
                          ))}
                      </div>
                    </div>
                  )}

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
                <p><strong>✨ Auto-Creation:</strong> Missing master data (SIM types, providers, card plans) will be automatically created</p>
                <p><strong>🚀 Bulk Operations:</strong> All operations are performed in bulk for maximum performance</p>
                <p><strong>📊 Smart Mapping:</strong> Flexible column header recognition (e.g., "sim account no", "sim_account_no", or "account no")</p>
                <p><strong>🔄 Upsert Support:</strong> Updates existing SIM cards and creates new ones in a single operation</p>
                <p><strong>✅ Validation:</strong> Comprehensive data validation with detailed error reporting</p>
                <p><strong>📈 Progress Tracking:</strong> Real-time progress updates during import</p>
                <p><strong>Required columns:</strong> sim_account_no, sim_service_no</p>
                <p><strong>Optional columns:</strong> sim_start_date, sim_type, sim_provider, sim_card_plan, sim_status, sim_serial_no, assigned_to (employee code), project</p>
                <p><strong>Employee Assignment:</strong> Use employee code in assigned_to column (e.g., "EMP001"). The system will resolve it to the employee ID and link to the employee record. If employee not found, assigned_to will be null</p>
                <p><strong>Project Assignment:</strong> Use exact project name in project column (case-insensitive, extra spaces are handled automatically). The system will resolve it to the project ID. If project not found, project_id will be null. Download the template to see available project names.</p>
                <p><strong>Status values:</strong> active, inactive, suspended, expired (defaults to active if not specified)</p>
                <p><strong>Note:</strong> SIM account numbers and service numbers must be unique. SIM types, providers, and card plans will be auto-created if they don't exist.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
