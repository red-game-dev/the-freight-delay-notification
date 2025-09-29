/**
 * Temporal Configuration
 * Central configuration for all Temporal-related settings
 */

export const temporalConfig = {
  // Server configuration
  server: {
    address: process.env.TEMPORAL_ADDRESS || 'localhost:7233',
    namespace: process.env.TEMPORAL_NAMESPACE || 'default',
  },

  // Worker configuration
  worker: {
    taskQueue: process.env.TEMPORAL_TASK_QUEUE || 'freight-delay-notifications',
    maxConcurrentActivityExecutions: 10,
    maxConcurrentWorkflowExecutions: 5,
  },

  // Workflow configuration
  workflow: {
    executionTimeout: '30m',
    runTimeout: '10m',
    taskTimeout: '1m',
    retryPolicy: {
      initialInterval: '1s',
      backoffCoefficient: 2,
      maximumInterval: '30s',
      maximumAttempts: 3,
    },
  },

  // Activity-specific timeouts
  activities: {
    trafficCheck: {
      startToCloseTimeout: '30s',
      heartbeatTimeout: '10s',
      retry: {
        initialInterval: '5s',
        backoffCoefficient: 2,
        maximumAttempts: 3,
        maximumInterval: '30s',
      },
    },
    aiGeneration: {
      startToCloseTimeout: '60s',
      heartbeatTimeout: '20s',
      retry: {
        initialInterval: '2s',
        backoffCoefficient: 2,
        maximumAttempts: 3,
        maximumInterval: '20s',
      },
    },
    notification: {
      startToCloseTimeout: '45s',
      heartbeatTimeout: '15s',
      retry: {
        initialInterval: '3s',
        backoffCoefficient: 2,
        maximumAttempts: 5,
        maximumInterval: '60s',
      },
    },
  },

  // Development settings
  development: {
    enableLogging: true,
    logLevel: 'debug',
    enableMetrics: false,
  },

  // Production settings
  production: {
    enableLogging: true,
    logLevel: 'info',
    enableMetrics: true,
  },
};