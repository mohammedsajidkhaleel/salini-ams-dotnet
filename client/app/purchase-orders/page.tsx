"use client"

import { useState, useEffect, useRef } from "react"
import { Sidebar } from "@/components/sidebar"
import { PurchaseOrderTable } from "@/components/purchase-order-table"
import { PurchaseOrderForm } from "@/components/purchase-order-form"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { UserHeader } from "@/components/user-header"
import { ProtectedRoute } from "@/components/protected-route"
import { purchaseOrderService } from "@/lib/services/purchaseOrderService"

interface PurchaseOrderItem {
  id: string
  itemId: string
  itemName: string
  quantity: number
  description: string
}

interface PurchaseOrder {
  id: string
  poNumber: string
  purchaseDate: string
  description: string
  requestedBy: string
  requestedById: string
  supplierId: string
  supplierName: string
  projectId?: string
  projectName?: string
  items: PurchaseOrderItem[]
  itemCount: number
}


export default function PurchaseOrdersPage() {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingOrder, setEditingOrder] = useState<PurchaseOrder | undefined>()
  const [viewingOrder, setViewingOrder] = useState<PurchaseOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    order: PurchaseOrder | null;
  }>({ isOpen: false, order: null })

  // Loading guards to prevent multiple API calls
  const isLoadingRef = useRef(false)
  const hasLoadedRef = useRef(false)

  // Fetch purchase orders from database
  const fetchPurchaseOrders = async (forceRefresh = false) => {
    // Prevent multiple simultaneous calls
    if (isLoadingRef.current && !forceRefresh) {
      return
    }

    // Skip if already loaded and not forcing refresh
    if (hasLoadedRef.current && !forceRefresh) {
      setLoading(false)
      return
    }

    try {
      isLoadingRef.current = true
      setLoading(true)
      
      console.log('Fetching purchase orders from API...');
      // Project filtering is now handled automatically at the API level
      const response = await purchaseOrderService.getPurchaseOrders({
        pageNumber: 1,
        pageSize: 1000, // Get all for now
        sortBy: 'createdAt',
        sortDescending: true
      })

      console.log('API response received:', response);
      console.log('Response structure:', {
        hasItems: 'items' in response,
        itemsType: typeof response.items,
        itemsLength: response.items?.length || 0,
        firstOrder: response.items?.[0]
      });

      // Check if response has items array
      if (!response.items || !Array.isArray(response.items)) {
        console.error('Invalid response structure - items is not an array:', response);
        setPurchaseOrders([]);
        return;
      }

      // Transform the data to match our interface
      const transformedOrders: PurchaseOrder[] = response.items.map(order => {
        console.log('Processing order:', order);
        return {
          id: order.id || '',
          poNumber: order.poNumber || '',
          purchaseDate: order.poDate ? new Date(order.poDate).toISOString().split('T')[0] : '',
          description: order.notes || '',
          requestedBy: order.requestedByName || '',
          requestedById: order.requestedById || '',
          supplierId: order.supplierId || '',
          supplierName: order.supplierName || '',
          projectId: order.projectId || '',
          projectName: order.projectName || '',
          items: (order.items || []).map(item => ({
            id: item.id || '',
            itemId: item.itemId || '',
            itemName: item.itemName || '',
            quantity: item.quantity || 0,
            description: item.notes || ''
          })),
          itemCount: order.itemCount || 0
        };
      })

      console.log('Transformed orders:', transformedOrders);
      setPurchaseOrders(transformedOrders)
      hasLoadedRef.current = true
    } catch (error) {
      console.error('Error fetching purchase orders from API:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      setPurchaseOrders([])
    } finally {
      setLoading(false)
      isLoadingRef.current = false
    }
  }

  // Refresh data function
  const refreshData = () => {
    hasLoadedRef.current = false
    fetchPurchaseOrders(true)
  }

  // Load data on component mount
  useEffect(() => {
    fetchPurchaseOrders()
  }, [])

  const handleAdd = () => {
    setEditingOrder(undefined)
    setShowForm(true)
  }

  const handleEdit = async (order: PurchaseOrder) => {
    try {
      console.log('Editing purchase order:', order);
      console.log('Fetching detailed purchase order data for ID:', order.id);
      
      // Fetch detailed purchase order data
      const detailedOrder = await purchaseOrderService.getPurchaseOrderById(order.id);
      console.log('Detailed order data:', detailedOrder);
      
      // Transform the detailed data to match our interface
      const transformedOrder: PurchaseOrder = {
        id: detailedOrder.id || '',
        poNumber: detailedOrder.poNumber || '',
        purchaseDate: detailedOrder.poDate ? new Date(detailedOrder.poDate).toISOString().split('T')[0] : '',
        description: detailedOrder.notes || '',
        requestedBy: detailedOrder.requestedByName || '',
        requestedById: detailedOrder.requestedById || '',
        supplierId: detailedOrder.supplierId || '',
        supplierName: detailedOrder.supplierName || '',
        projectId: detailedOrder.projectId || '',
        projectName: detailedOrder.projectName || '',
        items: (detailedOrder.items || []).map(item => ({
          id: item.id || '',
          itemId: item.itemId || '',
          itemName: item.itemName || '',
          quantity: item.quantity || 0,
          description: item.notes || ''
        })),
        itemCount: detailedOrder.items?.length || 0
      };
      
      console.log('Transformed detailed order:', transformedOrder);
      setEditingOrder(transformedOrder)
      setShowForm(true)
    } catch (error) {
      console.error('Error fetching detailed purchase order:', error);
      // Fallback to using the list data if detailed fetch fails
      setEditingOrder(order)
      setShowForm(true)
    }
  }

  const handleView = (order: PurchaseOrder) => {
    setViewingOrder(order)
  }

  const handleDelete = (order: PurchaseOrder) => {
    setDeleteConfirmation({ isOpen: true, order });
  };

  const confirmDelete = async () => {
    if (!deleteConfirmation.order) return;
    
    try {
      console.log('Attempting to delete purchase order:', deleteConfirmation.order.id);
      await purchaseOrderService.deletePurchaseOrder(deleteConfirmation.order.id)
      console.log('Purchase order deleted successfully');
      
      // Refresh the data
      await fetchPurchaseOrders(true)
      setDeleteConfirmation({ isOpen: false, order: null });
    } catch (error) {
      console.error('Error deleting purchase order:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Error deleting purchase order: ${errorMessage}`);
    }
  }

  const handleSubmit = async (orderData: Omit<PurchaseOrder, "id">) => {
    try {
      console.log('Starting purchase order save operation...');
      console.log('Order data:', JSON.stringify(orderData, null, 2));
      console.log('Editing order:', editingOrder);
      console.log('Is editing mode:', !!editingOrder);
      
      if (editingOrder) {
        // Update existing order
        console.log('Updating existing purchase order:', editingOrder.id);
        const updateData = {
          id: editingOrder.id, // Include the ID field as required by backend validation
          poNumber: orderData.poNumber,
          poDate: orderData.purchaseDate,
          status: 1, // Active status
          notes: orderData.description,
          requestedById: orderData.requestedById || '',
          supplierId: orderData.supplierId || '',
          projectId: orderData.projectId || ''
        };
        console.log('Update data:', JSON.stringify(updateData, null, 2));

        await purchaseOrderService.updatePurchaseOrder(editingOrder.id, updateData);
        console.log('Purchase order updated successfully');
      } else {
        // Create new order
        console.log('Creating new purchase order...');
        const createData = {
          poNumber: orderData.poNumber,
          poDate: orderData.purchaseDate,
          status: 1, // Active status
          notes: orderData.description,
          requestedById: orderData.requestedById || '',
          supplierId: orderData.supplierId || '',
          projectId: orderData.projectId || '',
          items: orderData.items.map(item => ({
            itemId: item.itemId,
            quantity: item.quantity,
            unitPrice: 0, // Default unit price
            notes: item.description
          }))
        };
        console.log('Create data:', JSON.stringify(createData, null, 2));

        await purchaseOrderService.createPurchaseOrder(createData);
        console.log('Purchase order created successfully');
      }

      // Refresh the data
      await fetchPurchaseOrders(true)
      setShowForm(false)
      setEditingOrder(undefined)
    } catch (error) {
      console.error('Error saving purchase order:', error);
      console.error('Error type:', typeof error);
      console.error('Error constructor:', error?.constructor?.name);
      console.error('Error details:', JSON.stringify(error, null, 2));
      
      // Try to get more specific error information
      let errorMessage = 'Unknown error occurred';
      let errorDetails = '';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        errorDetails = error.stack || '';
      } else if (typeof error === 'object' && error !== null) {
        const errorObj = error as any;
        console.log('Error object keys:', Object.keys(errorObj));
        
        if (errorObj.response) {
          console.log('Response error:', errorObj.response);
          errorMessage = errorObj.response.data?.message || errorObj.response.statusText || 'API Error';
          errorDetails = `Status: ${errorObj.response.status}, Data: ${JSON.stringify(errorObj.response.data)}`;
        } else if (errorObj.message) {
          errorMessage = errorObj.message;
        } else if (errorObj.error) {
          errorMessage = errorObj.error;
        }
      }
      
      console.error('Final error message:', errorMessage);
      console.error('Final error details:', errorDetails);
      alert(`Error saving purchase order: ${errorMessage}${errorDetails ? '\n\nDetails: ' + errorDetails : ''}`);
    }
  }

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Purchase Orders</h1>
                <p className="text-muted-foreground">Manage procurement requests and purchase orders</p>
              </div>
              <UserHeader />
            </div>

            {showForm ? (
              <PurchaseOrderForm
                key={editingOrder?.id || 'new'} // Force re-render when switching between add/edit
                purchaseOrder={editingOrder}
                onSubmit={handleSubmit}
                onCancel={() => {
                  setShowForm(false)
                  setEditingOrder(undefined)
                }}
              />
            ) : (
              <>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-muted-foreground">Loading purchase orders...</div>
                  </div>
                ) : purchaseOrders.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="mx-auto h-12 w-12 text-gray-400">
                      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No purchase orders</h3>
                    <p className="mt-1 text-sm text-gray-500">Get started by creating a new purchase order.</p>
                    <div className="mt-6">
                      <Button onClick={handleAdd} className="bg-blue-600 hover:bg-blue-700">
                        Add Purchase Order
                      </Button>
                    </div>
                  </div>
                ) : (
                  <PurchaseOrderTable
                    purchaseOrders={purchaseOrders}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onAdd={handleAdd}
                    onView={handleView}
                  />
                )}
              </>
            )}
          </div>
        </main>
        
        <ConfirmationDialog
          isOpen={deleteConfirmation.isOpen}
          onClose={() => setDeleteConfirmation({ isOpen: false, order: null })}
          onConfirm={confirmDelete}
          title="Delete Purchase Order"
          description={`Are you sure you want to delete purchase order "${deleteConfirmation.order?.poNumber}"? This action cannot be undone and will also delete all associated items.`}
          confirmText="Delete"
          cancelText="Cancel"
          variant="destructive"
        />
      </div>
    </ProtectedRoute>
  )
}
