/**
 * Traffic Data Types for PDF Step 1
 * Defines the structure for traffic data fetching and processing
 */

export interface TrafficData {
  delayMinutes: number;
  trafficCondition: 'light' | 'moderate' | 'heavy' | 'severe';
  estimatedDuration: number; // in seconds
  normalDuration: number; // in seconds
  fetchedAt: Date;
  provider: 'google' | 'mapbox'; // Track which API provided the data
  distance?: {
    value: number;
    unit: 'meters' | 'miles' | 'kilometers';
  };
}

export interface RouteInput {
  origin: string;
  destination: string;
  originCoords?: { lat: number; lng: number };
  destinationCoords?: { lat: number; lng: number };
  departureTime?: Date;
}

export interface TrafficAPIResponse {
  success: boolean;
  data?: TrafficData;
  error?: string;
  fallbackUsed?: boolean;
}