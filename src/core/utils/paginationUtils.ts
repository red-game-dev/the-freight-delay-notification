/**
 * Pagination utilities for consistent pagination across the API
 */

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
  hasPrevious: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

/**
 * Create a paginated response from an array of items
 */
export function createPaginatedResponse<T>(
  items: T[],
  page: number,
  limit: number
): PaginatedResponse<T> {
  const total = items.length;
  const totalPages = Math.ceil(total / limit);
  const offset = (page - 1) * limit;
  const paginatedItems = items.slice(offset, offset + limit);

  return {
    data: paginatedItems,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasMore: page < totalPages,
      hasPrevious: page > 1,
    },
  };
}

/**
 * Parse pagination query parameters from request
 */
export function parsePaginationParams(
  pageParam?: string | null,
  limitParam?: string | null,
  maxLimit: number = 100
): { page: number; limit: number } {
  const page = Math.max(1, parseInt(pageParam || '1', 10));
  const limit = Math.min(
    Math.max(1, parseInt(limitParam || '20', 10)),
    maxLimit
  );

  return { page, limit };
}
