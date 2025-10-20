"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Printer, Search, Shield, AlertTriangle, Calendar, DollarSign } from "lucide-react";
import { useReactToPrint } from "react-to-print";
import { useRef } from "react";
import { useAuth } from "@/contexts/auth-context-new";
import { softwareLicenseService, type SoftwareLicense } from "@/lib/services";
import { toast } from "@/lib/toast";
import { ErrorHandler } from "@/lib/errorHandler";

interface SoftwareLicenseReportData {
  id: string;
  softwareName: string;
  licenseKey: string;
  licenseType: string;
  seats: number;
  vendor: string;
  purchaseDate: string;
  expiryDate: string;
  cost: number;
  status: number;
  project: string;
  createdAt: string;
}

export function SoftwareLicenseReport() {
  const { user } = useAuth();
  const [licenses, setLicenses] = useState<SoftwareLicenseReportData[]>([]);
  const [filteredLicenses, setFilteredLicenses] = useState<SoftwareLicenseReportData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<number | undefined>(undefined);
  const [vendorFilter, setVendorFilter] = useState<string>("");
  const [projectFilter, setProjectFilter] = useState<string>("");
  const [expiringSoonFilter, setExpiringSoonFilter] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadSoftwareLicenseData();
  }, []);

  useEffect(() => {
    filterLicenses();
  }, [licenses, searchTerm, statusFilter, vendorFilter, projectFilter, expiringSoonFilter]);

  const loadSoftwareLicenseData = async () => {
    try {
      setLoading(true);
      
      const response = await softwareLicenseService.getSoftwareLicenses({
        pageNumber: 1,
        pageSize: 1000, // Get all licenses for the report
        sortBy: 'createdAt',
        sortDirection: 'desc',
      });

      const mappedLicenses: SoftwareLicenseReportData[] = response.items.map((license: SoftwareLicense) => ({
        id: license.id,
        softwareName: license.softwareName,
        licenseKey: license.licenseKey || "",
        licenseType: license.licenseType || "Unknown",
        seats: license.seats || 0,
        vendor: license.vendor || "Unknown",
        purchaseDate: license.purchaseDate ? new Date(license.purchaseDate).toISOString().split("T")[0] : "",
        expiryDate: license.expiryDate ? new Date(license.expiryDate).toISOString().split("T")[0] : "",
        cost: license.cost || 0,
        status: license.status,
        project: license.project?.name || "Unassigned",
        createdAt: new Date(license.createdAt).toISOString().split("T")[0],
      }));

      setLicenses(mappedLicenses);
      toast.success(`Loaded ${mappedLicenses.length} software licenses for report`);
    } catch (error) {
      const errorMessage = ErrorHandler.showError(error as Error, 'SoftwareLicenseReport');
      toast.error(errorMessage);
      console.error("Error loading software license data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterLicenses = () => {
    let filtered = licenses;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(license =>
        license.softwareName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        license.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        license.licenseKey.toLowerCase().includes(searchTerm.toLowerCase()) ||
        license.project.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== undefined) {
      filtered = filtered.filter(license => license.status === statusFilter);
    }

    // Vendor filter
    if (vendorFilter) {
      filtered = filtered.filter(license => license.vendor === vendorFilter);
    }

    // Project filter
    if (projectFilter) {
      filtered = filtered.filter(license => license.project === projectFilter);
    }

    // Expiring soon filter
    if (expiringSoonFilter) {
      const today = new Date();
      const ninetyDaysFromNow = new Date(today.getTime() + (90 * 24 * 60 * 60 * 1000));
      
      filtered = filtered.filter(license => {
        if (!license.expiryDate) return false;
        const expiryDate = new Date(license.expiryDate);
        return expiryDate <= ninetyDaysFromNow && expiryDate > today;
      });
    }

    setFilteredLicenses(filtered);
    setCurrentPage(1);
  };

  const getStatusColor = (status: number) => {
    switch (status) {
      case 1: // Active
        return "bg-green-100 text-green-800";
      case 2: // Expired
        return "bg-red-100 text-red-800";
      case 3: // Suspended
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: number) => {
    switch (status) {
      case 1: return "Active";
      case 2: return "Expired";
      case 3: return "Suspended";
      default: return "Unknown";
    }
  };

  const getExpiryStatus = (expiryDate: string) => {
    if (!expiryDate) return { status: "unknown", color: "bg-gray-100 text-gray-800", label: "No Expiry" };
    
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) {
      return { status: "expired", color: "bg-red-100 text-red-800", label: "Expired" };
    } else if (daysUntilExpiry <= 30) {
      return { status: "expiring", color: "bg-red-100 text-red-800", label: "Expires Soon" };
    } else if (daysUntilExpiry <= 90) {
      return { status: "warning", color: "bg-yellow-100 text-yellow-800", label: "Expires Soon" };
    } else {
      return { status: "active", color: "bg-green-100 text-green-800", label: "Active" };
    }
  };

  const handlePrint = useReactToPrint({
    contentRef: reportRef,
    documentTitle: `Software License Report - ${new Date().toLocaleDateString()}`,
  });

  const handleExport = () => {
    const csvContent = [
      ["Software Name", "License Key", "Type", "Seats", "Vendor", "Purchase Date", "Expiry Date", "Cost", "Status", "Project", "Created Date"],
      ...filteredLicenses.map(license => [
        license.softwareName,
        license.licenseKey,
        license.licenseType,
        license.seats.toString(),
        license.vendor,
        license.purchaseDate,
        license.expiryDate,
        license.cost.toString(),
        getStatusLabel(license.status),
        license.project,
        license.createdAt,
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `software-license-report-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success("Software license report exported successfully");
  };

  // Pagination
  const totalPages = Math.ceil(filteredLicenses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedLicenses = filteredLicenses.slice(startIndex, endIndex);

  // Get unique values for filters
  const vendors = [...new Set(licenses.map(license => license.vendor))];
  const projects = [...new Set(licenses.map(license => license.project))];

  // Statistics
  const totalLicenses = licenses.length;
  const activeLicenses = licenses.filter(license => license.status === 1).length;
  const expiredLicenses = licenses.filter(license => license.status === 2).length;
  const totalSeats = licenses.reduce((sum, license) => sum + license.seats, 0);
  const totalCost = licenses.reduce((sum, license) => sum + license.cost, 0);
  
  // Expiring soon calculation
  const today = new Date();
  const ninetyDaysFromNow = new Date(today.getTime() + (90 * 24 * 60 * 60 * 1000));
  const expiringSoon = licenses.filter(license => {
    if (!license.expiryDate) return false;
    const expiryDate = new Date(license.expiryDate);
    return expiryDate <= ninetyDaysFromNow && expiryDate > today;
  }).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600 mx-auto mb-4"></div>
          <div className="text-muted-foreground">Loading software license data...</div>
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
            <CardTitle className="text-sm font-medium">Total Licenses</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLicenses}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <div className="h-2 w-2 bg-green-500 rounded-full"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeLicenses}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expired</CardTitle>
            <div className="h-2 w-2 bg-red-500 rounded-full"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{expiredLicenses}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{expiringSoon}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Seats</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{totalSeats}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">${totalCost.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Software License Report</CardTitle>
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
                placeholder="Search software licenses..."
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
              <option value="2">Expired</option>
              <option value="3">Suspended</option>
            </select>
            
            <select
              value={vendorFilter}
              onChange={(e) => setVendorFilter(e.target.value)}
              className="px-3 py-2 border border-input rounded-md bg-background cursor-pointer"
            >
              <option value="">All Vendors</option>
              {vendors.map(vendor => (
                <option key={vendor} value={vendor}>{vendor}</option>
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
            
            <Button
              variant={expiringSoonFilter ? "default" : "outline"}
              onClick={() => setExpiringSoonFilter(!expiringSoonFilter)}
              className="flex items-center gap-2"
            >
              <AlertTriangle className="h-4 w-4" />
              Expiring Soon
            </Button>
          </div>

          {/* Report Table */}
          <div ref={reportRef} className="print:max-w-none print:w-full">
            <div className="print:hidden mb-4">
              <p className="text-sm text-muted-foreground">
                Showing {filteredLicenses.length} of {totalLicenses} software licenses
              </p>
            </div>
            
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Software Name</TableHead>
                    <TableHead>License Key</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Seats</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Expiry Status</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead className="print:hidden">Purchase Date</TableHead>
                    <TableHead className="print:hidden">Expiry Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedLicenses.map((license) => {
                    const expiryStatus = getExpiryStatus(license.expiryDate);
                    return (
                      <TableRow key={license.id}>
                        <TableCell className="font-medium">{license.softwareName}</TableCell>
                        <TableCell className="font-mono text-xs">{license.licenseKey}</TableCell>
                        <TableCell>{license.licenseType}</TableCell>
                        <TableCell>{license.seats}</TableCell>
                        <TableCell>{license.vendor}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(license.status)}>
                            {getStatusLabel(license.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={expiryStatus.color}>
                            {expiryStatus.label}
                          </Badge>
                        </TableCell>
                        <TableCell>${license.cost.toLocaleString()}</TableCell>
                        <TableCell>{license.project}</TableCell>
                        <TableCell className="print:hidden">{license.purchaseDate}</TableCell>
                        <TableCell className="print:hidden">{license.expiryDate}</TableCell>
                      </TableRow>
                    );
                  })}
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
