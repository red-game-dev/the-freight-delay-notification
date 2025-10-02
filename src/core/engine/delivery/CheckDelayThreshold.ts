/**
 * Check Delay Threshold Use Case
 * PDF Step 2: Check if delay exceeds threshold (e.g., 30 minutes)
 */

import { Result, success } from '../../base/utils/Result';
import type { TrafficData } from '../../../types/shared/traffic.types';
import { logger } from '@/core/base/utils/Logger';

export interface ThresholdCheckResult {
  exceedsThreshold: boolean;
  delayMinutes: number;
  thresholdMinutes: number;
  shouldProceed: boolean;
  reason: string;
}

export class CheckDelayThresholdUseCase {
  /**
   * PDF Step 2: Check if delay exceeds threshold
   * Default threshold: 30 minutes (as specified in PDF)
   *
   * @param trafficData - Traffic data from Step 1
   * @param thresholdMinutes - Delay threshold in minutes (default: 30)
   * @returns Result with threshold check details
   */
  execute(trafficData: TrafficData, thresholdMinutes = 30): Result<ThresholdCheckResult> {
    const { delayMinutes } = trafficData;
    const exceedsThreshold = delayMinutes > thresholdMinutes;

    const result: ThresholdCheckResult = {
      exceedsThreshold,
      delayMinutes,
      thresholdMinutes,
      shouldProceed: exceedsThreshold,
      reason: exceedsThreshold
        ? `Delay of ${delayMinutes} minutes exceeds threshold of ${thresholdMinutes} minutes`
        : `Delay of ${delayMinutes} minutes is within threshold of ${thresholdMinutes} minutes`,
    };

    // PDF requirement: Log key steps
    if (exceedsThreshold) {
      logger.info(`🚨 Step 2: Threshold EXCEEDED - proceeding to notification`);
      logger.info(`   Delay: ${delayMinutes} min | Threshold: ${thresholdMinutes} min`);
      logger.info(`   Decision: PROCEED to Step 3 (Generate AI message)`);
    } else {
      logger.info(`✅ Step 2: Delay within threshold - NO action needed`);
      logger.info(`   Delay: ${delayMinutes} min | Threshold: ${thresholdMinutes} min`);
      logger.info(`   Decision: SKIP remaining steps`);
    }

    return success(result);
  }
}