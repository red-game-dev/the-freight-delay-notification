/**
 * Threshold Check API Route
 * Test endpoint for PDF Step 2: Threshold checking logic
 */

import { createApiHandler, parseJsonBody } from '@/core/infrastructure/http';
import { CheckDelayThresholdUseCase } from '@/core/engine/delivery/CheckDelayThreshold';
import type { TrafficData } from '@/types/shared/traffic.types';
import { Result } from '@/core/base/utils/Result';
import { ValidationError } from '@/core/base/errors/BaseError';

export const POST = createApiHandler(async (request) => {
  const body = await parseJsonBody<{
    delayMinutes: number;
    thresholdMinutes?: number;
  }>(request);

  const { delayMinutes, thresholdMinutes = 30 } = body;

  // Validate input
  if (typeof delayMinutes !== 'number') {
    return Result.fail(new ValidationError('delayMinutes must be a number'));
  }

  if (delayMinutes < 0) {
    return Result.fail(new ValidationError('delayMinutes cannot be negative'));
  }

  // Create mock traffic data with the provided delay
  const trafficData: TrafficData = {
    provider: 'google',
    delayMinutes,
    trafficCondition: delayMinutes > 60 ? 'severe' : delayMinutes > 30 ? 'heavy' : 'moderate',
    estimatedDuration: 3600 + delayMinutes * 60,
    normalDuration: 3600,
    fetchedAt: new Date(),
  };

  // Execute threshold check and transform result using Result.map
  const useCase = new CheckDelayThresholdUseCase();

  return Result.map(
    useCase.execute(trafficData, thresholdMinutes),
    (data) => ({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    })
  );
});

export const GET = createApiHandler(async () => {
  return Result.ok({
    message: 'Threshold Check API',
    description: 'POST with { delayMinutes: number, thresholdMinutes?: number }',
    examples: [
      { delayMinutes: 15, thresholdMinutes: 30, expected: 'NO notification' },
      { delayMinutes: 45, thresholdMinutes: 30, expected: 'Send notification' },
    ],
  });
});