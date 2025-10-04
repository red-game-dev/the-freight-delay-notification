/**
 * UI Store
 * Centralized UI preferences and state management using Zustand
 *
 * Architecture:
 * - Manages UI preferences (expanded items, view modes, etc.)
 * - Persists user preferences across sessions
 * - Supports per-page and global UI state
 * - Type-safe with TypeScript generics
 */

import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

// ============================================================================
// UI State Interfaces
// ============================================================================

interface ExpandedItemsState {
  [pageKey: string]: Set<string>;
}

interface ViewModeState {
  [pageKey: string]: "list" | "grid" | "compact";
}

interface UIStore {
  // Expanded/collapsed items (e.g., accordion, tree views, expandable lists)
  expandedItems: ExpandedItemsState;
  toggleExpanded: (pageKey: string, itemId: string) => void;
  setExpanded: (pageKey: string, itemId: string, expanded: boolean) => void;
  clearExpanded: (pageKey: string) => void;
  isExpanded: (pageKey: string, itemId: string) => boolean;

  // View mode preferences (list/grid/compact views)
  viewModes: ViewModeState;
  setViewMode: (pageKey: string, mode: "list" | "grid" | "compact") => void;
  getViewMode: (pageKey: string) => "list" | "grid" | "compact";

  // Sidebar collapsed state
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;

  // Theme preference (if not using next-themes)
  theme: "light" | "dark" | "system";
  setTheme: (theme: "light" | "dark" | "system") => void;

  // Clear all UI state
  clearAll: () => void;
}

// ============================================================================
// Store Implementation
// ============================================================================

export const useUIStore = create<UIStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        expandedItems: {},
        viewModes: {},
        sidebarCollapsed: false,
        theme: "system",

        // Toggle expanded state for an item
        toggleExpanded: (pageKey, itemId) => {
          set((state) => {
            const pageExpanded = state.expandedItems[pageKey] || new Set();
            const newSet = new Set(pageExpanded);

            if (newSet.has(itemId)) {
              newSet.delete(itemId);
            } else {
              newSet.add(itemId);
            }

            return {
              expandedItems: {
                ...state.expandedItems,
                [pageKey]: newSet,
              },
            };
          });
        },

        // Set expanded state for an item
        setExpanded: (pageKey, itemId, expanded) => {
          set((state) => {
            const pageExpanded = state.expandedItems[pageKey] || new Set();
            const newSet = new Set(pageExpanded);

            if (expanded) {
              newSet.add(itemId);
            } else {
              newSet.delete(itemId);
            }

            return {
              expandedItems: {
                ...state.expandedItems,
                [pageKey]: newSet,
              },
            };
          });
        },

        // Clear all expanded items for a page
        clearExpanded: (pageKey) => {
          set((state) => ({
            expandedItems: {
              ...state.expandedItems,
              [pageKey]: new Set(),
            },
          }));
        },

        // Check if an item is expanded
        isExpanded: (pageKey, itemId) => {
          const pageExpanded = get().expandedItems[pageKey];
          return pageExpanded ? pageExpanded.has(itemId) : false;
        },

        // Set view mode for a page
        setViewMode: (pageKey, mode) => {
          set((state) => ({
            viewModes: {
              ...state.viewModes,
              [pageKey]: mode,
            },
          }));
        },

        // Get view mode for a page (default: 'list')
        getViewMode: (pageKey) => {
          return get().viewModes[pageKey] || "list";
        },

        // Toggle sidebar collapsed state
        toggleSidebar: () => {
          set((state) => ({
            sidebarCollapsed: !state.sidebarCollapsed,
          }));
        },

        // Set sidebar collapsed state
        setSidebarCollapsed: (collapsed) => {
          set({ sidebarCollapsed: collapsed });
        },

        // Set theme preference
        setTheme: (theme) => {
          set({ theme });
        },

        // Clear all UI state
        clearAll: () => {
          set({
            expandedItems: {},
            viewModes: {},
            sidebarCollapsed: false,
            theme: "system",
          });
        },
      }),
      {
        name: "freight-delay-ui-store",
        // Custom serialization for Sets
        partialize: (state) => ({
          expandedItems: Object.fromEntries(
            Object.entries(state.expandedItems).map(([key, set]) => [
              key,
              Array.from(set),
            ]),
          ),
          viewModes: state.viewModes,
          sidebarCollapsed: state.sidebarCollapsed,
          theme: state.theme,
        }),
        // Custom deserialization for Sets
        merge: (persistedState: unknown, currentState) => ({
          ...currentState,
          ...(persistedState as Record<string, unknown>),
          expandedItems: Object.fromEntries(
            Object.entries(
              (persistedState as { expandedItems?: Record<string, unknown> })
                .expandedItems || {},
            ).map(([key, arr]) => [key, new Set(arr as string[])]),
          ),
        }),
      },
    ),
    {
      name: "ui-store",
    },
  ),
);

// ============================================================================
// Typed Selector Hooks
// ============================================================================

/**
 * Hook for managing expanded items on a specific page
 * @example
 * const { isExpanded, toggle, clear } = useExpandedItems('monitoring');
 * toggle('snapshot-123');
 */
export function useExpandedItems(pageKey: string) {
  const toggleExpanded = useUIStore((state) => state.toggleExpanded);
  const setExpanded = useUIStore((state) => state.setExpanded);
  const clearExpanded = useUIStore((state) => state.clearExpanded);
  const isExpanded = useUIStore((state) => state.isExpanded);

  return {
    isExpanded: (itemId: string) => isExpanded(pageKey, itemId),
    toggle: (itemId: string) => toggleExpanded(pageKey, itemId),
    set: (itemId: string, expanded: boolean) =>
      setExpanded(pageKey, itemId, expanded),
    clear: () => clearExpanded(pageKey),
  };
}

/**
 * Hook for managing view mode on a specific page
 * @example
 * const { viewMode, setViewMode } = useViewMode('deliveries');
 * setViewMode('grid');
 */
export function useViewMode(pageKey: string) {
  const viewMode = useUIStore((state) => state.getViewMode(pageKey));
  const setViewMode = useUIStore((state) => state.setViewMode);

  return {
    viewMode,
    setViewMode: (mode: "list" | "grid" | "compact") =>
      setViewMode(pageKey, mode),
  };
}
