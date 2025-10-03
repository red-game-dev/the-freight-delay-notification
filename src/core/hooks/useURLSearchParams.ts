/**
 * URL Search Params Hooks
 * Reusable hooks for managing URL-based state (pagination, filters, etc.)
 */

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useState, useEffect, useRef } from 'react';

/**
 * Generic hook for managing URL search parameters
 * Provides utilities for getting, setting, and deleting URL params
 */
export function useURLParams() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateParams = useCallback(
    (updates: Record<string, string | null>, options?: { scroll?: boolean }) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === '') {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });

      const query = params.toString();
      router.push(query ? `?${query}` : '', { scroll: options?.scroll ?? false });
    },
    [router, searchParams]
  );

  const getParam = useCallback(
    (key: string, defaultValue?: string): string => {
      return searchParams.get(key) || defaultValue || '';
    },
    [searchParams]
  );

  const getParamAsNumber = useCallback(
    (key: string, defaultValue: number): number => {
      const value = searchParams.get(key);
      return value ? parseInt(value, 10) : defaultValue;
    },
    [searchParams]
  );

  const deleteParam = useCallback(
    (key: string, options?: { scroll?: boolean }) => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete(key);
      const query = params.toString();
      router.push(query ? `?${query}` : '', { scroll: options?.scroll ?? false });
    },
    [router, searchParams]
  );

  const clearAll = useCallback(
    (options?: { scroll?: boolean }) => {
      router.push('', { scroll: options?.scroll ?? false });
    },
    [router]
  );

  return {
    updateParams,
    getParam,
    getParamAsNumber,
    deleteParam,
    clearAll,
    searchParams,
  };
}

/**
 * Hook for managing pagination via URL search params
 * Uses optimistic updates to prevent race conditions from rapid clicks
 * @example
 * const { page, setPage, resetPage } = useURLPagination();
 */
export function useURLPagination(defaultPage = 1) {
  const { getParamAsNumber, updateParams } = useURLParams();
  const urlPage = getParamAsNumber('page', defaultPage);

  // Optimistic local state for immediate updates
  const [optimisticPage, setOptimisticPage] = useState(urlPage);
  const pendingPageRef = useRef<number | null>(null);

  // Sync optimistic state with URL when URL changes externally
  useEffect(() => {
    // Only sync if there's no pending update
    if (pendingPageRef.current === null) {
      setOptimisticPage(urlPage);
    } else if (pendingPageRef.current === urlPage) {
      // Pending update completed
      pendingPageRef.current = null;
    }
  }, [urlPage]);

  const setPage = useCallback(
    (newPage: number) => {
      // Immediately update optimistic state
      setOptimisticPage(newPage);
      pendingPageRef.current = newPage;

      // Update URL (async)
      if (newPage === defaultPage) {
        updateParams({ page: null }); // Remove default page from URL
      } else {
        updateParams({ page: newPage.toString() });
      }
    },
    [defaultPage, updateParams]
  );

  const resetPage = useCallback(() => {
    setOptimisticPage(defaultPage);
    pendingPageRef.current = defaultPage;
    updateParams({ page: null });
  }, [defaultPage, updateParams]);

  return {
    page: optimisticPage,
    setPage,
    resetPage,
  };
}

/**
 * Hook for managing a single filter via URL search params
 * Uses optimistic updates to prevent race conditions from rapid clicks
 * @example
 * const { filter, setFilter, resetFilter } = useURLFilter('status', 'all');
 */
export function useURLFilter<T extends string>(
  paramName: string,
  defaultValue: T
) {
  const { getParam, updateParams } = useURLParams();
  const urlFilter = getParam(paramName, defaultValue) as T;

  // Optimistic local state for immediate updates
  const [optimisticFilter, setOptimisticFilter] = useState(urlFilter);
  const pendingFilterRef = useRef<T | null>(null);

  // Sync optimistic state with URL when URL changes externally
  useEffect(() => {
    if (pendingFilterRef.current === null) {
      setOptimisticFilter(urlFilter);
    } else if (pendingFilterRef.current === urlFilter) {
      pendingFilterRef.current = null;
    }
  }, [urlFilter]);

  const setFilter = useCallback(
    (newFilter: T, resetPage = false) => {
      // Immediately update optimistic state
      setOptimisticFilter(newFilter);
      pendingFilterRef.current = newFilter;

      // Update URL (async)
      const updates: Record<string, string | null> = {
        [paramName]: newFilter === defaultValue ? null : newFilter,
      };

      if (resetPage) {
        updates.page = null; // Reset page when filter changes
      }

      updateParams(updates);
    },
    [paramName, defaultValue, updateParams]
  );

  const resetFilter = useCallback(() => {
    setOptimisticFilter(defaultValue);
    pendingFilterRef.current = defaultValue;
    updateParams({ [paramName]: null });
  }, [paramName, defaultValue, updateParams]);

  return {
    filter: optimisticFilter,
    setFilter,
    resetFilter,
  };
}

/**
 * Hook for managing multiple filters via URL search params
 * @example
 * const { filters, setFilter, resetFilter, clearFilters } = useURLFilters({
 *   status: 'all',
 *   priority: 'high'
 * });
 */
export function useURLFilters<T extends Record<string, string>>(
  defaultFilters: T
) {
  const { getParam, updateParams } = useURLParams();

  const filters = Object.keys(defaultFilters).reduce((acc, key) => {
    acc[key as keyof T] = getParam(key, defaultFilters[key]) as T[keyof T];
    return acc;
  }, {} as T);

  const setFilter = useCallback(
    (key: keyof T, value: T[keyof T], resetPage = true) => {
      const updates: Record<string, string | null> = {
        [key as string]: value === defaultFilters[key] ? null : value,
      };

      if (resetPage) {
        updates.page = null; // Reset page when filter changes
      }

      updateParams(updates);
    },
    [defaultFilters, updateParams]
  );

  const resetFilter = useCallback(
    (key: keyof T) => {
      updateParams({ [key as string]: null });
    },
    [updateParams]
  );

  const clearFilters = useCallback(() => {
    const updates: Record<string, string | null> = {};
    Object.keys(defaultFilters).forEach((key) => {
      updates[key] = null;
    });
    updateParams(updates);
  }, [defaultFilters, updateParams]);

  return {
    filters,
    setFilter,
    resetFilter,
    clearFilters,
  };
}

/**
 * Combined hook for pagination + single filter
 * Most common use case for list pages
 * @example
 * const { page, setPage, filter, setFilter } = useURLPaginationWithFilter('status', 'all');
 */
export function useURLPaginationWithFilter<T extends string>(
  filterName: string,
  defaultFilter: T,
  defaultPage = 1,
  options?: { resetPageOnFilter?: boolean }
) {
  const pagination = useURLPagination(defaultPage);
  const { filter, setFilter: setFilterBase, resetFilter } = useURLFilter(filterName, defaultFilter);

  const setFilter = useCallback(
    (newFilter: T) => {
      setFilterBase(newFilter, options?.resetPageOnFilter ?? false);
    },
    [setFilterBase, options?.resetPageOnFilter]
  );

  return {
    page: pagination.page,
    setPage: pagination.setPage,
    resetPage: pagination.resetPage,
    filter,
    setFilter,
    resetFilter,
  };
}
