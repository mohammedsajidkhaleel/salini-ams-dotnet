"use client";

import { useState } from "react";
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
import { ProjectFilter } from "./project-filter";
import { assetService, type Asset } from "@/lib/services/assetService";
import { toast } from "@/lib/toast";

interface AssetTableProps {
  assets: Asset[];
  onEdit: (asset: Asset) => void;
  onDelete: (asset: Asset) => void;
  onAdd: () => void;
  onView: (asset: Asset) => void;
  onImport: () => void;
  selectedProjectId?: string; // Project filter from parent
  onProjectChange?: (projectId: string) => void; // Project filter change handler
  searchTerm?: string;
  onSearchChange?: (value: string) => void;
  statusFilter?: number;
  onStatusChange?: (status: number | undefined) => void;
  conditionFilter?: string;
  onConditionChange?: (condition: string | undefined) => void;
  assignedFilter?: boolean;
  onAssignedChange?: (assigned: boolean | undefined) => void;
  itemFilter?: string;
  onItemChange?: (itemId: string | undefined) => void;
  items?: { id: string; name: string }[];
  loading?: boolean;
  pagination?: {
    pageNumber: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
  onPageChange?: (pageNumber: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
}

export function AssetTable({
  assets,
  onEdit,
  onDelete,
  onAdd,
  onView,
  onImport,
  selectedProjectId = "all", // Use project filter from parent
  onProjectChange,
  searchTerm = "",
  onSearchChange,
  statusFilter,
  onStatusChange,
  conditionFilter,
  onConditionChange,
  assignedFilter,
  onAssignedChange,
  itemFilter,
  onItemChange,
  items = [],
  loading = false,
  pagination,
  onPageChange,
  onPageSizeChange,
}: AssetTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Use server-side pagination if provided, otherwise use client-side filtering and pagination
  const useServerSidePagination = !!pagination;

  // Helper to convert status number to label
  const statusLabel = (status: number): string => {
    switch (status) {
      case 1: return "available";
      case 2: return "assigned";
      case 3: return "maintenance";
      case 4: return "retired";
      default: return "unknown";
    }
  };

  const filteredAssets = useServerSidePagination
    ? assets // When using server-side pagination, assets are already filtered by the server
    : assets.filter((asset) => {
      const matchesSearch =
        asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.assetTag.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (asset.serialNumber || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (asset.assignedEmployeeName || asset.currentAssignment?.employeeName || "").toLowerCase().includes(searchTerm.toLowerCase());

      const matchesItem = !itemFilter || asset.itemId === itemFilter || asset.item?.id === itemFilter;
      const matchesStatus = !statusFilter || asset.status === statusFilter;
      const matchesCondition = !conditionFilter || asset.condition === conditionFilter;
      const matchesAssigned = assignedFilter === undefined || (assignedFilter ? (asset.status === 2) : (asset.status !== 2));
      const matchesProject = selectedProjectId === "all" || asset.projectId === selectedProjectId;

      return matchesSearch && matchesItem && matchesStatus && matchesCondition && matchesAssigned && matchesProject;
    });

  // Pagination logic
  const paginatedAssets = useServerSidePagination
    ? filteredAssets // Server-side pagination - assets are already paginated
    : (() => {
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      return filteredAssets.slice(startIndex, endIndex);
    })();

  // Reset to first page when filters change
  // Note: This is mainly for client-side pagination. 
  // For server-side, the parent component handles page reset.
  const handleClientFilterChange = () => {
    setCurrentPage(1);
  };

  // Handle client-side page size changes
  const handleClientPageSizeChange = (pageSize: number) => {
    setItemsPerPage(pageSize);
    setCurrentPage(1);
  };



  const getStatusColor = (status: number) => {
    switch (status) {
      case 1: // available
        return "default";
      case 2: // assigned
        return "secondary";
      case 3: // maintenance
        return "destructive";
      case 4: // retired
        return "outline";
      default:
        return "default";
    }
  };

  const getConditionColor = (condition?: string) => {
    switch (condition) {
      case "excellent":
        return "default";
      case "good":
        return "secondary";
      case "fair":
        return "destructive";
      case "poor":
        return "outline";
      default:
        return "default";
    }
  };

  const handleExportCSV = async () => {
    try {
      const loadingToastId = toast.loading('Preparing export...');
      
      // Build export parameters with current filters
      const exportParams: any = {
        searchTerm: searchTerm || undefined,
        status: statusFilter,
        assigned: assignedFilter,
        itemId: itemFilter,
        projectId: selectedProjectId && selectedProjectId !== "all" ? selectedProjectId : undefined,
        sortBy: 'createdAt',
        sortDescending: true
      };

      // Remove undefined values
      Object.keys(exportParams).forEach(key => {
        if (exportParams[key] === undefined) {
          delete exportParams[key];
        }
      });

      const blob = await assetService.exportAssets(exportParams);
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `assets-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.dismiss(loadingToastId);
      toast.success('Assets exported successfully');
    } catch (error) {
      toast.error('Failed to export assets');
      console.error('Export error:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Assets ({filteredAssets.length})</CardTitle>
          <div className="flex gap-2">
            <Button
              onClick={handleExportCSV}
              variant="outline"
              className="cursor-pointer"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button onClick={onImport} variant="outline" className="cursor-pointer">
              <Upload className="h-4 w-4 mr-2" />
              Import CSV
            </Button>
            <Button onClick={onAdd} className="cursor-pointer">
              <Plus className="h-4 w-4 mr-2" />
              Add Asset
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search assets..."
              value={searchTerm}
              onChange={(e) => {
                onSearchChange?.(e.target.value);
                handleClientFilterChange();
              }}
              className="pl-10"
            />
          </div>

          {/* Item Filter */}
          <select
            value={itemFilter || ""}
            onChange={(e) => {
              onItemChange?.(e.target.value || undefined);
              handleClientFilterChange();
            }}
            className="px-3 py-2 border border-input rounded-md bg-background cursor-pointer max-w-[150px]"
          >
            <option value="">All Items</option>
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter || ""}
            onChange={(e) => {
              onStatusChange?.(e.target.value ? Number(e.target.value) : undefined);
              handleClientFilterChange();
            }}
            className="px-3 py-2 border border-input rounded-md bg-background cursor-pointer max-w-[150px]"
          >
            <option value="">All Status</option>
            <option value="1">Available</option>
            <option value="2">Assigned</option>
            <option value="3">Maintenance</option>
            <option value="4">Retired</option>
          </select>

          {/* Condition Filter */}
          <select
            value={conditionFilter || ""}
            onChange={(e) => {
              onConditionChange?.(e.target.value || undefined);
              handleClientFilterChange();
            }}
            className="px-3 py-2 border border-input rounded-md bg-background cursor-pointer max-w-[150px]"
          >
            <option value="">All Conditions</option>
            <option value="excellent">Excellent</option>
            <option value="good">Good</option>
            <option value="fair">Fair</option>
            <option value="poor">Poor</option>
          </select>

          {/* Assigned Filter */}
          <select
            value={assignedFilter === undefined ? "" : assignedFilter.toString()}
            onChange={(e) => {
              onAssignedChange?.(e.target.value === "" ? undefined : e.target.value === "true");
              handleClientFilterChange();
            }}
            className="px-3 py-2 border border-input rounded-md bg-background cursor-pointer max-w-[150px]"
          >
            <option value="">All Assets</option>
            <option value="true">Assigned</option>
            <option value="false">Unassigned</option>
          </select>

          {onProjectChange && (
            <ProjectFilter
              selectedProjectId={selectedProjectId}
              onProjectChange={onProjectChange}
              showAllOption={true}
              className="min-w-[200px]"
            />
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Asset Tag</TableHead>
              <TableHead>Asset Name</TableHead>
              <TableHead>Serial Number</TableHead>
              <TableHead>Item</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Condition</TableHead>
              <TableHead>Assigned Employee</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>PO Number</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedAssets.map((asset) => (
              <TableRow key={asset.id}>
                <TableCell className="font-medium">{asset.assetTag}</TableCell>
                <TableCell>{asset.name}</TableCell>
                <TableCell>{asset.serialNumber || "-"}</TableCell>
                <TableCell>{asset.itemName || asset.item?.name || "-"}</TableCell>
                <TableCell>
                  <Badge variant={getStatusColor(asset.status)}>
                    {statusLabel(asset.status)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={getConditionColor(asset.condition)}>
                    {asset.condition || "excellent"}
                  </Badge>
                </TableCell>
                <TableCell>{asset.assignedEmployeeName || asset.currentAssignment?.employeeName || "-"}</TableCell>
                <TableCell>{asset.projectName || asset.project?.name || "N/A"}</TableCell>
                <TableCell>{asset.poNumber || "-"}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onView(asset)}
                      className="cursor-pointer"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(asset)}
                      className="cursor-pointer"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(asset)}
                      className="cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {paginatedAssets.length === 0 && !loading && (
          <div className="text-center py-8 text-muted-foreground">
            No assets found matching your criteria.
          </div>
        )}

        {loading && (
          <div className="text-center py-8 text-muted-foreground">
            Loading assets...
          </div>
        )}

        {!useServerSidePagination && filteredAssets.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <label htmlFor="client-pageSize" className="text-sm text-muted-foreground whitespace-nowrap">
                  Rows per page:
                </label>
                <select
                  id="client-pageSize"
                  value={itemsPerPage}
                  onChange={(e) => handleClientPageSizeChange(Number(e.target.value))}
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
                  totalPages={Math.ceil(filteredAssets.length / itemsPerPage)}
                  onPageChange={setCurrentPage}
                  itemsPerPage={itemsPerPage}
                  totalItems={filteredAssets.length}
                />
              </div>
            </div>
          </div>
        )}

        {useServerSidePagination && pagination && (
          <div className="mt-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <label htmlFor="pageSize" className="text-sm text-muted-foreground whitespace-nowrap">
                  Rows per page:
                </label>
                <select
                  id="pageSize"
                  value={pagination.pageSize}
                  onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
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
                  currentPage={pagination.pageNumber}
                  totalPages={pagination.totalPages}
                  onPageChange={onPageChange || (() => { })}
                  itemsPerPage={pagination.pageSize}
                  totalItems={pagination.totalCount}
                />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
