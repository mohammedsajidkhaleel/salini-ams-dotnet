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
import { MasterDataService, type SimProvider, type SimType, type SimCardPlan } from "@/lib/services";

interface SimCardTableProps {
  simCards: SimCard[];
  onEdit: (simCard: SimCard) => void;
  onDelete: (simCard: SimCard) => void;
  onAdd: () => void;
  onView: (simCard: SimCard) => void;
  onImport: () => void;
}

export function SimCardTable({
  simCards,
  onEdit,
  onDelete,
  onAdd,
  onView,
  onImport,
}: SimCardTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCarrier, setFilterCarrier] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
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
      simCard.sim_account_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
      simCard.sim_service_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
      simCard.assigned_to_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      simCard.sim_serial_no?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = !filterStatus || getStatusText(simCard.sim_status).toLowerCase() === filterStatus.toLowerCase();
    const matchesProvider = !filterCarrier || simCard.sim_provider_name === filterCarrier;

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

  const providerNames = [...new Set(simCards.map((sim) => sim.sim_provider_name).filter(Boolean))];

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
  const exportToCSV = () => {
    // Use filteredSimCards to include all results that match search conditions
    const csvData = filteredSimCards.map((simCard) => {
      // Extract employee code from assigned_to_name (format: "CODE - NAME")
      const employeeCode = simCard.assigned_to_name?.split(' - ')[0] || '';
      const employeeName = simCard.assigned_to_name?.split(' - ')[1] || '';
      
      return {
        account_no: simCard.sim_account_no,
        service_no: simCard.sim_service_no,
        employee_code: employeeCode,
        employee_name: employeeName,
        project_name: simCard.project_name || '',
        sim_type: simCard.sim_type_name || '',
        plan: simCard.sim_card_plan_name || '',
        status: getStatusText(simCard.sim_status),
        serial_no: simCard.sim_serial_no || ''
      };
    });

    // Create CSV headers
    const headers = [
      'Account No',
      'Service No', 
      'Employee Code',
      'Employee Name',
      'Project Name',
      'SIM Type',
      'Plan',
      'Status',
      'Serial No'
    ];

    // Convert to CSV format
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => 
        headers.map(header => {
          const value = row[header.toLowerCase().replace(/\s+/g, '_') as keyof typeof row];
          // Escape commas and quotes in CSV values
          return `"${String(value).replace(/"/g, '""')}"`;
        }).join(',')
      )
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `sim_cards_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>SIM Cards ({filteredSimCards.length})</CardTitle>
          <div className="flex gap-2">
            <Button onClick={exportToCSV} variant="outline" disabled={filteredSimCards.length === 0}>
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
                  {simCard.sim_account_no}
                </TableCell>
                <TableCell className="font-mono text-sm">
                  {simCard.sim_service_no}
                </TableCell>
                <TableCell>
                  <DateDisplay date={simCard.sim_start_date} />
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {simCard.sim_type_name || "N/A"}
                  </Badge>
                </TableCell>
                <TableCell>{simCard.sim_provider_name || "N/A"}</TableCell>
                <TableCell>{simCard.sim_card_plan_name || "N/A"}</TableCell>
                <TableCell>{simCard.project_name || "N/A"}</TableCell>
                <TableCell>
                  <Badge variant={getStatusColor(simCard.sim_status)}>
                    {getStatusText(simCard.sim_status)}
                  </Badge>
                </TableCell>
                <TableCell>{simCard.assigned_to_name || "-"}</TableCell>
                <TableCell className="font-mono text-sm">
                  {simCard.sim_serial_no || "-"}
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
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              itemsPerPage={itemsPerPage}
              totalItems={filteredSimCards.length}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
