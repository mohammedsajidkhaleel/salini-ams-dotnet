"use client"
import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Printer, X, FileText } from "lucide-react"
import { Employee } from "@/lib/types"
import { PDFService } from "@/lib/pdfService"
import { employeeService, EmployeeReportData } from "@/lib/services/employeeService"


interface EmployeeReportProps {
  employee: Employee | null
  isOpen: boolean
  onClose: () => void
}

export function EmployeeReport({ employee, isOpen, onClose }: EmployeeReportProps) {
  const [loading, setLoading] = useState(false)
  const [generatingPDF, setGeneratingPDF] = useState(false)
  const [reportData, setReportData] = useState<EmployeeReportData | null>(null)
  const reportRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen && employee) {
      loadEmployeeData()
    }
  }, [isOpen, employee])

  const loadEmployeeData = async () => {
    if (!employee) return

    setLoading(true)
    try {
      console.log("🔍 Loading comprehensive employee report data for:", employee.id, employee.name)
      
      const data = await employeeService.getEmployeeReport(employee.id)
      console.log("📊 Employee report data loaded:", data)
      
      setReportData(data)
    } catch (error) {
      console.error("Error loading employee report data:", error)
    } finally {
      setLoading(false)
    }
  }


  const handlePrint = () => {
    if (!reportRef.current || !employee) return

    setGeneratingPDF(true)
    try {
      // Open the popup content in a new tab for printing
      PDFService.openPopupInNewTab(
        reportRef.current,
        `Employee IT Equipment Undertaking - ${employee.name}`
      )
    } catch (error) {
      console.error('Error opening report in new tab:', error)
      // Fallback to browser print
      window.print()
    } finally {
      setGeneratingPDF(false)
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return ""
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const getCurrentDate = () => {
    return new Date().toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  if (!employee || !reportData) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] w-[95vw] h-[95vh] overflow-hidden flex flex-col print:max-w-none print:w-full print:h-auto print:overflow-visible">
        <DialogHeader className="flex-shrink-0 print:hidden">
          <div className="flex items-center justify-between">
            <DialogTitle>Employee IT Equipment Undertaking - {employee.name}</DialogTitle>
            <div className="flex gap-2">
              <Button 
                onClick={handlePrint} 
                className="bg-blue-600 hover:bg-blue-700"
                disabled={generatingPDF}
              >
                {generatingPDF ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Opening Report...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Open Report
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-muted-foreground">Loading employee data...</div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-6 pr-2 print:overflow-visible print:space-y-0 print:p-0">
            {/* Main Report Container */}
            <div 
              ref={reportRef}
              className="print-content print:max-w-none print:w-full print:min-h-screen print:bg-white print:text-black"
              style={{
                minHeight: '100vh',
                width: '100%',
                overflow: 'visible',
                position: 'relative'
              }}
            >
              
              {/* Header */}
              <div className="text-center mb-6 print:mb-4">
                <h1 className="text-xl font-bold uppercase tracking-wide print:text-lg">
                  UNDERTAKING (Issuance and Acceptance of IT Equipment's)
                </h1>
                <div className="mt-2 text-lg font-semibold print:text-base">
                  Employee: {reportData.fullName}
                </div>
              </div>

              {/* Employee Information Grid */}
              <div className="grid grid-cols-2 gap-6 mb-4 print:mb-3">
                {/* Left Column - Employee Details */}
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="font-semibold">Employee ID:</div>
                      <div className="border-b border-gray-300 pb-1">{reportData.employeeId}</div>
                    </div>
                    <div>
                      <div className="font-semibold">Employee:</div>
                      <div className="border-b border-gray-300 pb-1">{reportData.fullName}</div>
                    </div>
                    <div>
                      <div className="font-semibold">Designation:</div>
                      <div className="border-b border-gray-300 pb-1">{reportData.positionName || ""}</div>
                    </div>
                    <div>
                      <div className="font-semibold">Department:</div>
                      <div className="border-b border-gray-300 pb-1">{reportData.departmentName || ""}</div>
                    </div>
                    <div>
                      <div className="font-semibold">Sub Dept.:</div>
                      <div className="border-b border-gray-300 pb-1">{reportData.subDepartmentName || ""}</div>
                    </div>
                    <div>
                      <div className="font-semibold">Date of Join:</div>
                      <div className="border-b border-gray-300 pb-1">{formatDate(reportData.joiningDate)}</div>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <div className="font-semibold text-sm">Date Updated:</div>
                    <div className="border-b border-gray-300 pb-1 text-sm">{formatDate(new Date().toISOString())}</div>
                  </div>
                </div>

                {/* Right Column - Project & Other Details */}
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="font-semibold">Project:</div>
                      <div className="border-b border-gray-300 pb-1">{reportData.projectName || ""}</div>
                    </div>
                    <div>
                      <div className="font-semibold">Sponsor:</div>
                      <div className="border-b border-gray-300 pb-1">{reportData.companyName || ""}</div>
                    </div>
                    <div>
                      <div className="font-semibold">Location:</div>
                      <div className="border-b border-gray-300 pb-1">{reportData.address || ""}</div>
                    </div>
                    <div>
                      <div className="font-semibold">Iqama:</div>
                      <div className="border-b border-gray-300 pb-1">{reportData.idNumber || ""}</div>
                    </div>
                    <div>
                      <div className="font-semibold">Nationality:</div>
                      <div className="border-b border-gray-300 pb-1">{reportData.nationalityName || ""}</div>
                    </div>
                    <div>
                      <div className="font-semibold">Email Issued:</div>
                      <div className="border-b border-gray-300 pb-1">{reportData.email || 'N/A'}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Assigned Items Grid */}
              <div className="grid grid-cols-3 gap-3 mb-4 print:mb-3">
                {/* Mobile SIM Assigned */}
                <div className="bg-pink-100 p-3 rounded print:bg-pink-50">
                  <h3 className="font-bold text-sm mb-2 text-center">Mobile SIM Assigned</h3>
                  <div className="space-y-1 text-xs">
                    <div>
                      <div className="font-semibold">Service No:</div>
                      <div className="border-b border-gray-300 pb-1">{reportData.simCards[0]?.simServiceNo || ""}</div>
                    </div>
                    <div>
                      <div className="font-semibold">Active Plan:</div>
                      <div className="border-b border-gray-300 pb-1">{reportData.simCards[0]?.planName || ""}</div>
                    </div>
                    <div>
                      <div className="font-semibold">Account No:</div>
                      <div className="border-b border-gray-300 pb-1">{reportData.simCards[0]?.simAccountNo || ""}</div>
                    </div>
                    <div>
                      <div className="font-semibold">SIM No:</div>
                      <div className="border-b border-gray-300 pb-1">{reportData.simCards[0]?.simSerialNo || ""}</div>
                    </div>
                  </div>
                </div>

                {/* Desk Phone Assigned */}
                <div className="bg-green-100 p-3 rounded print:bg-green-50">
                  <h3 className="font-bold text-sm mb-2 text-center">Desk Phone Assigned</h3>
                  <div className="space-y-1 text-xs">
                    <div>
                      <div className="font-semibold">Desk Ext:</div>
                      <div className="border-b border-gray-300 pb-1"></div>
                    </div>
                    <div>
                      <div className="font-semibold">Direct No:</div>
                      <div className="border-b border-gray-300 pb-1"></div>
                    </div>
                    <div>
                      <div className="font-semibold">Desk Model:</div>
                      <div className="border-b border-gray-300 pb-1"></div>
                    </div>
                    <div>
                      <div className="font-semibold">Dial Plan:</div>
                      <div className="border-b border-gray-300 pb-1"></div>
                    </div>
                  </div>
                </div>

                {/* Other Accessories Issued */}
                <div className="bg-pink-100 p-3 rounded print:bg-pink-50">
                  <h3 className="font-bold text-sm mb-2 text-center">Other Accessories Issued</h3>
                  <div className="space-y-1 text-xs">
                    {reportData.accessories.map((accessory) => (
                      <div key={accessory.id}>
                        <div className="font-semibold">{accessory.name}:</div>
                        <div className="border-b border-gray-300 pb-1">{accessory.quantity}</div>
                      </div>
                    ))}
                    {reportData.accessories.length === 0 && (
                      <div className="text-center text-gray-500 py-2">
                        No accessories assigned
                        <br />
                        <span className="text-xs text-gray-400">
                          Use the "Quick Assign" feature to assign accessories
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Hardware and Software Grid */}
              <div className="grid grid-cols-3 gap-3 mb-4 print:mb-3">
                {/* Hardware Issued - Spans 2 columns */}
                <div className="col-span-2 bg-purple-100 p-3 rounded print:bg-purple-50">
                  <h3 className="font-bold text-sm mb-2 text-center">Hardware Issued</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-gray-300">
                          <th className="text-left py-1">Asset Tag</th>
                          <th className="text-left py-1">Name</th>
                          <th className="text-left py-1">Item Category</th>
                          <th className="text-left py-1">Serial No</th>
                          <th className="text-left py-1">Condition</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.assets.map((asset, index) => (
                          <tr key={asset.id} className="border-b border-gray-200">
                            <td className="py-1">{asset.assetTag}</td>
                            <td className="py-1">{asset.name}</td>
                            <td className="py-1">{asset.itemName}</td>
                            <td className="py-1">{asset.serialNumber}</td>
                            <td className="py-1">{asset.condition}</td>
                          </tr>
                        ))}
                        {reportData.assets.length === 0 && (
                          <tr>
                            <td colSpan={5} className="py-2 text-center text-gray-500">
                              No hardware assigned
                              <br />
                              <span className="text-xs text-gray-400">
                                Use the "Quick Assign Asset" button to assign assets to this employee
                              </span>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Software Licenses Assigned */}
                <div className="bg-green-100 p-3 rounded print:bg-green-50">
                  <h3 className="font-bold text-sm mb-2 text-center">Software Licenses Assigned</h3>
                  <div className="space-y-1 text-xs">
                    {reportData.softwareLicenses.map((license) => (
                      <div key={license.id}>
                        <div className="font-semibold">{license.softwareName}</div>
                        <div className="border-b border-gray-300 pb-1"></div>
                      </div>
                    ))}
                    {reportData.softwareLicenses.length === 0 && (
                      <div className="text-center text-gray-500 py-2">
                        No software licenses assigned
                        <br />
                        <span className="text-xs text-gray-400">
                          Use the "Quick Assign" feature to assign software licenses
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Other Comments & Notes */}
              <div className="mb-4 print:mb-3">
                <h3 className="font-bold text-sm mb-2">Other Comments & Notes</h3>
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="font-semibold">1.</span> I acknowledge that I have received the above mentioned tools, services and software for official use only and I will use them responsibly and in accordance with company policies.
                  </div>
                  <div>
                    <span className="font-semibold">2.</span> I will inform the IT department immediately in case of any malfunction and will not tamper with the system or software installed.
                  </div>
                  <div>
                    <span className="font-semibold">3.</span> I am responsible for taking all preventative measures against theft, loss or damage to the equipment. In case of any fault on my part, I will be liable for the cost of repair or replacement.
                  </div>
                  <div>
                    <span className="font-semibold">4.</span> I will request the IT department for any additional software or hardware requirements and ensure that all software used is legally licensed.
                  </div>
                </div>
              </div>

              {/* Acceptance & Signatures */}
              <div className="grid grid-cols-2 gap-6 print:gap-4">
                <div className="space-y-3">
                  <div>
                    <div className="font-semibold text-sm mb-2">Employee (Agreed & Accepted)</div>
                    <div className="border-b border-gray-300 pb-8"></div>
                    <div className="text-sm mt-2">{reportData.fullName}</div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="font-semibold text-sm mb-2">IT Department (Confirmed BY)</div>
                    <div className="border-b border-gray-300 pb-6"></div>
                    <div className="text-sm mt-2">IT Manager</div>
                  </div>
                </div>
              </div>

              {/* Date and Footer */}
              <div className="mt-4 print:mt-3" style={{ pageBreakInside: 'avoid' }}>
                <div className="text-sm mb-3">
                  <span className="font-semibold">Date:</span> {getCurrentDate()}
                </div>
                <div className="text-xs text-center italic">
                  ***By Signing above I comply to the terms mentioned above and accept that these assets have been issued to me***
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}