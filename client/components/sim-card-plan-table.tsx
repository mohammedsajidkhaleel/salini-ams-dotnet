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

interface SimCardPlan {
  id: string;
  name: string;
  description?: string;
  data_limit?: string;
  monthly_fee?: number;
  provider_id: string;
  is_active: boolean;
  provider_name?: string;
}

interface SimProvider {
  id: string;
  name: string;
}

interface SimCardPlanTableProps {
  simCardPlans: SimCardPlan[];
  providers: SimProvider[];
  onEdit: (simCardPlan: SimCardPlan) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
  onView: (simCardPlan: SimCardPlan) => void;
}

export function SimCardPlanTable({
  simCardPlans,
  providers,
  onEdit,
  onDelete,
  onAdd,
  onView,
}: SimCardPlanTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterProvider, setFilterProvider] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const filteredSimCardPlans = simCardPlans.filter((plan) => {
    const matchesSearch =
      plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plan.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plan.data_limit?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plan.provider_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesProvider = !filterProvider || plan.provider_id === filterProvider;
    const matchesStatus = !filterStatus || 
      (filterStatus === "active" && plan.is_active) ||
      (filterStatus === "inactive" && !plan.is_active);

    return matchesSearch && matchesProvider && matchesStatus;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredSimCardPlans.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPlans = filteredSimCardPlans.slice(startIndex, endIndex);

  // Reset to first page when filters change
  const handleFilterChange = (
    newFilter: string,
    setter: (value: string) => void
  ) => {
    setter(newFilter);
    setCurrentPage(1);
  };

  const formatCurrency = (amount?: number) => {
    if (amount === null || amount === undefined) return "N/A";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "SAR",
    }).format(amount);
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? "default" : "secondary";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>SIM Card Plans ({filteredSimCardPlans.length})</CardTitle>
          <Button onClick={onAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Add Plan
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search plans..."
              value={searchTerm}
              onChange={(e) =>
                handleFilterChange(e.target.value, setSearchTerm)
              }
              className="pl-10"
            />
          </div>
          <select
            value={filterProvider}
            onChange={(e) =>
              handleFilterChange(e.target.value, setFilterProvider)
            }
            className="px-3 py-2 border border-input rounded-md bg-background cursor-pointer"
          >
            <option value="">All Providers</option>
            {providers.map((provider) => (
              <option key={provider.id} value={provider.id}>
                {provider.name}
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
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Plan Name</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Data Limit</TableHead>
              <TableHead>Monthly Fee</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedPlans.map((plan) => (
              <TableRow key={plan.id}>
                <TableCell className="font-medium">{plan.name}</TableCell>
                <TableCell>{plan.provider_name || "N/A"}</TableCell>
                <TableCell>{plan.data_limit || "N/A"}</TableCell>
                <TableCell>{formatCurrency(plan.monthly_fee)}</TableCell>
                <TableCell>
                  <Badge variant={getStatusColor(plan.is_active)}>
                    {plan.is_active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-xs truncate">
                  {plan.description || "-"}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onView(plan)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(plan)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(plan.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {filteredSimCardPlans.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No SIM card plans found matching your criteria.
          </div>
        )}

        {filteredSimCardPlans.length > 0 && (
          <div className="mt-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              itemsPerPage={itemsPerPage}
              totalItems={filteredSimCardPlans.length}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
