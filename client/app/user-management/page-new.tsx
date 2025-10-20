"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { UserTable } from "@/components/user-table";
import { UserForm } from "@/components/user-form";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Users, UserCheck, UserX, Shield, Search, Download, Upload } from "lucide-react";
import { ProtectedRoute } from "@/components/protected-route";
import { LayoutWrapper } from "@/components/layout-wrapper";
import { useAuth } from "@/contexts/auth-context-new";
import { userManagementService, type User } from "@/lib/services";
import { toast } from "@/lib/toast";
import { ErrorHandler } from "@/lib/errorHandler";

export default function UserManagementPage() {
  const { user: currentUser, isAuthenticated } = useAuth();
  const isAdmin = currentUser?.role === 'SuperAdmin' || currentUser?.role === 'Admin' || currentUser?.permissions?.includes('users.create');
  
  const [users, setUsers] = useState<User[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | undefined>();
  const [loading, setLoading] = useState(true);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    user: User | null;
  }>({ isOpen: false, user: null });

  // Pagination state
  const [pagination, setPagination] = useState({
    pageNumber: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 0,
  });

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      loadUsers();
    }
  }, [isAuthenticated, isAdmin, pagination.pageNumber, pagination.pageSize, searchTerm, roleFilter, statusFilter]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      
      const response = await userManagementService.getUsers({
        pageNumber: pagination.pageNumber,
        pageSize: pagination.pageSize,
        search: searchTerm || undefined,
        role: roleFilter || undefined,
        isActive: statusFilter,
        sortBy: 'createdAt',
        sortDirection: 'desc',
      });

      setUsers(response.items);
      setPagination({
        pageNumber: response.pageNumber,
        pageSize: response.pageSize,
        totalCount: response.totalCount,
        totalPages: response.totalPages,
      });

      toast.success(`Loaded ${response.items.length} users`);
    } catch (error) {
      const errorMessage = ErrorHandler.showError(error as Error, 'UserManagementPage');
      toast.error(errorMessage);
      console.error("Error loading users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = () => {
    setEditingUser(undefined);
    setIsFormOpen(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setIsFormOpen(true);
  };

  const handleSubmitUser = async (userData: Omit<User, "id" | "createdAt" | "updatedAt">) => {
    try {
      if (editingUser) {
        console.log('Updating user with data:', userData); // Debug log
        console.log('Project IDs being sent:', userData.projectIds); // Debug log
        
        // Update existing user (without projects first)
        const updatedUser = await userManagementService.updateUser(editingUser.id, {
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          role: userData.role,
          department: userData.department,
          isActive: userData.isActive,
          permissions: userData.permissions,
        });
        
        console.log('User updated successfully:', updatedUser); // Debug log
        
        // Update user projects separately if projectIds are provided
        if (userData.projectIds && userData.projectIds.length >= 0) {
          console.log('Updating user projects separately:', userData.projectIds); // Debug log
          await userManagementService.updateUserProjects(editingUser.id, userData.projectIds);
          console.log('User projects updated successfully'); // Debug log
        }
        
        setUsers(prev => prev.map(user => user.id === editingUser.id ? updatedUser : user));
        
        toast.success(`${updatedUser.firstName} ${updatedUser.lastName} has been updated successfully.`);
      } else {
        // Create new user
        const newUser = await userManagementService.createUser({
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          password: userData.password || "TempPassword123!", // Default password
          role: userData.role,
          department: userData.department,
          isActive: userData.isActive,
          permissions: userData.permissions,
          projectIds: userData.projectIds,
        });
        
        setUsers(prev => [newUser, ...prev]);
        toast.success(`${newUser.firstName} ${newUser.lastName} has been created successfully.`);
      }
      
      setIsFormOpen(false);
      setEditingUser(undefined);
    } catch (error) {
      const errorMessage = ErrorHandler.showError(error as Error, 'UserManagementPage');
      toast.error(errorMessage);
    }
  };

  const handleDeleteUser = (user: User) => {
    setDeleteConfirmation({ isOpen: true, user });
  };

  const confirmDelete = async () => {
    if (!deleteConfirmation.user) return;
    
    try {
      await userManagementService.deleteUser(deleteConfirmation.user.id);
      
      setUsers(prev => prev.filter(user => user.id !== deleteConfirmation.user!.id));
      
      toast.success(`${deleteConfirmation.user.firstName} ${deleteConfirmation.user.lastName} has been deleted successfully.`);
      setDeleteConfirmation({ isOpen: false, user: null });
    } catch (error) {
      const errorMessage = ErrorHandler.showError(error as Error, 'UserManagementPage');
      toast.error(errorMessage);
    }
  };

  const handleToggleStatus = async (userId: string) => {
    try {
      const user = users.find((u) => u.id === userId);
      const newStatus = !user?.isActive;
      
      const updatedUser = await userManagementService.updateUserStatus(userId, newStatus);
      
      setUsers(prev => prev.map(u => u.id === userId ? updatedUser : u));
      
      toast.success(`${user?.firstName} ${user?.lastName} has been ${newStatus ? "activated" : "deactivated"}.`);
    } catch (error) {
      const errorMessage = ErrorHandler.showError(error as Error, 'UserManagementPage');
      toast.error(errorMessage);
    }
  };

  const handleResetPassword = async (userId: string) => {
    try {
      const user = users.find((u) => u.id === userId);
      const newPassword = Math.random().toString(36).slice(-8); // Generate random password
      
      await userManagementService.resetUserPassword(userId, newPassword);
      
      toast.success(`Password has been reset for ${user?.firstName} ${user?.lastName}. New password: ${newPassword}`);
    } catch (error) {
      const errorMessage = ErrorHandler.showError(error as Error, 'UserManagementPage');
      toast.error(errorMessage);
    }
  };

  const handleSearch = (search: string) => {
    setSearchTerm(search);
    setPagination(prev => ({ ...prev, pageNumber: 1 }));
  };

  const handleRoleFilter = (role: string) => {
    setRoleFilter(role);
    setPagination(prev => ({ ...prev, pageNumber: 1 }));
  };

  const handleStatusFilter = (status: boolean | undefined) => {
    setStatusFilter(status);
    setPagination(prev => ({ ...prev, pageNumber: 1 }));
  };

  const handlePageChange = (pageNumber: number) => {
    setPagination(prev => ({ ...prev, pageNumber }));
  };

  const handlePageSizeChange = (pageSize: number) => {
    setPagination(prev => ({ ...prev, pageSize, pageNumber: 1 }));
  };

  const handleExportUsers = async () => {
    try {
      const blob = await userManagementService.exportUsers({
        pageNumber: 1,
        pageSize: 1000, // Export all
      });
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Users exported successfully');
    } catch (error) {
      toast.error('Failed to export users');
      console.error('Export error:', error);
    }
  };

  const stats = {
    total: pagination.totalCount,
    active: users.filter((u) => u.isActive).length,
    inactive: users.filter((u) => !u.isActive).length,
    admins: users.filter((u) => u.role === 'SuperAdmin' || u.role === 'Admin').length,
  };

  // Check if user has permission to access this page
  if (!isAuthenticated || !isAdmin) {
    return (
      <ProtectedRoute>
        <LayoutWrapper title="User Management" description="Manage system users, roles, and permissions">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
              <p className="text-muted-foreground">
                You don't have permission to access user management. Please contact your administrator.
              </p>
            </div>
          </div>
        </LayoutWrapper>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <LayoutWrapper title="User Management" description="Manage system users, roles, and permissions">
        <div className="space-y-6">
          {/* Search and Filter Controls */}
          <div className="flex gap-4 items-center flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
            
            <select
              value={roleFilter}
              onChange={(e) => handleRoleFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="">All Roles</option>
              <option value="SuperAdmin">Super Admin</option>
              <option value="Admin">Admin</option>
              <option value="User">User</option>
            </select>
            
            <select
              value={statusFilter === undefined ? "" : statusFilter.toString()}
              onChange={(e) => handleStatusFilter(e.target.value === "" ? undefined : e.target.value === "true")}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportUsers}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
            <Button onClick={handleAddUser} className="bg-cyan-600 hover:bg-cyan-700 cursor-pointer">
              <Plus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <UserCheck className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.active}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Inactive Users</CardTitle>
                <UserX className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.inactive}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Administrators</CardTitle>
                <Shield className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.admins}</div>
              </CardContent>
            </Card>
          </div>

          {/* User Table */}
          <UserTable
            users={users}
            onEdit={handleEditUser}
            onDelete={handleDeleteUser}
            onToggleStatus={handleToggleStatus}
            onResetPassword={handleResetPassword}
            loading={loading}
            pagination={pagination}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />

          {/* User Form Dialog */}
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingUser ? "Edit User" : "Add New User"}</DialogTitle>
              </DialogHeader>
              <UserForm 
                key={editingUser?.id || 'new'} 
                user={editingUser} 
                onSubmit={handleSubmitUser} 
                onCancel={() => setIsFormOpen(false)} 
              />
            </DialogContent>
          </Dialog>

          {/* Delete Confirmation Dialog */}
          <ConfirmationDialog
            isOpen={deleteConfirmation.isOpen}
            onClose={() => setDeleteConfirmation({ isOpen: false, user: null })}
            onConfirm={confirmDelete}
            title="Delete User"
            description={`Are you sure you want to delete user "${deleteConfirmation.user?.firstName} ${deleteConfirmation.user?.lastName}" (${deleteConfirmation.user?.email})? This action cannot be undone.`}
            confirmText="Delete"
            cancelText="Cancel"
            variant="destructive"
          />
        </div>
      </LayoutWrapper>
    </ProtectedRoute>
  );
}
