/**
 * Traffic Monitoring Cron Job
 * Automatically checks traffic for all active routes and triggers delay notifications
 *
 * This endpoint should be called periodically (e.g., every 5-15 minutes) by Vercel Cron
 * or any other scheduling service to monitor real-time traffic conditions.
 */

import { NextRequest } from 'next/server';
import { TrafficService } from '@/infrastructure/adapters/traffic/TrafficService';
import { getDatabaseService } from '@/infrastructure/database';
import { getTemporalClient } from '@/infrastructure/temporal/TemporalClient';
import { DelayNotificationWorkflow } from '@/workflows/workflows';
import { env } from '@/infrastructure/config/EnvValidator';
import { logger, getErrorMessage } from '@/core/base/utils/Logger';
import { getCurrentISOTimestamp, subtractHours } from '@/core/utils/dateUtils';
import { capitalizeFirstLetter } from '@/core/utils/stringUtils';
import { createWorkflowId, WorkflowType } from '@/core/utils/workflowUtils';
import { Result } from '@/core/base/utils/Result';
import { UnauthorizedError, InfrastructureError } from '@/core/base/errors/BaseError';
import type { TrafficCondition } from '@/core/types';
import { createApiHandler } from '@/core/infrastructure/http';

// Prevent response caching
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface TrafficCheckResult {
  routesChecked: number;
  snapshotsSaved: number;
  delaysDetected: number;
  notificationsTriggered: number;
  errors: string[];
}

