/**
 * Traffic Data Types for PDF Step 1
 * Defines the structure for traffic data fetching and processing
 */

import type { TrafficCondition, Coordinates } from '@/core/types';

export interface TrafficData {
  delayMinutes: number;
  trafficCondition: TrafficCondition;
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
  originCoords?: Pick<Coordinates, 'lat' | 'lng'>;
  destinationCoords?: Pick<Coordinates, 'lat' | 'lng'>;
  departureTime?: Date;
}

export interface TrafficAPIResponse {
  success: boolean;
  data?: TrafficData;
  error?: string;
  fallbackUsed?: boolean;
}