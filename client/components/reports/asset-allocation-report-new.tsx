"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Printer, Search, Filter, FileText, TrendingUp, Users, Laptop, AlertTriangle } from "lucide-react";
import { useReactToPrint } from "react-to-print";
import { useRef } from "react";
import { useAuth } from "@/contexts/auth-context-new";
import { assetService, type Asset } from "@/lib/services";
import { toast } from "@/lib/toast";
import { ErrorHandler } from "@/lib/errorHandler";

interface AssetAllocation {
  id: string;
  assetTag: string;
  assetName: string;
  item: string;
  category: string;
  serialNumber: string;
  assignedTo: string;
  status: number;
  condition: string;
  purchaseDate: string;
  assignedDate: string;
  projectName?: string;
  departmentName?: string;
}

export function AssetAllocationReport() {
  const { user } = useAuth();
  const [assets, setAssets] = useState<AssetAllocation[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<AssetAllocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<number | undefined>(undefined);
  const [conditionFilter, setConditionFilter] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [projectFilter, setProjectFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadAssetAllocationData();
  }, []);

  useEffect(() => {
    filterAssets();
  }, [assets, searchTerm, statusFilter, conditionFilter, categoryFilter, projectFilter]);

  const loadAssetAllocationData = async () => {
    try {
      setLoading(true);
      
      // Load all assets with pagination
      const response = await assetService.getAssets({
        pageNumber: 1,
        pageSize: 1000, // Get all assets for the report
        sortBy: 'createdAt',
        sortDirection: 'desc',
      });

      const mappedAssets: AssetAllocation[] = response.items.map((asset: Asset) => ({
        id: asset.id,
        assetTag: asset.assetTag,
        assetName: asset.name,
        item: asset.item?.name || asset.name,
        category: asset.item?.category?.name || "Unknown",
        serialNumber: asset.serialNumber || "",
        assignedTo: asset.assignedTo ? `${asset.assignedTo.firstName} ${asset.assignedTo.lastName}` : "Unassigned",
        status: asset.status,
        condition: asset.condition,
        purchaseDate: asset.purchaseDate ? new Date(asset.purchaseDate).toISOString().split("T")[0] : "",
        assignedDate: asset.assignedDate ? new Date(asset.assignedDate).toISOString().split("T")[0] : "",
        projectName: asset.project?.name,
        departmentName: asset.assignedTo?.department?.name,
      }));

      setAssets(mappedAssets);
      toast.success(`Loaded ${mappedAssets.length} assets for report`);
    } catch (error) {
      const errorMessage = ErrorHandler.showError(error as Error, 'AssetAllocationReport');
      toast.error(errorMessage);
      console.error("Error loading asset allocation data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterAssets = () => {
    let filtered = assets;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(asset =>
        asset.assetTag.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.assetName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.assignedTo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.projectName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== undefined) {
      filtered = filtered.filter(asset => asset.status === statusFilter);
    }

    // Condition filter
    if (conditionFilter) {
      filtered = filtered.filter(asset => asset.condition === conditionFilter);
    }

    // Category filter
    if (categoryFilter) {
      filtered = filtered.filter(asset => asset.category === categoryFilter);
    }

    // Project filter
    if (projectFilter) {
      filtered = filtered.filter(asset => asset.projectName === projectFilter);
    }

    setFilteredAssets(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const getStatusColor = (status: number) => {
    switch (status) {
      case 1: // Available
        return "bg-blue-100 text-blue-800";
      case 2: // Assigned
        return "bg-green-100 text-green-800";
      case 3: // Maintenance
        return "bg-yellow-100 text-yellow-800";
      case 4: // Retired
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: number) => {
    switch (status) {
      case 1: return "Available";
      case 2: return "Assigned";
      case 3: return "Maintenance";
      case 4: return "Retired";
      default: return "Unknown";
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case "excellent":
        return "bg-green-100 text-green-800";
      case "good":
        return "bg-blue-100 text-blue-800";
      case "fair":
        return "bg-yellow-100 text-yellow-800";
      case "poor":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handlePrint = useReactToPrint({
    contentRef: reportRef,
    documentTitle: `Asset Allocation Report - ${new Date().toLocaleDateString()}`,
  });

  const handleExport = () => {
    const csvContent = [
      ["Asset Tag", "Asset Name", "Item", "Category", "Serial Number", "Assigned To", "Status", "Condition", "Project", "Department", "Purchase Date", "Assigned Date"],
      ...filteredAssets.map(asset => [
        asset.assetTag,
        asset.assetName,
        asset.item,
        asset.category,
        asset.serialNumber,
        asset.assignedTo,
        getStatusLabel(asset.status),
        asset.condition,
        asset.projectName || "",
        asset.departmentName || "",
        asset.purchaseDate,
        asset.assignedDate,
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `asset-allocation-report-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success("Asset allocation report exported successfully");
  };

  // Pagination
  const totalPages = Math.ceil(filteredAssets.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedAssets = filteredAssets.slice(startIndex, endIndex);

  // Get unique values for filters
  const categories = [...new Set(assets.map(asset => asset.category))];
  const projects = [...new Set(assets.map(asset => asset.projectName).filter(Boolean))];
  const conditions = [...new Set(assets.map(asset => asset.condition))];

  // Statistics
  const totalAssets = assets.length;
  const assignedAssets = assets.filter(asset => asset.status === 2).length;
  const availableAssets = assets.filter(asset => asset.status === 1).length;
  const maintenanceAssets = assets.filter(asset => asset.status === 3).length;
  const retiredAssets = assets.filter(asset => asset.status === 4).length;
  const utilizationRate = totalAssets > 0 ? Math.round((assignedAssets / totalAssets) * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600 mx-auto mb-4"></div>
          <div className="text-muted-foreground">Loading asset allocation data...</div>
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
            <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAssets}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned</CardTitle>
            <div className="h-2 w-2 bg-green-500 rounded-full"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{assignedAssets}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
            <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{availableAssets}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Maintenance</CardTitle>
            <div className="h-2 w-2 bg-yellow-500 rounded-full"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{maintenanceAssets}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Retired</CardTitle>
            <div className="h-2 w-2 bg-gray-500 rounded-full"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{retiredAssets}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilization</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
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
            <CardTitle>Asset Allocation Report</CardTitle>
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
                placeholder="Search assets..."
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
              <option value="2">Assigned</option>
              <option value="1">Available</option>
              <option value="3">Maintenance</option>
              <option value="4">Retired</option>
            </select>
            
            <select
              value={conditionFilter}
              onChange={(e) => setConditionFilter(e.target.value)}
              className="px-3 py-2 border border-input rounded-md bg-background cursor-pointer"
            >
              <option value="">All Conditions</option>
              {conditions.map(condition => (
                <option key={condition} value={condition}>{condition}</option>
              ))}
            </select>
            
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-input rounded-md bg-background cursor-pointer"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
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
                Showing {filteredAssets.length} of {totalAssets} assets
              </p>
            </div>
            
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Asset Tag</TableHead>
                    <TableHead>Asset Name</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Serial Number</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Condition</TableHead>
                    <TableHead className="print:hidden">Project</TableHead>
                    <TableHead className="print:hidden">Department</TableHead>
                    <TableHead className="print:hidden">Purchase Date</TableHead>
                    <TableHead className="print:hidden">Assigned Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedAssets.map((asset) => (
                    <TableRow key={asset.id}>
                      <TableCell className="font-medium">{asset.assetTag}</TableCell>
                      <TableCell>{asset.assetName}</TableCell>
                      <TableCell>{asset.item}</TableCell>
                      <TableCell>{asset.category}</TableCell>
                      <TableCell>{asset.serialNumber}</TableCell>
                      <TableCell>{asset.assignedTo}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(asset.status)}>
                          {getStatusLabel(asset.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getConditionColor(asset.condition)}>
                          {asset.condition}
                        </Badge>
                      </TableCell>
                      <TableCell className="print:hidden">{asset.projectName || "-"}</TableCell>
                      <TableCell className="print:hidden">{asset.departmentName || "-"}</TableCell>
                      <TableCell className="print:hidden">{asset.purchaseDate}</TableCell>
                      <TableCell className="print:hidden">{asset.assignedDate}</TableCell>
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
