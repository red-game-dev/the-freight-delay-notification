/**
 * User Settings Store
 * Manages user-specific settings in localStorage (no authentication required)
 * Settings are per-user based on their email/session
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UserSettings {
  // Reference to DB customer (this browser's user)
  customerId: string | null;

  // Future extensibility
  preferences?: {
    [key: string]: unknown;
  };
}

interface UserSettingsStore {
  settings: UserSettings | null;

  // Actions
  setCustomerId: (customerId: string | null) => void;
  updatePreference: (key: string, value: unknown) => void;
  clearSettings: () => void;

  // Getters
  getCustomerId: () => string | null;
}

const defaultSettings: UserSettings = {
  customerId: null,
  preferences: {},
};

export const useUserSettingsStore = create<UserSettingsStore>()(
  persist(
    (set, get) => ({
      settings: defaultSettings,

      setCustomerId: (customerId) =>
        set((state) => ({
          settings: {
            ...state.settings!,
            customerId,
          },
        })),

      updatePreference: (key, value) =>
        set((state) => ({
          settings: {
            ...state.settings!,
            preferences: {
              ...state.settings!.preferences,
              [key]: value,
            },
          },
        })),

      clearSettings: () => set({ settings: defaultSettings }),

      getCustomerId: () => get().settings?.customerId || null,
    }),
    {
      name: 'freight-delay-user-settings', // localStorage key
      version: 4,
      migrate: (persistedState: any, version: number) => {
        // Migrate from older versions to version 4
        if (version < 4) {
          // Reset to default structure for any version < 4
          return {
            settings: {
              customerId: persistedState?.settings?.customerId || null,
              preferences: {},
            },
          };
        }
        return persistedState;
      },
    }
  )
);
