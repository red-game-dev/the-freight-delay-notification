/**
 * Traffic Monitoring Cron Job
 * Automatically checks traffic for all active routes and triggers delay notifications
 *
 * This endpoint should be called periodically (e.g., every 5-15 minutes) by Vercel Cron
 * or any other scheduling service to monitor real-time traffic conditions.
 */

import type { NextRequest } from "next/server";
import {
  InfrastructureError,
  UnauthorizedError,
} from "@/core/base/errors/BaseError";
import { getErrorMessage, logger } from "@/core/base/utils/Logger";
import { Result } from "@/core/base/utils/Result";
import { createApiHandler } from "@/core/infrastructure/http";
import type { TrafficCondition } from "@/core/types";
import { getCurrentISOTimestamp } from "@/core/utils/dateUtils";
import { capitalizeFirstLetter } from "@/core/utils/stringUtils";
import { TrafficService } from "@/infrastructure/adapters/traffic/TrafficService";
import { env } from "@/infrastructure/config/EnvValidator";
import { getDatabaseService } from "@/infrastructure/database";

// Prevent response caching
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface TrafficCheckResult {
  routesChecked: number;
  snapshotsSaved: number;
  delaysDetected: number;
  notificationsTriggered: number;
  errors: string[];
}

export const GET = createApiHandler(async (request: NextRequest) => {
  // Verify authorization (cron secret or API key)
  const authHeader = request.headers.get("authorization");
  const cronSecret = env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return Result.fail(
      new UnauthorizedError("Invalid or missing authorization token"),
    );
  }

  logger.info("🚦 [Traffic Monitor] Starting traffic check cycle...");

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
      throw new InfrastructureError(
        `Failed to fetch routes: ${routesResult.error.message}`,
        { error: routesResult.error },
      );
    }

    const routes = routesResult.value;

    if (!routes || !Array.isArray(routes)) {
      logger.error("❌ [Debug] Invalid routes structure:", routesResult);
      throw new InfrastructureError("Invalid routes data structure", {
        routesResult,
      });
    }

    logger.info(`📍 [Traffic Monitor] Found ${routes.length} routes to check`);
    logger.info(`📍 [Traffic Monitor] Sample route coords:`, {
      origin: routes[0]?.origin_coords,
      destination: routes[0]?.destination_coords,
    });

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
          logger.info(
            `⏭️  [Traffic Monitor] Skipping route ${route.id} - missing coordinates`,
          );
          continue;
        }

        result.routesChecked++;

        // Fetch real-time traffic data
        const trafficResult = await trafficService.getTrafficData({
          origin: route.origin_address,
          destination: route.destination_address,
        });

        if (!trafficResult.success) {
          logger.error(
            `❌ [Traffic Monitor] Failed to fetch traffic for route ${route.id}:`,
            trafficResult.error.message,
          );
          result.errors.push(
            `Route ${route.id}: ${trafficResult.error.message}`,
          );
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
        const severity =
          trafficData.delayMinutes > 60
            ? "severe"
            : trafficData.delayMinutes > 30
              ? "major"
              : trafficData.delayMinutes > 15
                ? "moderate"
                : "minor";

        const incidentType =
          trafficData.delayMinutes > 45
            ? ("accident" as const)
            : trafficData.delayMinutes > 20
              ? ("congestion" as const)
              : ("congestion" as const);

        const description = `${capitalizeFirstLetter(trafficData.trafficCondition)} traffic conditions causing ${trafficData.delayMinutes} minute delay`;

        const affectedArea = `Route from ${route.origin_address.split(",")[0]} to ${route.destination_address.split(",")[0]}`;

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
          logger.error(
            `❌ [Traffic Monitor] Failed to update route ${route.id}:`,
            updateRouteResult.error,
          );
          result.errors.push(
            `Failed to update route ${route.id}: ${updateRouteResult.error.message}`,
          );
        } else {
          logger.info(
            `✅ [Traffic Monitor] Updated route ${route.id} with traffic: ${trafficData.trafficCondition.toUpperCase()} (${trafficData.delayMinutes}min delay)`,
          );
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
          logger.error(
            `❌ [Traffic Monitor] Failed to save snapshot for route ${route.id}:`,
            snapshotResult.error,
          );
          result.errors.push(
            `Failed to save snapshot for route ${route.id}: ${snapshotResult.error.message}`,
          );
          continue;
        }

        result.snapshotsSaved++;
      } catch (routeError: unknown) {
        logger.error(
          `❌ [Traffic Monitor] Error processing route ${route.id}:`,
          getErrorMessage(routeError),
        );
        result.errors.push(`Route ${route.id}: ${getErrorMessage(routeError)}`);
      }
    }

    logger.info("✅ [Traffic Monitor] Traffic check cycle completed", result);

    return Result.ok({
      success: true,
      timestamp: getCurrentISOTimestamp(),
      result,
    });
  } catch (error: unknown) {
    logger.error("❌ [Traffic Monitor] Fatal error:", error);

    return Result.fail(
      new InfrastructureError(
        `Traffic monitoring failed: ${getErrorMessage(error)}`,
        {
          cause: error,
          context: { partialResult: result },
        },
      ),
    );
  }
});
