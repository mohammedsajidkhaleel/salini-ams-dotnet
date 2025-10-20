/**
 * Purchase Order Service
 * Handles all purchase order-related API calls
 */

import { apiClient, type PaginatedResponse } from '../apiClient';

export interface PurchaseOrderItem {
  id: string;
  itemId: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  poDate: string;
  expectedDeliveryDate?: string;
  actualDeliveryDate?: string;
  status: number;
  totalAmount?: number;
  notes?: string;
  supplierId: string;
  supplierName: string;
  projectId: string;
  projectName: string;
  requestedById?: string;
  requestedByName?: string;
  items: PurchaseOrderItem[];
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface PurchaseOrderCreateRequest {
  poNumber: string;
  poDate: string;
  expectedDeliveryDate?: string;
  status: number;
  notes?: string;
  requestedById?: string;
  supplierId: string;
  projectId: string;
  items: {
    itemId: string;
    quantity: number;
    unitPrice: number;
    notes?: string;
  }[];
}

export interface PurchaseOrderUpdateRequest {
  poNumber: string;
  poDate: string;
  expectedDeliveryDate?: string;
  actualDeliveryDate?: string;
  status: number;
  notes?: string;
  requestedById?: string;
  supplierId: string;
  projectId: string;
}

export interface PurchaseOrderListRequest {
  pageNumber?: number;
  pageSize?: number;
  searchTerm?: string;
  supplierId?: string;
  projectId?: string;
  status?: number;
  sortBy?: string;
  sortDescending?: boolean;
}

class PurchaseOrderService {
  private readonly baseEndpoint = '/api/PurchaseOrders';

  /**
   * Get all purchase orders with pagination and filtering
   */
  async getPurchaseOrders(params?: PurchaseOrderListRequest): Promise<PaginatedResponse<PurchaseOrder>> {
    const response = await apiClient.get<PaginatedResponse<PurchaseOrder>>(this.baseEndpoint, params);
    return response.data!;
  }

  /**
   * Get a specific purchase order by ID
   */
  async getPurchaseOrderById(id: string): Promise<PurchaseOrder> {
    const response = await apiClient.get<PurchaseOrder>(`${this.baseEndpoint}/${id}`);
    return response.data!;
  }

  /**
   * Create new purchase order
   */
  async createPurchaseOrder(purchaseOrder: PurchaseOrderCreateRequest): Promise<PurchaseOrder> {
    const response = await apiClient.post<PurchaseOrder>(this.baseEndpoint, purchaseOrder);
    return response.data!;
  }

  /**
   * Update purchase order
   */
  async updatePurchaseOrder(id: string, purchaseOrder: PurchaseOrderUpdateRequest): Promise<PurchaseOrder> {
    const response = await apiClient.put<PurchaseOrder>(`${this.baseEndpoint}/${id}`, purchaseOrder);
    return response.data!;
  }

  /**
   * Delete purchase order
   */
  async deletePurchaseOrder(id: string): Promise<void> {
    await apiClient.delete(`${this.baseEndpoint}/${id}`);
  }
}

export const purchaseOrderService = new PurchaseOrderService();
