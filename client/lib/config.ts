/**
 * Application Configuration
 * Centralized configuration for the Salini AMS frontend
 */

export const config = {
  // API Configuration
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
    timeout: 30000, // 30 seconds
    retryAttempts: 3,
  },

  // Application Configuration
  app: {
    name: 'Salini AMS',
    version: '1.0.0',
    environment: process.env.NEXT_PUBLIC_APP_ENV || 'development',
  },

  // Pagination defaults
  pagination: {
    defaultPageSize: 10,
    pageSizeOptions: [10, 25, 50, 100],
  },

  // File upload limits
  upload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: {
      csv: ['text/csv', 'application/csv'],
      excel: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
      pdf: ['application/pdf'],
    },
  },

  // Date formats
  dateFormats: {
    display: 'MMM dd, yyyy',
    displayWithTime: 'MMM dd, yyyy HH:mm',
    api: 'yyyy-MM-dd',
    apiWithTime: 'yyyy-MM-ddTHH:mm:ss',
  },

  // Status mappings
  status: {
    active: 1,
    inactive: 0,
    pending: 2,
    archived: 3,
  },

  // User roles
  roles: {
    superAdmin: 'SuperAdmin',
    admin: 'Admin',
    manager: 'Manager',
    user: 'User',
  },

  // Permissions
  permissions: {
    // Employee permissions
    employees: {
      view: 'employees.view',
      create: 'employees.create',
      update: 'employees.update',
      delete: 'employees.delete',
      export: 'employees.export',
      import: 'employees.import',
    },
    
    // Asset permissions
    assets: {
      view: 'assets.view',
      create: 'assets.create',
      update: 'assets.update',
      delete: 'assets.delete',
      assign: 'assets.assign',
      export: 'assets.export',
      import: 'assets.import',
    },
    
    // SIM Card permissions
    simCards: {
      view: 'simcards.view',
      create: 'simcards.create',
      update: 'simcards.update',
      delete: 'simcards.delete',
      assign: 'simcards.assign',
      export: 'simcards.export',
      import: 'simcards.import',
    },
    
    // Software License permissions
    softwareLicenses: {
      view: 'softwarelicenses.view',
      create: 'softwarelicenses.create',
      update: 'softwarelicenses.update',
      delete: 'softwarelicenses.delete',
      assign: 'softwarelicenses.assign',
      export: 'softwarelicenses.export',
      import: 'softwarelicenses.import',
    },
    
    // User Management permissions
    users: {
      view: 'users.view',
      create: 'users.create',
      update: 'users.update',
      delete: 'users.delete',
      managePermissions: 'users.managePermissions',
    },
    
    // Reports permissions
    reports: {
      view: 'reports.view',
      export: 'reports.export',
      schedule: 'reports.schedule',
    },
    
    // Master Data permissions
    masterData: {
      view: 'masterdata.view',
      create: 'masterdata.create',
      update: 'masterdata.update',
      delete: 'masterdata.delete',
    },
  },
} as const;

export type Config = typeof config;
