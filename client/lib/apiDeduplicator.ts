/**
 * API Call Deduplicator
 * Prevents duplicate API calls by tracking ongoing requests
 */

interface PendingRequest<T> {
  promise: Promise<T>
  timestamp: number
}

class ApiDeduplicator {
  private pendingRequests = new Map<string, PendingRequest<any>>()
  private readonly REQUEST_TIMEOUT = 30000 // 30 seconds

  /**
   * Execute an API call with deduplication
   * If the same call is already in progress, returns the existing promise
   */
  async execute<T>(
    key: string,
    apiCall: () => Promise<T>,
    ttl: number = 5000 // 5 seconds default TTL
  ): Promise<T> {
    // Clean up expired requests
    this.cleanupExpiredRequests()

    // Check if the same request is already pending
    const existingRequest = this.pendingRequests.get(key)
    if (existingRequest) {
      console.log('🔄 API Deduplicator: Reusing existing request for key:', key)
      return existingRequest.promise
    }

    console.log('🚀 API Deduplicator: Starting new request for key:', key)
    
    // Create new request
    const promise = apiCall()
      .then((result) => {
        // Remove from pending requests on success
        this.pendingRequests.delete(key)
        console.log('✅ API Deduplicator: Request completed for key:', key)
        return result
      })
      .catch((error) => {
        // Remove from pending requests on error
        this.pendingRequests.delete(key)
        console.log('❌ API Deduplicator: Request failed for key:', key)
        throw error
      })

    // Store the pending request
    this.pendingRequests.set(key, {
      promise,
      timestamp: Date.now()
    })

    return promise
  }

  /**
   * Generate a unique key for an API call
   */
  generateKey(operation: string, params: Record<string, any> = {}): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}=${JSON.stringify(params[key])}`)
      .join('&')
    
    return `${operation}${sortedParams ? `?${sortedParams}` : ''}`
  }

  /**
   * Clean up expired requests
   */
  private cleanupExpiredRequests(): void {
    const now = Date.now()
    for (const [key, request] of this.pendingRequests.entries()) {
      if (now - request.timestamp > this.REQUEST_TIMEOUT) {
        console.log('🧹 API Deduplicator: Cleaning up expired request:', key)
        this.pendingRequests.delete(key)
      }
    }
  }

  /**
   * Clear all pending requests (useful for testing)
   */
  clear(): void {
    this.pendingRequests.clear()
  }

  /**
   * Get current pending requests count
   */
  getPendingCount(): number {
    return this.pendingRequests.size
  }
}

export const apiDeduplicator = new ApiDeduplicator()
