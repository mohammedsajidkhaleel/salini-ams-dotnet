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
import { Edit, Trash2, Search, Plus, Eye } from "lucide-react";
import { Pagination } from "./ui/pagination";

interface PurchaseOrderItem {
  id: string;
  itemId: string;
  itemName: string;
  quantity: number;
  description: string;
}

interface PurchaseOrder {
  id: string;
  poNumber: string;
  purchaseDate: string;
  description: string;
  requestedBy: string;
  supplierId: string;
  supplierName: string;
  projectId?: string;
  projectName?: string;
  items: PurchaseOrderItem[];
  itemCount: number;
  notes: string;
  approvedBy: string;
  approvedDate: string;
}

interface PurchaseOrderTableProps {
  purchaseOrders: PurchaseOrder[];
  onEdit: (purchaseOrder: PurchaseOrder) => void;
  onDelete: (purchaseOrder: PurchaseOrder) => void;
  onAdd: () => void;
  onView: (purchaseOrder: PurchaseOrder) => void;
}

export function PurchaseOrderTable({
  purchaseOrders,
  onEdit,
  onDelete,
  onAdd,
  onView,
}: PurchaseOrderTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSupplier, setFilterSupplier] = useState("");
  const [filterRequester, setFilterRequester] = useState("");
  const [filterProject, setFilterProject] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const filteredOrders = purchaseOrders.filter((order) => {
    const matchesSearch =
      order.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.requestedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.projectName && order.projectName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesSupplier = !filterSupplier || order.supplierName === filterSupplier;
    const matchesRequester =
      !filterRequester || order.requestedBy === filterRequester;
    const matchesProject = !filterProject || order.projectName === filterProject;

    return matchesSearch && matchesSupplier && matchesRequester && matchesProject;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

  // Reset to first page when filters change
  const handleFilterChange = (
    newFilter: string,
    setter: (value: string) => void
  ) => {
    setter(newFilter);
    setCurrentPage(1);
  };

  const suppliers = [
    ...new Set(purchaseOrders.map((order) => order.supplierName).filter(Boolean)),
  ];

  const requesters = [
    ...new Set(purchaseOrders.map((order) => order.requestedBy).filter(Boolean)),
  ];

  const projects = [
    ...new Set(purchaseOrders.map((order) => order.projectName).filter(Boolean)),
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Purchase Orders ({filteredOrders.length})</CardTitle>
          <Button onClick={onAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Create Purchase Order
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by PO number, supplier, requester, project, or description..."
              value={searchTerm}
              onChange={(e) =>
                handleFilterChange(e.target.value, setSearchTerm)
              }
              className="pl-10"
            />
          </div>
          <select
            value={filterSupplier}
            onChange={(e) =>
              handleFilterChange(e.target.value, setFilterSupplier)
            }
            className="px-3 py-2 border border-input rounded-md bg-background cursor-pointer"
          >
            <option value="">All Suppliers</option>
            {suppliers.map((supplier) => (
              <option key={supplier} value={supplier}>
                {supplier}
              </option>
            ))}
          </select>
          <select
            value={filterRequester}
            onChange={(e) =>
              handleFilterChange(e.target.value, setFilterRequester)
            }
            className="px-3 py-2 border border-input rounded-md bg-background cursor-pointer"
          >
            <option value="">All Requesters</option>
            {requesters.map((requester) => (
              <option key={requester} value={requester}>
                {requester}
              </option>
            ))}
          </select>
          <select
            value={filterProject}
            onChange={(e) =>
              handleFilterChange(e.target.value, setFilterProject)
            }
            className="px-3 py-2 border border-input rounded-md bg-background cursor-pointer"
          >
            <option value="">All Projects</option>
            {projects.map((project) => (
              <option key={project} value={project}>
                {project}
              </option>
            ))}
          </select>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>PO Number</TableHead>
              <TableHead>Purchase Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Requested By</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Items Count</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedOrders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-medium">{order.poNumber}</TableCell>
                <TableCell>{new Date(order.purchaseDate).toLocaleDateString()}</TableCell>
                <TableCell className="max-w-xs truncate" title={order.description}>
                  {order.description}
                </TableCell>
                <TableCell>{order.requestedBy || '-'}</TableCell>
                <TableCell>{order.supplierName || '-'}</TableCell>
                <TableCell>{order.projectName || '-'}</TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {order.itemCount} item{order.itemCount !== 1 ? 's' : ''}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onView(order)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(order)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(order)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {filteredOrders.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No purchase orders found matching your criteria.
          </div>
        )}

        {filteredOrders.length > 0 && (
          <div className="mt-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              itemsPerPage={itemsPerPage}
              totalItems={filteredOrders.length}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
