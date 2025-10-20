"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Printer, Search, Smartphone, Wifi, Users, AlertTriangle } from "lucide-react";
import { useReactToPrint } from "react-to-print";
import { useRef } from "react";
import { useAuth } from "@/contexts/auth-context-new";
import { simCardService, type SimCard } from "@/lib/services";
import { toast } from "@/lib/toast";
import { ErrorHandler } from "@/lib/errorHandler";

interface SimCardReportData {
  id: string;
  simAccountNo: string;
  simServiceNo: string;
  simType: string;
  simProvider: string;
  simCardPlan: string;
  simStatus: number;
  simSerialNo: string;
  assignedTo: string;
  project: string;
  startDate: string;
  createdAt: string;
}

export function SimCardReport() {
  const { user } = useAuth();
  const [simCards, setSimCards] = useState<SimCardReportData[]>([]);
  const [filteredSimCards, setFilteredSimCards] = useState<SimCardReportData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<number | undefined>(undefined);
  const [providerFilter, setProviderFilter] = useState<string>("");
  const [projectFilter, setProjectFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadSimCardData();
  }, []);

  useEffect(() => {
    filterSimCards();
  }, [simCards, searchTerm, statusFilter, providerFilter, projectFilter]);

  const loadSimCardData = async () => {
    try {
      setLoading(true);
      
      const response = await simCardService.getSimCards({
        pageNumber: 1,
        pageSize: 1000, // Get all SIM cards for the report
        sortBy: 'createdAt',
        sortDirection: 'desc',
      });

      const mappedSimCards: SimCardReportData[] = response.items.map((simCard: SimCard) => ({
        id: simCard.id,
        simAccountNo: simCard.simAccountNo,
        simServiceNo: simCard.simServiceNo,
        simType: simCard.simType?.name || "Unknown",
        simProvider: simCard.simProvider?.name || "Unknown",
        simCardPlan: simCard.simCardPlan?.name || "Unknown",
        simStatus: simCard.simStatus,
        simSerialNo: simCard.simSerialNo || "",
        assignedTo: simCard.assignedTo ? `${simCard.assignedTo.firstName} ${simCard.assignedTo.lastName}` : "Unassigned",
        project: simCard.project?.name || "Unassigned",
        startDate: simCard.simStartDate ? new Date(simCard.simStartDate).toISOString().split("T")[0] : "",
        createdAt: new Date(simCard.createdAt).toISOString().split("T")[0],
      }));

      setSimCards(mappedSimCards);
      toast.success(`Loaded ${mappedSimCards.length} SIM cards for report`);
    } catch (error) {
      const errorMessage = ErrorHandler.showError(error as Error, 'SimCardReport');
      toast.error(errorMessage);
      console.error("Error loading SIM card data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterSimCards = () => {
    let filtered = simCards;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(simCard =>
        simCard.simAccountNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        simCard.simServiceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        simCard.simSerialNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        simCard.assignedTo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        simCard.simProvider.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== undefined) {
      filtered = filtered.filter(simCard => simCard.simStatus === statusFilter);
    }

    // Provider filter
    if (providerFilter) {
      filtered = filtered.filter(simCard => simCard.simProvider === providerFilter);
    }

    // Project filter
    if (projectFilter) {
      filtered = filtered.filter(simCard => simCard.project === projectFilter);
    }

    setFilteredSimCards(filtered);
    setCurrentPage(1);
  };

  const getStatusColor = (status: number) => {
    switch (status) {
      case 1: // Active
        return "bg-green-100 text-green-800";
      case 2: // Suspended
        return "bg-yellow-100 text-yellow-800";
      case 3: // Terminated
        return "bg-red-100 text-red-800";
      case 4: // Expired
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: number) => {
    switch (status) {
      case 1: return "Active";
      case 2: return "Suspended";
      case 3: return "Terminated";
      case 4: return "Expired";
      default: return "Unknown";
    }
  };

  const handlePrint = useReactToPrint({
    contentRef: reportRef,
    documentTitle: `SIM Card Report - ${new Date().toLocaleDateString()}`,
  });

  const handleExport = () => {
    const csvContent = [
      ["Account No", "Service No", "Type", "Provider", "Plan", "Status", "Serial No", "Assigned To", "Project", "Start Date", "Created Date"],
      ...filteredSimCards.map(simCard => [
        simCard.simAccountNo,
        simCard.simServiceNo,
        simCard.simType,
        simCard.simProvider,
        simCard.simCardPlan,
        getStatusLabel(simCard.simStatus),
        simCard.simSerialNo,
        simCard.assignedTo,
        simCard.project,
        simCard.startDate,
        simCard.createdAt,
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sim-card-report-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success("SIM card report exported successfully");
  };

  // Pagination
  const totalPages = Math.ceil(filteredSimCards.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedSimCards = filteredSimCards.slice(startIndex, endIndex);

  // Get unique values for filters
  const providers = [...new Set(simCards.map(simCard => simCard.simProvider))];
  const projects = [...new Set(simCards.map(simCard => simCard.project))];

  // Statistics
  const totalSimCards = simCards.length;
  const activeSimCards = simCards.filter(simCard => simCard.simStatus === 1).length;
  const suspendedSimCards = simCards.filter(simCard => simCard.simStatus === 2).length;
  const terminatedSimCards = simCards.filter(simCard => simCard.simStatus === 3).length;
  const assignedSimCards = simCards.filter(simCard => simCard.assignedTo !== "Unassigned").length;
  const utilizationRate = totalSimCards > 0 ? Math.round((assignedSimCards / totalSimCards) * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600 mx-auto mb-4"></div>
          <div className="text-muted-foreground">Loading SIM card data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total SIM Cards</CardTitle>
            <Smartphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSimCards}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <div className="h-2 w-2 bg-green-500 rounded-full"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeSimCards}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suspended</CardTitle>
            <div className="h-2 w-2 bg-yellow-500 rounded-full"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{suspendedSimCards}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Terminated</CardTitle>
            <div className="h-2 w-2 bg-red-500 rounded-full"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{terminatedSimCards}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{assignedSimCards}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilization</CardTitle>
            <Wifi className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cyan-600">{utilizationRate}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>SIM Card Report</CardTitle>
            <div className="flex gap-2">
              <Button onClick={handleExport} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Print Report
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search SIM cards..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <select
              value={statusFilter || ""}
              onChange={(e) => setStatusFilter(e.target.value ? Number(e.target.value) : undefined)}
              className="px-3 py-2 border border-input rounded-md bg-background cursor-pointer"
            >
              <option value="">All Status</option>
              <option value="1">Active</option>
              <option value="2">Suspended</option>
              <option value="3">Terminated</option>
              <option value="4">Expired</option>
            </select>
            
            <select
              value={providerFilter}
              onChange={(e) => setProviderFilter(e.target.value)}
              className="px-3 py-2 border border-input rounded-md bg-background cursor-pointer"
            >
              <option value="">All Providers</option>
              {providers.map(provider => (
                <option key={provider} value={provider}>{provider}</option>
              ))}
            </select>
            
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="px-3 py-2 border border-input rounded-md bg-background cursor-pointer"
            >
              <option value="">All Projects</option>
              {projects.map(project => (
                <option key={project} value={project}>{project}</option>
              ))}
            </select>
          </div>

          {/* Report Table */}
          <div ref={reportRef} className="print:max-w-none print:w-full">
            <div className="print:hidden mb-4">
              <p className="text-sm text-muted-foreground">
                Showing {filteredSimCards.length} of {totalSimCards} SIM cards
              </p>
            </div>
            
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account No</TableHead>
                    <TableHead>Service No</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Serial No</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead className="print:hidden">Start Date</TableHead>
                    <TableHead className="print:hidden">Created Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedSimCards.map((simCard) => (
                    <TableRow key={simCard.id}>
                      <TableCell className="font-medium">{simCard.simAccountNo}</TableCell>
                      <TableCell>{simCard.simServiceNo}</TableCell>
                      <TableCell>{simCard.simType}</TableCell>
                      <TableCell>{simCard.simProvider}</TableCell>
                      <TableCell>{simCard.simCardPlan}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(simCard.simStatus)}>
                          {getStatusLabel(simCard.simStatus)}
                        </Badge>
                      </TableCell>
                      <TableCell>{simCard.simSerialNo}</TableCell>
                      <TableCell>{simCard.assignedTo}</TableCell>
                      <TableCell>{simCard.project}</TableCell>
                      <TableCell className="print:hidden">{simCard.startDate}</TableCell>
                      <TableCell className="print:hidden">{simCard.createdAt}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 print:hidden">
                <p className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
