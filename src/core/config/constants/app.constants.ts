/**
 * Application Constants
 * Global constants used throughout the application
 */

/**
 * App metadata
 */
export const APP_NAME = 'Freight Delay Notification';
export const APP_SHORT_NAME = 'FDN';
export const APP_VERSION = '1.0.0';
export const APP_DESCRIPTION = 'Real-time freight delivery monitoring with intelligent delay notifications';

/**
 * Repository and project links
 */
export const REPOSITORY = {
  URL: 'https://github.com/red-game-dev/the-freight-delay-notification',
  ISSUES: 'https://github.com/red-game-dev/the-freight-delay-notification/issues',
  DOCS: 'https://github.com/red-game-dev/the-freight-delay-notification/tree/main/docs',
  README: 'https://github.com/red-game-dev/the-freight-delay-notification#readme',
} as const;

/**
 * Social media and contact links
 */
export const SOCIAL_LINKS = {
  GITHUB: REPOSITORY.URL,
  EMAIL: 'mailto:support@example.com',
} as const;

/**
 * Navigation routes
 */
export const ROUTES = {
  HOME: '/',
  DELIVERIES: '/deliveries',
  MONITORING: '/monitoring',
  NOTIFICATIONS: '/notifications',
  WORKFLOWS: '/workflows',
  HOW_TO_USE: '/how-to-use',
} as const;

/**
 * Tech stack information
 */
export const TECH_STACK = {
  FRONTEND: 'Next.js',
  WORKFLOWS: 'Temporal',
  AI: 'OpenAI GPT-4',
  TRAFFIC: 'Google Maps & Mapbox',
  NOTIFICATIONS: 'SendGrid & Twilio',
  DATABASE: 'Supabase (PostgreSQL)',
  LANGUAGE: 'TypeScript',
} as const;

/**
 * API configuration
 */
export const API_TIMEOUT = 30000; // 30 seconds
export const API_RETRY_ATTEMPTS = 3;
export const API_RETRY_DELAY = 1000; // 1 second

/**
 * Pagination defaults
 */
export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 100;

/**
 * Cache configuration (in milliseconds)
 */
export const CACHE_TTL = {
  SHORT: 60 * 1000,        // 1 minute
  MEDIUM: 5 * 60 * 1000,   // 5 minutes
  LONG: 30 * 60 * 1000,    // 30 minutes
  VERY_LONG: 60 * 60 * 1000 // 1 hour
} as const;

/**
 * Local storage keys
 */
export const STORAGE_KEYS = {
  THEME: 'fdn-theme',
  VIEW_MODE: 'fdn-view-mode',
} as const;

/**
 * UI interaction delays (in milliseconds)
 */
export const UI_DELAYS = {
  SEARCH_DEBOUNCE: 300,
  FILTER_DEBOUNCE: 200,
  TOOLTIP_DELAY: 200,
  ANIMATION_SHORT: 150,
  ANIMATION_MEDIUM: 300,
  ANIMATION_LONG: 500,
} as const;

/**
 * Workflow-specific constants
 */
export const WORKFLOW = {
  DEFAULT_THRESHOLD_MINUTES: 30,
  DEFAULT_CHECK_INTERVAL_MINUTES: 30,
  DEFAULT_CUTOFF_HOURS: 72,
  MIN_CHECK_INTERVAL_MINUTES: 5,
  MAX_CHECK_INTERVAL_MINUTES: 43200, // 30 days
  POLL_INTERVAL_MS: 2000, // 2 seconds
} as const;

/**
 * View modes
 */
export const VIEW_MODES = ['list', 'grid', 'compact'] as const;
export type ViewMode = typeof VIEW_MODES[number];