export const GET = createApiHandler(async (request: NextRequest) => {
  // Verify authorization (cron secret or API key)
  const authHeader = request.headers.get('authorization');
  const cronSecret = env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return Result.fail(new UnauthorizedError('Invalid or missing authorization token'));
  }

  logger.info('🚦 [Traffic Monitor] Starting traffic check cycle...');

  const result: TrafficCheckResult = {
    routesChecked: 0,
    snapshotsSaved: 0,
    delaysDetected: 0,
    notificationsTriggered: 0,
    errors: [],
  };

  try {
    const db = getDatabaseService();
    const trafficService = new TrafficService();

    // 1. Get all routes (limit 1000 to get all routes)
    const routesResult = await db.listRoutes(1000, 0);

    if (!routesResult.success) {
      throw new InfrastructureError(`Failed to fetch routes: ${routesResult.error.message}`, { error: routesResult.error });
    }

    const routes = routesResult.value;

    if (!routes || !Array.isArray(routes)) {
      logger.error('❌ [Debug] Invalid routes structure:', routesResult);
      throw new InfrastructureError('Invalid routes data structure', { routesResult });
    }

    logger.info(`📍 [Traffic Monitor] Found ${routes.length} routes to check`);
    logger.info(`📍 [Traffic Monitor] Sample route coords:`, {
      origin: routes[0]?.origin_coords,
      destination: routes[0]?.destination_coords,
    });

    // 2. Get active deliveries (in_transit or delayed status)
    const inTransitResult = await db.listDeliveriesByStatus('in_transit');
    const delayedResult = await db.listDeliveriesByStatus('delayed');

    if (!inTransitResult.success || !delayedResult.success) {
      throw new InfrastructureError('Failed to fetch active deliveries', {
        inTransitError: inTransitResult.success ? null : inTransitResult.error,
        delayedError: delayedResult.success ? null : delayedResult.error
      });
    }

    const activeDeliveries = [...inTransitResult.value, ...delayedResult.value];
    logger.info(`📦 [Traffic Monitor] Found ${activeDeliveries.length} active deliveries`);

    // Create a map of route_id to deliveries for quick lookup
    const deliveriesByRoute = new Map<string, typeof activeDeliveries>();
    for (const delivery of activeDeliveries) {
      const existing = deliveriesByRoute.get(delivery.route_id) || [];
      existing.push(delivery);
      deliveriesByRoute.set(delivery.route_id, existing);
    }

    // 3. Check traffic for each route
    for (const route of routes) {
      try {
        // Skip routes without valid coordinates
        if (
          !route.origin_coords ||
          !route.destination_coords ||
          route.origin_coords.x == null ||
          route.origin_coords.y == null ||
          route.destination_coords.x == null ||
          route.destination_coords.y == null
        ) {
          logger.info(`⏭️  [Traffic Monitor] Skipping route ${route.id} - missing coordinates`);
          continue;
        }

        result.routesChecked++;

        // Fetch real-time traffic data
        const trafficResult = await trafficService.getTrafficData({
          origin: route.origin_address,
          destination: route.destination_address,
        });

        if (!trafficResult.success) {
          logger.error(`❌ [Traffic Monitor] Failed to fetch traffic for route ${route.id}:`, trafficResult.error.message);
          result.errors.push(`Route ${route.id}: ${trafficResult.error.message}`);
          continue;
        }

        const trafficData = trafficResult.value;
        logger.info(`🚦 [Traffic Monitor] Got traffic data:`, {
          route: route.id,
          delay: trafficData.delayMinutes,
          condition: trafficData.trafficCondition,
          provider: trafficData.provider,
        });

        // Generate incident details based on traffic condition
        const severity = trafficData.delayMinutes > 60 ? 'severe' :
                        trafficData.delayMinutes > 30 ? 'major' :
                        trafficData.delayMinutes > 15 ? 'moderate' : 'minor';

        const incidentType = trafficData.delayMinutes > 45 ? 'accident' as const :
                            trafficData.delayMinutes > 20 ? 'congestion' as const :
                            'congestion' as const;

        const description = `${capitalizeFirstLetter(trafficData.trafficCondition)} traffic conditions causing ${trafficData.delayMinutes} minute delay`;

        const affectedArea = `Route from ${route.origin_address.split(',')[0]} to ${route.destination_address.split(',')[0]}`;

        // Calculate incident location (midpoint of route)
        // Only set if coordinates are valid (not null)
        let incidentLocation: { x: number; y: number } | undefined;
        if (
          route.origin_coords &&
          route.destination_coords &&
          route.origin_coords.x != null &&
          route.origin_coords.y != null &&
          route.destination_coords.x != null &&
          route.destination_coords.y != null
        ) {
          incidentLocation = {
            x: (route.origin_coords.x + route.destination_coords.x) / 2,
            y: (route.origin_coords.y + route.destination_coords.y) / 2,
          };
        }

        // 4. Update routes table with latest traffic condition
        // ALWAYS update distance and normal duration from Google Maps (source of truth)
        const updateData: {
          current_duration_seconds: number;
          traffic_condition: TrafficCondition;
          distance_meters: number;
          normal_duration_seconds: number;
        } = {
          current_duration_seconds: Math.round(trafficData.estimatedDuration),
          traffic_condition: trafficData.trafficCondition,
          distance_meters: Math.round(trafficData.distance?.value || 0),
          normal_duration_seconds: Math.round(trafficData.normalDuration),
        };

        const updateRouteResult = await db.updateRoute(route.id, updateData);

        if (!updateRouteResult.success) {
          logger.error(`❌ [Traffic Monitor] Failed to update route ${route.id}:`, updateRouteResult.error);
          result.errors.push(`Failed to update route ${route.id}: ${updateRouteResult.error.message}`);
        } else {
          logger.info(`✅ [Traffic Monitor] Updated route ${route.id} with traffic: ${trafficData.trafficCondition.toUpperCase()} (${trafficData.delayMinutes}min delay)`);
        }

        // 5. Save traffic snapshot to database (historical log)
        const snapshotResult = await db.createTrafficSnapshot({
          route_id: route.id,
          traffic_condition: trafficData.trafficCondition,
          delay_minutes: trafficData.delayMinutes,
          duration_seconds: Math.round(trafficData.estimatedDuration), // PostgreSQL expects INTEGER
          description,
          severity,
          affected_area: affectedArea,
          incident_type: incidentType,
          incident_location: incidentLocation, // Will be undefined if coords are null
        });

        if (!snapshotResult.success) {
          logger.error(`❌ [Traffic Monitor] Failed to save snapshot for route ${route.id}:`, snapshotResult.error);
          result.errors.push(`Failed to save snapshot for route ${route.id}: ${snapshotResult.error.message}`);
          continue;
        }

        result.snapshotsSaved++;

        // 6. Check if any deliveries on this route are delayed
        const deliveriesOnRoute = deliveriesByRoute.get(route.id) || [];

        for (const delivery of deliveriesOnRoute) {
          // Only process if delay exceeds threshold
          if (trafficData.delayMinutes >= delivery.delay_threshold_minutes) {
            result.delaysDetected++;

            // Check if we should notify (avoid duplicate notifications)
            const notificationsResult = await db.listNotificationsByDelivery(delivery.id);

            if (!notificationsResult.success) {
              logger.warn(`⚠️ [Traffic Monitor] Could not fetch notifications for delivery ${delivery.id}`);
              continue;
            }

            // Only trigger if no notification was sent in the last hour
            const oneHourAgo = subtractHours(new Date(), 1);
            const recentNotification = notificationsResult.value.find(
              n => n.created_at && new Date(n.created_at) > oneHourAgo
            );

            if (!recentNotification) {
              try {
                // Get Temporal client
                const temporalClient = await getTemporalClient();

                // Trigger delay notification workflow
                await temporalClient.workflow.start(DelayNotificationWorkflow, {
                  taskQueue: env.TEMPORAL_TASK_QUEUE || 'freight-delay-notifications',
                  workflowId: createWorkflowId(WorkflowType.DELAY_NOTIFICATION, delivery.tracking_number),
                  args: [{
                    deliveryId: delivery.id,
                    trackingNumber: delivery.tracking_number,
                    customerId: delivery.customer_id,
                    routeId: delivery.route_id,
                    scheduledTime: delivery.scheduled_delivery instanceof Date
                      ? delivery.scheduled_delivery.toISOString()
                      : delivery.scheduled_delivery,
                    origin: {
                      address: route.origin_address,
                      coordinates: route.origin_coords ? {
                        lat: route.origin_coords.x,
                        lng: route.origin_coords.y,
                      } : undefined,
                    },
                    destination: {
                      address: route.destination_address,
                      coordinates: route.destination_coords ? {
                        lat: route.destination_coords.x,
                        lng: route.destination_coords.y,
                      } : undefined,
                    },
                    thresholdMinutes: delivery.delay_threshold_minutes,
                  }],
                });

                result.notificationsTriggered++;
                logger.info(`📧 [Traffic Monitor] Triggered notification for delivery ${delivery.tracking_number} (${trafficData.delayMinutes}min delay)`);
              } catch (workflowError: unknown) {
                logger.error(`❌ [Traffic Monitor] Failed to trigger workflow for ${delivery.tracking_number}:`, getErrorMessage(workflowError));
                result.errors.push(`Workflow trigger failed for ${delivery.tracking_number}: ${getErrorMessage(workflowError)}`);
              }
            } else {
              logger.info(`⏭️ [Traffic Monitor] Skipping notification for ${delivery.tracking_number} (recently notified)`);
            }
          }
        }
      } catch (routeError: unknown) {
        logger.error(`❌ [Traffic Monitor] Error processing route ${route.id}:`, getErrorMessage(routeError));
        result.errors.push(`Route ${route.id}: ${getErrorMessage(routeError)}`);
      }
    }

    logger.info('✅ [Traffic Monitor] Traffic check cycle completed', result);

    return Result.ok({
      success: true,
      timestamp: getCurrentISOTimestamp(),
      result,
    });

  } catch (error: unknown) {
    logger.error('❌ [Traffic Monitor] Fatal error:', error);

    return Result.fail(
      new InfrastructureError(`Traffic monitoring failed: ${getErrorMessage(error)}`, {
        cause: error,
        context: { partialResult: result },
      })
    );
  }
});
