"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Package, AlertTriangle, CheckCircle } from "lucide-react";
import { Pagination } from "./ui/pagination";

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  brand: string;
  model: string;
  totalPurchased: number;
  totalAllocated: number;
  availableCount: number;
  status: "in-stock" | "low-stock" | "out-of-stock";
  lastPurchaseDate: string;
  vendor: string;
  projectName?: string;
}

interface InventoryTableProps {
  inventoryItems: InventoryItem[];
}

export function InventoryTable({ inventoryItems }: InventoryTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const filteredItems = inventoryItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.model.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = !categoryFilter || item.category === categoryFilter;
    const matchesStatus = !statusFilter || item.status === statusFilter;
    const matchesProject = !projectFilter || item.projectName === projectFilter;

    return matchesSearch && matchesCategory && matchesStatus && matchesProject;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = filteredItems.slice(startIndex, endIndex);

  // Reset to first page when filters change
  const handleFilterChange = (
    newFilter: string,
    setter: (value: string) => void
  ) => {
    setter(newFilter);
    setCurrentPage(1);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "in-stock":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "low-stock":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "out-of-stock":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      "in-stock": "default",
      "low-stock": "secondary",
      "out-of-stock": "destructive",
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || "default"}>
        {status.replace("-", " ").toUpperCase()}
      </Badge>
    );
  };

  const categories = [...new Set(inventoryItems.map((item) => item.category))];
  const projects = [...new Set(inventoryItems.map((item) => item.projectName).filter(Boolean))];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Active Inventory
        </CardTitle>

        {/* Filters */}
        <div className="flex gap-4 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) =>
                handleFilterChange(e.target.value, setSearchTerm)
              }
              className="pl-10"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) =>
              handleFilterChange(e.target.value, setCategoryFilter)
            }
            className="px-3 py-2 border border-input rounded-md bg-background"
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <select
            value={projectFilter}
            onChange={(e) =>
              handleFilterChange(e.target.value, setProjectFilter)
            }
            className="px-3 py-2 border border-input rounded-md bg-background"
          >
            <option value="">All Projects</option>
            {projects.map((project) => (
              <option key={project} value={project}>
                {project}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) =>
              handleFilterChange(e.target.value, setStatusFilter)
            }
            className="px-3 py-2 border border-input rounded-md bg-background"
          >
            <option value="">All Status</option>
            <option value="in-stock">In Stock</option>
            <option value="low-stock">Low Stock</option>
            <option value="out-of-stock">Out of Stock</option>
          </select>
        </div>
      </CardHeader>

      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3 font-medium">Item</th>
                <th className="text-left p-3 font-medium">Category</th>
                <th className="text-left p-3 font-medium">Project</th>
                <th className="text-center p-3 font-medium">Purchased</th>
                <th className="text-center p-3 font-medium">Allocated</th>
                <th className="text-center p-3 font-medium">Available</th>
                <th className="text-center p-3 font-medium">Status</th>
                <th className="text-left p-3 font-medium">Last Purchase</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.map((item) => (
                <tr key={item.id} className="border-b hover:bg-muted/50">
                  <td className="p-3">
                    <div>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {item.brand} {item.model}
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <Badge variant="outline">{item.category}</Badge>
                  </td>
                  <td className="p-3">
                    <Badge variant="secondary">{item.projectName || "No Project"}</Badge>
                  </td>
                  <td className="p-3 text-center font-medium">
                    {item.totalPurchased}
                  </td>
                  <td className="p-3 text-center">{item.totalAllocated}</td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {getStatusIcon(item.status)}
                      <span className="font-medium">{item.availableCount}</span>
                    </div>
                  </td>
                  <td className="p-3 text-center">
                    {getStatusBadge(item.status)}
                  </td>
                  <td className="p-3 text-sm text-muted-foreground">
                    {item.lastPurchaseDate}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredItems.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No inventory items found matching your criteria.
            </div>
          )}

          {filteredItems.length > 0 && (
            <div className="mt-4">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                itemsPerPage={itemsPerPage}
                totalItems={filteredItems.length}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
