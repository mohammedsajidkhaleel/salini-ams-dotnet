/**
 * Network status monitor for handling offline/online scenarios
 */

import React from 'react';
import { toast } from './toast';

export interface NetworkStatus {
  isOnline: boolean;
  isSlowConnection: boolean;
  connectionType?: string;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
}

export type NetworkStatusCallback = (status: NetworkStatus) => void;

export class NetworkMonitor {
  private static instance: NetworkMonitor;
  private callbacks: Set<NetworkStatusCallback> = new Set();
  private currentStatus: NetworkStatus = {
    isOnline: navigator.onLine,
    isSlowConnection: false,
  };
  private toastShown = false;

  private constructor() {
    this.setupEventListeners();
    this.detectConnectionType();
  }

  static getInstance(): NetworkMonitor {
    if (!NetworkMonitor.instance) {
      NetworkMonitor.instance = new NetworkMonitor();
    }
    return NetworkMonitor.instance;
  }

  /**
   * Get current network status
   */
  getStatus(): NetworkStatus {
    return { ...this.currentStatus };
  }

  /**
   * Subscribe to network status changes
   */
  subscribe(callback: NetworkStatusCallback): () => void {
    this.callbacks.add(callback);
    
    // Immediately call with current status
    callback(this.currentStatus);

    // Return unsubscribe function
    return () => {
      this.callbacks.delete(callback);
    };
  }

  /**
   * Check if device is online
   */
  isOnline(): boolean {
    return this.currentStatus.isOnline;
  }

  /**
   * Check if connection is slow
   */
  isSlowConnection(): boolean {
    return this.currentStatus.isSlowConnection;
  }

  /**
   * Setup event listeners for network changes
   */
  private setupEventListeners(): void {
    // Online/offline events
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));

    // Connection change events (if supported)
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      connection.addEventListener('change', this.handleConnectionChange.bind(this));
    }
  }

  /**
   * Handle online event
   */
  private handleOnline(): void {
    this.updateStatus({
      isOnline: true,
      isSlowConnection: false,
    });

    if (this.toastShown) {
      toast.success('Connection restored');
      this.toastShown = false;
    }
  }

  /**
   * Handle offline event
   */
  private handleOffline(): void {
    this.updateStatus({
      isOnline: false,
      isSlowConnection: false,
    });

    if (!this.toastShown) {
      toast.error('You are offline. Some features may not work properly.');
      this.toastShown = true;
    }
  }

  /**
   * Handle connection change event
   */
  private handleConnectionChange(): void {
    this.detectConnectionType();
  }

  /**
   * Detect connection type and speed
   */
  private detectConnectionType(): void {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      
      this.updateStatus({
        connectionType: connection.type,
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        isSlowConnection: this.isConnectionSlow(connection),
      });
    }
  }

  /**
   * Check if connection is slow based on effective type
   */
  private isConnectionSlow(connection: any): boolean {
    if (!connection.effectiveType) return false;

    const slowTypes = ['slow-2g', '2g'];
    return slowTypes.includes(connection.effectiveType);
  }

  /**
   * Update network status and notify subscribers
   */
  private updateStatus(updates: Partial<NetworkStatus>): void {
    this.currentStatus = { ...this.currentStatus, ...updates };
    
    // Notify all subscribers
    this.callbacks.forEach(callback => {
      try {
        callback(this.currentStatus);
      } catch (error) {
        console.error('Error in network status callback:', error);
      }
    });
  }

  /**
   * Cleanup event listeners
   */
  destroy(): void {
    window.removeEventListener('online', this.handleOnline.bind(this));
    window.removeEventListener('offline', this.handleOffline.bind(this));
    
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      connection.removeEventListener('change', this.handleConnectionChange.bind(this));
    }
  }
}

/**
 * Hook for network status in React components
 */
export function useNetworkStatus() {
  const [status, setStatus] = React.useState<NetworkStatus>(() => 
    NetworkMonitor.getInstance().getStatus()
  );

  React.useEffect(() => {
    const monitor = NetworkMonitor.getInstance();
    const unsubscribe = monitor.subscribe(setStatus);

    return unsubscribe;
  }, []);

  return status;
}

/**
 * Hook for online status
 */
export function useOnlineStatus(): boolean {
  const { isOnline } = useNetworkStatus();
  return isOnline;
}

/**
 * Hook for slow connection detection
 */
export function useSlowConnection(): boolean {
  const { isSlowConnection } = useNetworkStatus();
  return isSlowConnection;
}

export default NetworkMonitor;
