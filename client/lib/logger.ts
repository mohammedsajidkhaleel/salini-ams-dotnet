/**
 * Enhanced logging system for Salini AMS
 * Provides structured logging with different levels and contexts
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  data?: any;
  userId?: string;
  sessionId?: string;
  userAgent?: string;
  url?: string;
  stack?: string;
}

export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableLocalStorage: boolean;
  enableRemoteLogging: boolean;
  maxLocalStorageEntries: number;
  remoteLoggingEndpoint?: string;
}

class Logger {
  private config: LoggerConfig;
  private sessionId: string;
  private userId?: string;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.INFO,
      enableConsole: true,
      enableLocalStorage: true,
      enableRemoteLogging: false,
      maxLocalStorageEntries: 1000,
      ...config
    };

    this.sessionId = this.generateSessionId();
    this.initializeLogger();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeLogger() {
    // Set up global error handlers
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        this.error('Global error caught', 'GlobalErrorHandler', {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          error: event.error
        });
      });

      window.addEventListener('unhandledrejection', (event) => {
        this.error('Unhandled promise rejection', 'GlobalErrorHandler', {
          reason: event.reason,
          promise: event.promise
        });
      });
    }
  }

  setUserId(userId: string) {
    this.userId = userId;
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: string,
    data?: any
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      data,
      userId: this.userId,
      sessionId: this.sessionId,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      stack: level >= LogLevel.ERROR ? new Error().stack : undefined
    };
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.config.level;
  }

  private logToConsole(entry: LogEntry) {
    if (!this.config.enableConsole) return;

    const { timestamp, level, message, context, data } = entry;
    const contextStr = context ? `[${context}]` : '';
    const dataStr = data ? ` ${JSON.stringify(data)}` : '';

    switch (level) {
      case LogLevel.DEBUG:
        console.debug(`🔍 ${timestamp} ${contextStr} ${message}${dataStr}`);
        break;
      case LogLevel.INFO:
        console.info(`ℹ️ ${timestamp} ${contextStr} ${message}${dataStr}`);
        break;
      case LogLevel.WARN:
        console.warn(`⚠️ ${timestamp} ${contextStr} ${message}${dataStr}`);
        break;
      case LogLevel.ERROR:
        console.error(`❌ ${timestamp} ${contextStr} ${message}${dataStr}`);
        break;
      case LogLevel.FATAL:
        console.error(`💀 ${timestamp} ${contextStr} ${message}${dataStr}`);
        break;
    }
  }

  private logToLocalStorage(entry: LogEntry) {
    if (!this.config.enableLocalStorage || typeof window === 'undefined') return;

    try {
      const logs = this.getLocalStorageLogs();
      logs.push(entry);

      // Keep only the most recent entries
      if (logs.length > this.config.maxLocalStorageEntries) {
        logs.splice(0, logs.length - this.config.maxLocalStorageEntries);
      }

      localStorage.setItem('salini_ams_logs', JSON.stringify(logs));
    } catch (error) {
      console.warn('Failed to log to localStorage:', error);
    }
  }

  private async logToRemote(entry: LogEntry) {
    if (!this.config.enableRemoteLogging || !this.config.remoteLoggingEndpoint) return;

    try {
      await fetch(this.config.remoteLoggingEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entry)
      });
    } catch (error) {
      console.warn('Failed to log to remote endpoint:', error);
    }
  }

  private async log(level: LogLevel, message: string, context?: string, data?: any) {
    if (!this.shouldLog(level)) return;

    const entry = this.createLogEntry(level, message, context, data);

    this.logToConsole(entry);
    this.logToLocalStorage(entry);
    await this.logToRemote(entry);
  }

  debug(message: string, context?: string, data?: any) {
    this.log(LogLevel.DEBUG, message, context, data);
  }

  info(message: string, context?: string, data?: any) {
    this.log(LogLevel.INFO, message, context, data);
  }

  warn(message: string, context?: string, data?: any) {
    this.log(LogLevel.WARN, message, context, data);
  }

  error(message: string, context?: string, data?: any) {
    this.log(LogLevel.ERROR, message, context, data);
  }

  fatal(message: string, context?: string, data?: any) {
    this.log(LogLevel.FATAL, message, context, data);
  }

  // Performance logging
  time(label: string) {
    if (typeof window !== 'undefined') {
      console.time(label);
    }
  }

  timeEnd(label: string) {
    if (typeof window !== 'undefined') {
      console.timeEnd(label);
    }
  }

  // API call logging
  apiCall(method: string, url: string, status?: number, duration?: number, data?: any) {
    const message = `${method} ${url}${status ? ` - ${status}` : ''}${duration ? ` (${duration}ms)` : ''}`;
    const level = status && status >= 400 ? LogLevel.ERROR : LogLevel.INFO;
    
    this.log(level, message, 'API', {
      method,
      url,
      status,
      duration,
      data
    });
  }

  // User action logging
  userAction(action: string, context?: string, data?: any) {
    this.info(`User action: ${action}`, context || 'UserAction', data);
  }

  // Security logging
  security(event: string, context?: string, data?: any) {
    this.warn(`Security event: ${event}`, context || 'Security', data);
  }

  // Business logic logging
  business(event: string, context?: string, data?: any) {
    this.info(`Business event: ${event}`, context || 'Business', data);
  }

  // Get logs from localStorage
  getLocalStorageLogs(): LogEntry[] {
    if (typeof window === 'undefined') return [];

    try {
      const logs = localStorage.getItem('salini_ams_logs');
      return logs ? JSON.parse(logs) : [];
    } catch (error) {
      console.warn('Failed to get logs from localStorage:', error);
      return [];
    }
  }

  // Clear logs from localStorage
  clearLocalStorageLogs() {
    if (typeof window === 'undefined') return;

    try {
      localStorage.removeItem('salini_ams_logs');
    } catch (error) {
      console.warn('Failed to clear logs from localStorage:', error);
    }
  }

  // Export logs
  exportLogs(): string {
    const logs = this.getLocalStorageLogs();
    return JSON.stringify(logs, null, 2);
  }

  // Download logs as file
  downloadLogs() {
    if (typeof window === 'undefined') return;

    const logs = this.exportLogs();
    const blob = new Blob([logs], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `salini_ams_logs_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Get log statistics
  getLogStats() {
    const logs = this.getLocalStorageLogs();
    const stats = {
      total: logs.length,
      byLevel: {} as Record<string, number>,
      byContext: {} as Record<string, number>,
      oldest: logs.length > 0 ? logs[0].timestamp : null,
      newest: logs.length > 0 ? logs[logs.length - 1].timestamp : null
    };

    logs.forEach(log => {
      const level = LogLevel[log.level];
      const context = log.context || 'unknown';
      
      stats.byLevel[level] = (stats.byLevel[level] || 0) + 1;
      stats.byContext[context] = (stats.byContext[context] || 0) + 1;
    });

    return stats;
  }
}

// Create singleton instance
export const logger = new Logger({
  level: process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.INFO,
  enableConsole: true,
  enableLocalStorage: true,
  enableRemoteLogging: false,
  maxLocalStorageEntries: 1000
});

// React hook for logging
import { useCallback } from 'react';

export function useLogger(context?: string) {
  const log = useCallback((level: LogLevel, message: string, data?: any) => {
    logger.log(level, message, context, data);
  }, [context]);

  return {
    debug: useCallback((message: string, data?: any) => log(LogLevel.DEBUG, message, data), [log]),
    info: useCallback((message: string, data?: any) => log(LogLevel.INFO, message, data), [log]),
    warn: useCallback((message: string, data?: any) => log(LogLevel.WARN, message, data), [log]),
    error: useCallback((message: string, data?: any) => log(LogLevel.ERROR, message, data), [log]),
    fatal: useCallback((message: string, data?: any) => log(LogLevel.FATAL, message, data), [log]),
    apiCall: useCallback((method: string, url: string, status?: number, duration?: number, data?: any) => {
      logger.apiCall(method, url, status, duration, data);
    }, []),
    userAction: useCallback((action: string, data?: any) => {
      logger.userAction(action, context, data);
    }, [context]),
    security: useCallback((event: string, data?: any) => {
      logger.security(event, context, data);
    }, [context]),
    business: useCallback((event: string, data?: any) => {
      logger.business(event, context, data);
    }, [context])
  };
}

export default logger;
