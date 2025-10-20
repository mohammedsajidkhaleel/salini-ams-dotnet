"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Users,
} from "lucide-react";
import { Pagination } from "./ui/pagination";
import { SoftwareLicense } from "@/lib/softwareLicenseService";

interface SoftwareLicenseTableProps {
  licenses: SoftwareLicense[];
  onEdit: (license: SoftwareLicense) => void;
  onDelete: (license: SoftwareLicense) => void;
  onView: (license: SoftwareLicense) => void;
  onViewAssignees: (license: SoftwareLicense) => void;
  showExpiringSoonFilter?: boolean;
}

export function SoftwareLicenseTable({
  licenses,
  onEdit,
  onDelete,
  onView,
  onViewAssignees,
  showExpiringSoonFilter = false,
}: SoftwareLicenseTableProps) {
  
  // Debug logging
  console.log("SoftwareLicenseTable: Received licenses:", licenses);
  console.log("SoftwareLicenseTable: Licenses count:", licenses?.length || 0);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [vendorFilter, setVendorFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const filteredLicenses = licenses.filter((license) => {
    const matchesSearch =
      license.softwareName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      license.vendor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      license.licenseKey?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      license.poNumber?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || 
      (statusFilter === "active" && license.status === 1) ||
      (statusFilter === "inactive" && license.status === 2) ||
      (statusFilter === "expired" && license.status === 3);
    const matchesVendor =
      vendorFilter === "all" || license.vendor === vendorFilter;

    return matchesSearch && matchesStatus && matchesVendor;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredLicenses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedLicenses = filteredLicenses.slice(startIndex, endIndex);

  // Reset to first page when filters change
  const handleFilterChange = (
    newFilter: string,
    setter: (value: string) => void
  ) => {
    setter(newFilter);
    setCurrentPage(1);
  };

  const getStatusIcon = (status: number) => {
    switch (status) {
      case 1: // Active
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 3: // Expired
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 2: // Inactive
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: number) => {
    switch (status) {
      case 1: // Active
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            Active
          </Badge>
        );
      case 3: // Expired
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            Expired
          </Badge>
        );
      case 2: // Inactive
        return (
          <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
            Inactive
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const isExpiringSoon = (license: SoftwareLicense) => {
    if (!license.expiryDate) return false;
    const expiryDate = new Date(license.expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 90 && daysUntilExpiry > 0;
  };


  const uniqueVendors = [...new Set(licenses.map((l) => l.vendor))].filter(
    Boolean
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Software Licenses
          <Badge variant="outline" className="ml-2">
            {filteredLicenses.length} of {licenses.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search licenses, vendors, license keys, or PO numbers..."
              value={searchTerm}
              onChange={(e) =>
                handleFilterChange(e.target.value, setSearchTerm)
              }
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Select
              value={statusFilter}
              onValueChange={(value) =>
                handleFilterChange(value, setStatusFilter)
              }
            >
              <SelectTrigger className="w-[140px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={vendorFilter}
              onValueChange={(value) =>
                handleFilterChange(value, setVendorFilter)
              }
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Vendor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Vendors</SelectItem>
                {uniqueVendors.map((vendor) => (
                  <SelectItem key={vendor} value={vendor}>
                    {vendor}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Software</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Seats</TableHead>
                <TableHead>PO Number</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Purchase Date</TableHead>
                <TableHead>Expiry Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLicenses.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={10}
                    className="text-center py-8 text-gray-500"
                  >
                    No software licenses found
                  </TableCell>
                </TableRow>
              ) : (
                paginatedLicenses.map((license) => (
                  <TableRow key={license.id}>
                    <TableCell>
                      <div className="font-medium">{license.softwareName}</div>
                      <div className="text-sm text-gray-500">
                        {license.notes}
                      </div>
                    </TableCell>
                    <TableCell>{license.vendor || "-"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{license.licenseType || "-"}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 flex-wrap">
                        {getStatusIcon(license.status)}
                        {getStatusBadge(license.status)}
                        {isExpiringSoon(license) && (
                          <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">
                            Expiring Soon
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {license.seats || 0}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {license.poNumber || "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {license.projectName || "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      {license.purchaseDate ? (
                        <div className="text-sm">
                          {new Date(license.purchaseDate).toLocaleDateString()}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {license.expiryDate ? (
                        <div className="text-sm">
                          {new Date(license.expiryDate).toLocaleDateString()}
                        </div>
                      ) : (
                        <span className="text-gray-400">No expiry</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onView(license)}
                          className="cursor-pointer"
                          title="View details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onViewAssignees(license)}
                          className="cursor-pointer"
                          title="View assignees"
                        >
                          <Users className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(license)}
                          className="cursor-pointer"
                          title="Edit license"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(license)}
                          className="text-red-600 hover:text-red-700 cursor-pointer"
                          title="Delete license"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {filteredLicenses.length > 0 && (
          <div className="mt-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              itemsPerPage={itemsPerPage}
              totalItems={filteredLicenses.length}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
