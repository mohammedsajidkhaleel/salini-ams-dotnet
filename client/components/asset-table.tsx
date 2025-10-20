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
import { Edit, Trash2, Search, Plus, Eye, Upload } from "lucide-react";
import { Pagination } from "./ui/pagination";
import { ProjectFilter } from "./project-filter";

interface Asset {
  id: string;
  assetTag: string;
  assetName: string;
  serialNumber: string;
  item: string;
  assignedEmployee: string; // This contains the employee ID
  assignedEmployeeDisplay?: string; // This contains the display string
  project?: string; // This contains the project ID for the form
  status: "available" | "assigned" | "maintenance" | "retired";
  condition: "excellent" | "good" | "fair" | "poor";
  poNumber: string;
  description: string;
  project_id?: string;
  project_name?: string;
}

interface AssetTableProps {
  assets: Asset[];
  onEdit: (asset: Asset) => void;
  onDelete: (asset: Asset) => void;
  onAdd: () => void;
  onView: (asset: Asset) => void;
  onImport: () => void;
}

export function AssetTable({
  assets,
  onEdit,
  onDelete,
  onAdd,
  onView,
  onImport,
}: AssetTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterItem, setFilterItem] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterProject, setFilterProject] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const filteredAssets = assets.filter((asset) => {
    const matchesSearch =
      asset.assetName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.assetTag.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (asset.assignedEmployeeDisplay || asset.assignedEmployee || "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchesItem = !filterItem || asset.item === filterItem;
    const matchesStatus = !filterStatus || asset.status === filterStatus;
    const matchesProject = filterProject === "all" || asset.project_id === filterProject;

    // Debug logging for project filtering
    if (filterProject !== "all") {
      console.log('Asset filtering debug:', {
        assetName: asset.assetName,
        assetProjectId: asset.project_id,
        filterProject,
        matchesProject,
        projectName: asset.project_name
      });
    }

    return matchesSearch && matchesItem && matchesStatus && matchesProject;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredAssets.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedAssets = filteredAssets.slice(startIndex, endIndex);

  // Reset to first page when filters change
  const handleFilterChange = (
    newFilter: string,
    setter: (value: string) => void
  ) => {
    setter(newFilter);
    setCurrentPage(1);
  };

  const items = [...new Set(assets.map((asset) => asset.item))];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "default";
      case "assigned":
        return "secondary";
      case "maintenance":
        return "destructive";
      case "retired":
        return "outline";
      default:
        return "default";
    }
  };

  const getConditionColor = (condition: string) => {
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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Assets ({filteredAssets.length})</CardTitle>
          <div className="flex gap-2">
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
              onChange={(e) =>
                handleFilterChange(e.target.value, setSearchTerm)
              }
              className="pl-10"
            />
          </div>
          <select
            value={filterItem}
            onChange={(e) => handleFilterChange(e.target.value, setFilterItem)}
            className="px-3 py-2 border border-input rounded-md bg-background cursor-pointer"
          >
            <option value="">All Items</option>
            {items.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) =>
              handleFilterChange(e.target.value, setFilterStatus)
            }
            className="px-3 py-2 border border-input rounded-md bg-background cursor-pointer"
          >
            <option value="">All Status</option>
            <option value="available">Available</option>
            <option value="assigned">Assigned</option>
            <option value="maintenance">Maintenance</option>
            <option value="retired">Retired</option>
          </select>
          <ProjectFilter
            selectedProjectId={filterProject}
            onProjectChange={(projectId) => handleFilterChange(projectId, setFilterProject)}
            className="min-w-[200px]"
          />
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
                <TableCell>{asset.assetName}</TableCell>
                <TableCell>{asset.serialNumber}</TableCell>
                <TableCell>{asset.item}</TableCell>
                <TableCell>
                  <Badge variant={getStatusColor(asset.status)}>
                    {asset.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={getConditionColor(asset.condition)}>
                    {asset.condition}
                  </Badge>
                </TableCell>
                <TableCell>{asset.assignedEmployeeDisplay || asset.assignedEmployee || "-"}</TableCell>
                <TableCell>{asset.project_name || "N/A"}</TableCell>
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
        {filteredAssets.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No assets found matching your criteria.
          </div>
        )}

        {filteredAssets.length > 0 && (
          <div className="mt-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              itemsPerPage={itemsPerPage}
              totalItems={filteredAssets.length}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
