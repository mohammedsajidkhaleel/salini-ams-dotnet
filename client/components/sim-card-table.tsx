"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit, Trash2, Search, Plus, Eye, Upload, Download } from "lucide-react";
import { Pagination } from "./ui/pagination";
import { DateDisplay } from "./ui/date-display";
import { SimCard } from "@/lib/types";
import { MasterDataService, simCardService } from "@/lib/services";
import type { SimProvider, SimType, SimCardPlan } from "@/lib/services/masterDataService";
import { ProjectFilter } from "./project-filter";
import { toast } from "@/lib/toast";

interface SimCardTableProps {
  simCards: SimCard[];
  onEdit: (simCard: SimCard) => void;
  onDelete: (simCard: SimCard) => void;
  onAdd: () => void;
  onView: (simCard: SimCard) => void;
  onImport: () => void;
  selectedProjectId: string;
  onProjectChange: (projectId: string) => void;
}

export function SimCardTable({
  simCards,
  onEdit,
  onDelete,
  onAdd,
  onView,
  onImport,
  selectedProjectId,
  onProjectChange,
}: SimCardTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCarrier, setFilterCarrier] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [providers, setProviders] = useState<SimProvider[]>([]);
  const [types, setTypes] = useState<SimType[]>([]);
  const [cardPlans, setCardPlans] = useState<SimCardPlan[]>([]);

  // Load master data with caching and deduplication
  useEffect(() => {
    let isCancelled = false;

    const loadMasterData = async () => {
      try {
        console.log("🔄 Loading master data for SimCardTable...");

        const [providersRes, typesRes, cardPlansRes] = await Promise.all([
          MasterDataService.getSimProviders(),
          MasterDataService.getSimTypes(),
          MasterDataService.getSimCardPlans()
        ]);

        // Check if component is still mounted before updating state
        if (isCancelled) {
          console.log("🚫 Master data request cancelled");
          return;
        }

        setProviders(providersRes || []);
        setTypes(typesRes || []);
        setCardPlans(cardPlansRes || []);

        console.log("✅ Master data loaded for SimCardTable");
      } catch (error) {
        if (!isCancelled) {
          console.error("❌ Error loading master data:", error);
        }
      }
    };

    loadMasterData();

    // Cleanup function
    return () => {
      isCancelled = true;
    };
  }, []);

  const filteredSimCards = simCards.filter((simCard) => {
    const matchesSearch =
      simCard.simAccountNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      simCard.simServiceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      simCard.assignedEmployeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      simCard.simSerialNo?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = !filterStatus || getStatusText(simCard.simStatus).toLowerCase() === filterStatus.toLowerCase();
    const matchesProvider = !filterCarrier || simCard.simProviderName === filterCarrier;

    return matchesSearch && matchesStatus && matchesProvider;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredSimCards.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedSimCards = filteredSimCards.slice(startIndex, endIndex);

  // Reset to first page when filters change
  const handleFilterChange = (
    newFilter: string,
    setter: (value: string) => void
  ) => {
    setter(newFilter);
    setCurrentPage(1);
  };

  // Handle page size changes
  const handlePageSizeChange = (pageSize: number) => {
    setItemsPerPage(pageSize);
    setCurrentPage(1);
  };

  const providerNames = [...new Set(simCards.map((sim) => sim.simProviderName).filter(Boolean))];

  // Helper functions to get names from IDs
  const getProviderName = (providerId?: string) => {
    if (!providerId) return "N/A";
    return providers.find(p => p.id === providerId)?.name || "N/A";
  };

  const getTypeName = (typeId?: string) => {
    if (!typeId) return "N/A";
    return types.find(t => t.id === typeId)?.name || "N/A";
  };

  const getCardPlanName = (cardPlanId?: string) => {
    if (!cardPlanId) return "N/A";
    return cardPlans.find(cp => cp.id === cardPlanId)?.name || "N/A";
  };

  const getStatusText = (status: number | string) => {
    const statusNum = typeof status === 'string' ? parseInt(status) : status;
    switch (statusNum) {
      case 1:
        return "Active";
      case 2:
        return "Inactive";
      case 3:
        return "Suspended";
      case 4:
        return "Expired";
      default:
        return "Unknown";
    }
  };

  const getStatusColor = (status: number | string) => {
    const statusNum = typeof status === 'string' ? parseInt(status) : status;
    switch (statusNum) {
      case 1: // Active
        return "default";
      case 2: // Inactive
        return "secondary";
      case 3: // Suspended
        return "destructive";
      case 4: // Expired
        return "outline";
      default:
        return "secondary";
    }
  };

  // CSV Export function
  const exportToCSV = async () => {
    try {
      const loadingToastId = toast.loading('Preparing export...');
      
      // Build export parameters with current filters
      const exportParams: any = {
        searchTerm: searchTerm || undefined,
        projectId: selectedProjectId && selectedProjectId !== "all" ? selectedProjectId : undefined,
        simStatus: filterStatus ? parseInt(filterStatus) : undefined,
        simProviderId: filterCarrier || undefined,
        sortBy: 'simAccountNo',
        sortDescending: false
      };

      // Remove undefined values
      Object.keys(exportParams).forEach(key => {
        if (exportParams[key] === undefined) {
          delete exportParams[key];
        }
      });

      const blob = await simCardService.exportSimCards(exportParams);
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sim_cards_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.dismiss(loadingToastId);
      toast.success('SIM cards exported successfully');
    } catch (error) {
      toast.error('Failed to export SIM cards');
      console.error('Export error:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>SIM Cards ({filteredSimCards.length})</CardTitle>
          <div className="flex gap-2">
            <Button onClick={exportToCSV} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button onClick={onImport} variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Import SIM Cards
            </Button>
            <Button onClick={onAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Add SIM Card
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search SIM cards..."
              value={searchTerm}
              onChange={(e) =>
                handleFilterChange(e.target.value, setSearchTerm)
              }
              className="pl-10"
            />
          </div>
          <ProjectFilter
            selectedProjectId={selectedProjectId}
            onProjectChange={(projectId) => handleFilterChange(projectId, onProjectChange)}
            showAllOption={true}
            className="min-w-[200px]"
          />
          <select
            value={filterStatus}
            onChange={(e) =>
              handleFilterChange(e.target.value, setFilterStatus)
            }
            className="px-3 py-2 border border-input rounded-md bg-background cursor-pointer"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
            <option value="expired">Expired</option>
          </select>
          <select
            value={filterCarrier}
            onChange={(e) =>
              handleFilterChange(e.target.value, setFilterCarrier)
            }
            className="px-3 py-2 border border-input rounded-md bg-background cursor-pointer"
          >
            <option value="">All Providers</option>
            {providerNames.map((provider) => (
              <option key={provider} value={provider}>
                {provider}
              </option>
            ))}
          </select>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Account No</TableHead>
              <TableHead>Service No</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Card Plan</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead>Serial Number</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedSimCards.map((simCard) => (
              <TableRow key={simCard.id}>
                <TableCell className="font-mono text-sm">
                  {simCard.simAccountNo}
                </TableCell>
                <TableCell className="font-mono text-sm">
                  {simCard.simServiceNo}
                </TableCell>
                <TableCell>
                  <DateDisplay date={simCard.simStartDate || ""} />
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {simCard.simTypeName || "N/A"}
                  </Badge>
                </TableCell>
                <TableCell>{simCard.simProviderName || "N/A"}</TableCell>
                <TableCell>{simCard.simCardPlanName || "N/A"}</TableCell>
                <TableCell>{simCard.projectName || "N/A"}</TableCell>
                <TableCell>
                  <Badge variant={getStatusColor(simCard.simStatus)}>
                    {getStatusText(simCard.simStatus)}
                  </Badge>
                </TableCell>
                <TableCell>{simCard.assignedEmployeeName || "-"}</TableCell>
                <TableCell className="font-mono text-sm">
                  {simCard.simSerialNo || "-"}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onView(simCard)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(simCard)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(simCard)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {filteredSimCards.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No SIM cards found matching your criteria.
          </div>
        )}

        {filteredSimCards.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <label htmlFor="pageSize" className="text-sm text-muted-foreground whitespace-nowrap">
                  Rows per page:
                </label>
                <select
                  id="pageSize"
                  value={itemsPerPage}
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  className="px-3 py-1.5 border border-input rounded-md bg-background text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
              <div className="flex-1">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  itemsPerPage={itemsPerPage}
                  totalItems={filteredSimCards.length}
                />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
