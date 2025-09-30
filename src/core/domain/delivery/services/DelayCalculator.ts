/**
 * Delay Calculator Domain Service
 * Provides business logic for assessing delivery delays
 */

import type { Delivery } from '../entities/Delivery';
import type { TrafficData } from '../../../../types/shared/traffic.types';

export type DelaySeverity = 'none' | 'minor' | 'major' | 'severe';

export interface DelayAssessment {
  delayMinutes: number;
  thresholdMinutes: number;
  exceedsThreshold: boolean;
  severity: DelaySeverity;
  delayPercentage: number;
  recommendedAction: string;
}

export class DelayCalculator {
  /**
   * Assess delay against delivery threshold
   * Provides detailed analysis including severity and recommended actions
   *
   * @param delivery - Delivery entity with threshold configuration
   * @param trafficData - Traffic data with delay information
   * @returns Comprehensive delay assessment
   */
  static assessDelay(delivery: Delivery, trafficData: TrafficData): DelayAssessment {
    const { delayMinutes } = trafficData;
    const threshold = delivery.delayThresholdMinutes;
    const exceedsThreshold = delayMinutes > threshold;

    return {
      delayMinutes,
      thresholdMinutes: threshold,
      exceedsThreshold,
      severity: this.calculateSeverity(delayMinutes, threshold),
      delayPercentage: this.calculateDelayPercentage(delayMinutes, threshold),
      recommendedAction: this.getRecommendedAction(delayMinutes, threshold),
    };
  }

  /**
   * Calculate delay severity based on threshold ratio
   *
   * Business rules:
   * - none: delay <= threshold
   * - minor: delay > threshold but <= 1.5x threshold
   * - major: delay > 1.5x threshold but <= 2x threshold
   * - severe: delay > 2x threshold
   */
  private static calculateSeverity(delayMinutes: number, threshold: number): DelaySeverity {
    if (delayMinutes <= threshold) {
      return 'none';
    }

    const ratio = delayMinutes / threshold;

    if (ratio <= 1.5) {
      return 'minor';
    } else if (ratio <= 2.0) {
      return 'major';
    } else {
      return 'severe';
    }
  }

  /**
   * Calculate delay as percentage of threshold
   */
  private static calculateDelayPercentage(delayMinutes: number, threshold: number): number {
    if (threshold === 0) {
      return 0;
    }
    return Math.round((delayMinutes / threshold) * 100);
  }

  /**
   * Get recommended action based on delay severity
   *
   * Business rules for customer communication:
   * - Within threshold: Monitor only, no notification
   * - Minor delay: Standard notification
   * - Major delay: Urgent notification with alternatives
   * - Severe delay: Critical notification with escalation
   */
  private static getRecommendedAction(delayMinutes: number, threshold: number): string {
    if (delayMinutes <= threshold) {
      return 'Monitor - no notification needed';
    }

    const ratio = delayMinutes / threshold;

    if (ratio <= 1.5) {
      return 'Send standard delay notification';
    } else if (ratio <= 2.0) {
      return 'Send urgent delay notification with alternative delivery options';
    } else {
      return 'Send critical delay notification and escalate to customer support';
    }
  }

  /**
   * Format delay for display
   */
  static formatDelay(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} minutes`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (remainingMinutes === 0) {
      return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
    }

    return `${hours}h ${remainingMinutes}m`;
  }
}