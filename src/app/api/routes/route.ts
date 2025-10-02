/**
 * Routes API
 * GET /api/routes - List all delivery routes with current traffic status
 */

import { createClient } from '@supabase/supabase-js';
import { env } from '@/infrastructure/config/EnvValidator';
import { createApiHandler } from '@/core/infrastructure/http';
import { Result } from '@/core/base/utils/Result';

/**
 * Parse PostGIS POINT to {x, y} format
 * PostGIS returns POINT as string "(lng,lat)" or object
 */
function parsePostGISPoint(point: any): { x: number; y: number } | null {
  if (!point) return null;

  // If already an object with x/y
  if (typeof point === 'object' && 'x' in point && 'y' in point) {
    return { x: point.x, y: point.y };
  }

  // If string format "(lng,lat)"
  if (typeof point === 'string') {
    const match = point.match(/\(([^,]+),([^)]+)\)/);
    if (match) {
      return {
        x: parseFloat(match[2]), // lat
        y: parseFloat(match[1]), // lng
      };
    }
  }

  return null;
}

/**
 * GET /api/routes
 * Returns all routes with their latest traffic snapshot
 */
export const GET = createApiHandler(async () => {
  const supabase = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL!,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await supabase
    .from('routes')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    return Result.fail(new Error(error.message));
  }

  // Transform PostGIS POINT data to proper format
  const transformedData = (data || []).map((route: any) => ({
    ...route,
    origin_coords: parsePostGISPoint(route.origin_coords),
    destination_coords: parsePostGISPoint(route.destination_coords),
  }));

  console.log('🗺️ [Routes API] Sample route coords:', {
    raw: data?.[0]?.origin_coords,
    transformed: transformedData?.[0]?.origin_coords,
  });

  return Result.ok(transformedData);
});
