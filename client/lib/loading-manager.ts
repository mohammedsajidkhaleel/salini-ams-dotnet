/**
 * Loading state manager for better UX
 */

import React from 'react';
import { toast } from './toast';

export interface LoadingState {
  isLoading: boolean;
  message?: string;
  progress?: number;
  canCancel?: boolean;
  onCancel?: () => void;
}

export type LoadingCallback = (state: LoadingState) => void;

export class LoadingManager {
  private static instance: LoadingManager;
  private callbacks: Set<LoadingCallback> = new Set();
  private loadingStates: Map<string, LoadingState> = new Map();
  private globalLoading = false;

  private constructor() {}

  static getInstance(): LoadingManager {
    if (!LoadingManager.instance) {
      LoadingManager.instance = new LoadingManager();
    }
    return LoadingManager.instance;
  }

  /**
   * Subscribe to loading state changes
   */
  subscribe(callback: LoadingCallback): () => void {
    this.callbacks.add(callback);
    
    // Immediately call with current global state
    callback(this.getGlobalState());

    // Return unsubscribe function
    return () => {
      this.callbacks.delete(callback);
    };
  }

  /**
   * Start loading for a specific operation
   */
  startLoading(
    operationId: string, 
    message?: string, 
    canCancel = false, 
    onCancel?: () => void
  ): void {
    this.loadingStates.set(operationId, {
      isLoading: true,
      message,
      canCancel,
      onCancel,
    });

    this.updateGlobalState();
  }

  /**
   * Update loading progress for a specific operation
   */
  updateProgress(operationId: string, progress: number, message?: string): void {
    const state = this.loadingStates.get(operationId);
    if (state) {
      this.loadingStates.set(operationId, {
        ...state,
        progress,
        message: message || state.message,
      });
      this.updateGlobalState();
    }
  }

  /**
   * Stop loading for a specific operation
   */
  stopLoading(operationId: string): void {
    this.loadingStates.delete(operationId);
    this.updateGlobalState();
  }

  /**
   * Cancel a loading operation
   */
  cancelLoading(operationId: string): void {
    const state = this.loadingStates.get(operationId);
    if (state && state.onCancel) {
      state.onCancel();
    }
    this.stopLoading(operationId);
  }

  /**
   * Get loading state for a specific operation
   */
  getLoadingState(operationId: string): LoadingState | undefined {
    return this.loadingStates.get(operationId);
  }

  /**
   * Check if any operation is loading
   */
  isAnyLoading(): boolean {
    return this.loadingStates.size > 0;
  }

  /**
   * Check if a specific operation is loading
   */
  isLoading(operationId: string): boolean {
    return this.loadingStates.has(operationId);
  }

  /**
   * Get global loading state
   */
  getGlobalState(): LoadingState {
    const states = Array.from(this.loadingStates.values());
    
    if (states.length === 0) {
      return { isLoading: false };
    }

    if (states.length === 1) {
      return states[0];
    }

    // Multiple operations loading
    const totalProgress = states.reduce((sum, state) => sum + (state.progress || 0), 0);
    const averageProgress = totalProgress / states.length;

    return {
      isLoading: true,
      message: `${states.length} operations in progress...`,
      progress: averageProgress,
    };
  }

  /**
   * Update global state and notify subscribers
   */
  private updateGlobalState(): void {
    const globalState = this.getGlobalState();
    const wasLoading = this.globalLoading;
    this.globalLoading = globalState.isLoading;

    // Notify all subscribers
    this.callbacks.forEach(callback => {
      try {
        callback(globalState);
      } catch (error) {
        console.error('Error in loading callback:', error);
      }
    });

    // Show/hide global loading indicator if needed
    if (this.globalLoading && !wasLoading) {
      this.showGlobalLoading();
    } else if (!this.globalLoading && wasLoading) {
      this.hideGlobalLoading();
    }
  }

  /**
   * Show global loading indicator
   */
  private showGlobalLoading(): void {
    // This could be implemented with a global loading overlay
    // For now, we'll just log it
    console.log('Global loading started');
  }

  /**
   * Hide global loading indicator
   */
  private hideGlobalLoading(): void {
    // This could be implemented with a global loading overlay
    // For now, we'll just log it
    console.log('Global loading finished');
  }

  /**
   * Clear all loading states
   */
  clearAll(): void {
    this.loadingStates.clear();
    this.updateGlobalState();
  }
}

/**
 * Hook for loading state in React components
 */
export function useLoadingState(operationId?: string) {
  const [globalState, setGlobalState] = React.useState<LoadingState>(() => 
    LoadingManager.getInstance().getGlobalState()
  );

  React.useEffect(() => {
    const manager = LoadingManager.getInstance();
    const unsubscribe = manager.subscribe(setGlobalState);

    return unsubscribe;
  }, []);

  const startLoading = React.useCallback(
    (message?: string, canCancel = false, onCancel?: () => void) => {
      if (operationId) {
        LoadingManager.getInstance().startLoading(operationId, message, canCancel, onCancel);
      }
    },
    [operationId]
  );

  const updateProgress = React.useCallback(
    (progress: number, message?: string) => {
      if (operationId) {
        LoadingManager.getInstance().updateProgress(operationId, progress, message);
      }
    },
    [operationId]
  );

  const stopLoading = React.useCallback(() => {
    if (operationId) {
      LoadingManager.getInstance().stopLoading(operationId);
    }
  }, [operationId]);

  const cancelLoading = React.useCallback(() => {
    if (operationId) {
      LoadingManager.getInstance().cancelLoading(operationId);
    }
  }, [operationId]);

  return {
    ...globalState,
    startLoading,
    updateProgress,
    stopLoading,
    cancelLoading,
  };
}

/**
 * Hook for global loading state
 */
export function useGlobalLoading(): LoadingState {
  const [state, setState] = React.useState<LoadingState>(() => 
    LoadingManager.getInstance().getGlobalState()
  );

  React.useEffect(() => {
    const manager = LoadingManager.getInstance();
    const unsubscribe = manager.subscribe(setState);

    return unsubscribe;
  }, []);

  return state;
}

export default LoadingManager;
