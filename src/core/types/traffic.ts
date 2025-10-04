/**
 * Shared Traffic Types
 * Common type definitions for traffic-related operations
 */

/**
 * Traffic condition levels
 */
export type TrafficCondition = "light" | "moderate" | "heavy" | "severe";

/**
 * Traffic condition filter options (includes 'all' for UI filtering)
 */
export type TrafficConditionFilter = "all" | TrafficCondition;

/**
 * Traffic incident severity levels
 */
export type TrafficSeverity = "minor" | "moderate" | "major" | "severe";

/**
 * Traffic incident types
 */
export type TrafficIncidentType =
  | "accident"
  | "congestion"
  | "construction"
  | "weather"
  | "other";
