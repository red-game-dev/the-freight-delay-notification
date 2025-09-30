/**
 * Threshold Check API Route
 * Test endpoint for PDF Step 2: Threshold checking logic
 */

import { NextRequest } from 'next/server';
import { CheckDelayThresholdUseCase } from '@/core/engine/delivery/CheckDelayThreshold';
import type { TrafficData } from '@/types/shared/traffic.types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { delayMinutes, thresholdMinutes = 30 } = body;

    // Validate input
    if (typeof delayMinutes !== 'number') {
      return Response.json(
        { error: 'delayMinutes must be a number' },
        { status: 400 }
      );
    }

    if (delayMinutes < 0) {
      return Response.json(
        { error: 'delayMinutes cannot be negative' },
        { status: 400 }
      );
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

    // Execute threshold check
    const useCase = new CheckDelayThresholdUseCase();
    const result = useCase.execute(trafficData, thresholdMinutes);

    if (!result.success) {
      return Response.json(
        { error: result.error.message },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      data: result.value,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Threshold check API error:', error);
    return Response.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  return Response.json({
    message: 'Threshold Check API',
    description: 'POST with { delayMinutes: number, thresholdMinutes?: number }',
    examples: [
      { delayMinutes: 15, thresholdMinutes: 30, expected: 'NO notification' },
      { delayMinutes: 45, thresholdMinutes: 30, expected: 'Send notification' },
    ],
  });
}