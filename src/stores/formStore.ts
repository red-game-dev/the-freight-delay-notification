/**
 * Form Store
 * Centralized form state management using Zustand
 *
 * Architecture:
 * - Generic store for managing any form type
 * - Handles form drafts for unsaved changes
 * - Manages form defaults per form type
 * - Supports form state persistence and restoration
 * - Type-safe with TypeScript generics
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { Delivery, UpdateDeliveryInput, CreateDeliveryInput } from '@/core/infrastructure/http/services/deliveries';
import type { Threshold, CreateThresholdInput } from '@/core/infrastructure/http/services/thresholds';

// ============================================================================
// Form Type Definitions
// ============================================================================

/**
 * Form type registry mapping form types to their data types
 * Add new form types here to enable type inference
 */
export interface FormTypeRegistry {
  'delivery-new': CreateDeliveryInput;
  'delivery-edit': UpdateDeliveryInput;
  'threshold-create': CreateThresholdInput;
  'threshold-edit': CreateThresholdInput;
}

export type FormType = keyof FormTypeRegistry;

// ============================================================================
// Form Defaults Registry
// ============================================================================

const INITIAL_DELIVERY_DEFAULTS: Partial<CreateDeliveryInput> = {
  auto_check_traffic: false,
  enable_recurring_checks: false,
  check_interval_minutes: 30,
  delay_threshold_minutes: 30,
  min_delay_change_threshold: 15,
  min_hours_between_notifications: 1.0,
};

const INITIAL_THRESHOLD_DEFAULTS: Partial<CreateThresholdInput> = {
  name: '',
  delay_minutes: 30,
  notification_channels: ['email'],
  is_default: false,
};

/**
 * Registry of initial defaults for each form type
 * Add new form types here to enable automatic reset
 */
const FORM_DEFAULTS_REGISTRY: {
  [K in FormType]: Partial<FormTypeRegistry[K]>;
} = {
  'delivery-new': INITIAL_DELIVERY_DEFAULTS,
  'delivery-edit': INITIAL_DELIVERY_DEFAULTS,
  'threshold-create': INITIAL_THRESHOLD_DEFAULTS,
  'threshold-edit': INITIAL_THRESHOLD_DEFAULTS,
};

// ============================================================================
// Store Interfaces
// ============================================================================

interface FormDraft<T = unknown> {
  formType: string;
  formId: string;
  data: Partial<T>;
  timestamp: number;
}

interface FormDefaults<T = unknown> {
  formType: string;
  defaults: Partial<T>;
}

interface FormStore {
  // State
  drafts: FormDraft[];
  defaults: FormDefaults[];

  // Draft management
  saveDraft: <T>(formType: string, formId: string, data: Partial<T>) => void;
  getDraft: <T>(formType: string, formId: string) => Partial<T> | null;
  clearDraft: (formType: string, formId: string) => void;
  clearDraftsByType: (formType: string) => void;
  clearAllDrafts: () => void;

  // Defaults management
  getDefaults: <T>(formType: string) => Partial<T> | null;
  setDefaults: <T>(formType: string, defaults: Partial<T>) => void;
  resetDefaults: (formType: string) => void;

  // Delivery-specific transformations
  deliveryToFormValues: (delivery: Delivery) => UpdateDeliveryInput;
  formValuesToUpdatePayload: (formData: UpdateDeliveryInput, status?: Delivery['status']) => UpdateDeliveryInput;

  // Threshold-specific transformations
  thresholdToFormValues: (threshold: Threshold) => CreateThresholdInput;
}

// ============================================================================
// Store Implementation
// ============================================================================

export const useFormStore = create<FormStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        drafts: [],
        defaults: Object.entries(FORM_DEFAULTS_REGISTRY).map(([formType, defaults]) => ({
          formType,
          defaults,
        })),

        // Save form draft for unsaved changes
        saveDraft: (formType, formId, data) => {
          set((state) => {
            const existingIndex = state.drafts.findIndex(
              (d) => d.formType === formType && d.formId === formId
            );

            const newDraft: FormDraft = {
              formType,
              formId,
              data,
              timestamp: Date.now(),
            };

            if (existingIndex >= 0) {
              // Update existing draft
              const updatedDrafts = [...state.drafts];
              updatedDrafts[existingIndex] = newDraft;
              return { drafts: updatedDrafts };
            } else {
              // Add new draft
              return { drafts: [...state.drafts, newDraft] };
            }
          });
        },

        // Get saved draft
        getDraft: (formType, formId) => {
          const draft = get().drafts.find(
            (d) => d.formType === formType && d.formId === formId
          );
          return draft ? draft.data : null;
        },

        // Clear specific draft
        clearDraft: (formType, formId) => {
          set((state) => ({
            drafts: state.drafts.filter(
              (d) => !(d.formType === formType && d.formId === formId)
            ),
          }));
        },

        // Clear all drafts of a specific form type
        clearDraftsByType: (formType) => {
          set((state) => ({
            drafts: state.drafts.filter((d) => d.formType !== formType),
          }));
        },

        // Clear all drafts
        clearAllDrafts: () => {
          set({ drafts: [] });
        },

        // Get default values for a form type
        getDefaults: (formType) => {
          const formDefaults = get().defaults.find((d) => d.formType === formType);
          return formDefaults ? formDefaults.defaults : null;
        },

        // Set default values for a form type
        setDefaults: (formType, defaults) => {
          set((state) => {
            const existingIndex = state.defaults.findIndex((d) => d.formType === formType);

            if (existingIndex >= 0) {
              // Update existing defaults
              const updatedDefaults = [...state.defaults];
              updatedDefaults[existingIndex] = {
                formType,
                defaults: { ...updatedDefaults[existingIndex].defaults, ...defaults },
              };
              return { defaults: updatedDefaults };
            } else {
              // Add new defaults
              return {
                defaults: [...state.defaults, { formType, defaults }],
              };
            }
          });
        },

        // Reset defaults for a form type to initial values from registry
        resetDefaults: (formType) => {
          const initialDefaults = FORM_DEFAULTS_REGISTRY[formType as FormType];

          if (initialDefaults) {
            set((state) => {
              const existingIndex = state.defaults.findIndex((d) => d.formType === formType);

              if (existingIndex >= 0) {
                // Update existing
                const updatedDefaults = [...state.defaults];
                updatedDefaults[existingIndex] = { formType, defaults: initialDefaults };
                return { defaults: updatedDefaults };
              } else {
                // Add new
                return {
                  defaults: [...state.defaults, { formType, defaults: initialDefaults }],
                };
              }
            });
          }
        },

        // Transform delivery to form values
        deliveryToFormValues: (delivery) => {
          return {
            tracking_number: delivery.tracking_number,
            origin: delivery.origin,
            destination: delivery.destination,
            // Format scheduled_delivery for datetime-local input (YYYY-MM-DDTHH:mm)
            scheduled_delivery: delivery.scheduled_delivery
              ? new Date(delivery.scheduled_delivery).toISOString().slice(0, 16)
              : '',
            customer_name: delivery.customer_name,
            customer_email: delivery.customer_email,
            customer_phone: delivery.customer_phone || '',
            notes: delivery.notes || '',
            auto_check_traffic: delivery.auto_check_traffic || false,
            enable_recurring_checks: delivery.enable_recurring_checks || false,
            check_interval_minutes: delivery.check_interval_minutes || 30,
            // Don't set max_checks if it's -1 (unlimited)
            max_checks: delivery.max_checks && delivery.max_checks !== -1 ? delivery.max_checks : undefined,
            delay_threshold_minutes: delivery.delay_threshold_minutes || 30,
            min_delay_change_threshold: delivery.min_delay_change_threshold || 15,
            min_hours_between_notifications: delivery.min_hours_between_notifications || 1.0,
          };
        },

        // Transform form values to API update payload
        formValuesToUpdatePayload: (formData, status) => {
          const payload: UpdateDeliveryInput = {
            ...formData,
          };

          // Add status if provided
          if (status) {
            payload.status = status;
          }

          // Clean up empty optional fields
          if (!payload.customer_phone) delete payload.customer_phone;
          if (!payload.notes) delete payload.notes;
          if (!payload.max_checks) delete payload.max_checks;

          return payload;
        },

        // Transform threshold to form values
        thresholdToFormValues: (threshold) => {
          return {
            name: threshold.name,
            delay_minutes: threshold.delay_minutes,
            notification_channels: threshold.notification_channels,
            is_default: threshold.is_default,
          };
        },
      }),
      {
        name: 'form-store',
        // Only persist drafts and defaults
        partialize: (state) => ({
          drafts: state.drafts,
          defaults: state.defaults,
        }),
      }
    ),
    {
      name: 'form-store',
    }
  )
);

// ============================================================================
// Typed Selector Hooks
// ============================================================================

/**
 * Get defaults for a specific form type with type inference
 * @example
 * const defaults = useFormDefaults('delivery-new'); // Type: Partial<CreateDeliveryInput> | null
 */
export function useFormDefaults<T extends FormType>(formType: T): Partial<FormTypeRegistry[T]> | null {
  return useFormStore((state) => state.getDefaults<FormTypeRegistry[T]>(formType));
}

/**
 * Get draft for a specific form type with type inference
 * @example
 * const draft = useFormDraft('delivery-new', deliveryId); // Type: Partial<CreateDeliveryInput> | null
 */
export function useFormDraft<T extends FormType>(
  formType: T,
  formId: string
): Partial<FormTypeRegistry[T]> | null {
  return useFormStore((state) => state.getDraft<FormTypeRegistry[T]>(formType, formId));
}

/**
 * Get form actions (save, clear, etc.) for a specific form type with type inference
 * @example
 * const { saveDraft, clearDraft } = useFormActions('delivery-new');
 * saveDraft(deliveryId, { tracking_number: 'FD-001' }); // Type-safe
 */
export function useFormActions<T extends FormType>(formType: T) {
  const saveDraft = useFormStore((state) => state.saveDraft);
  const clearDraft = useFormStore((state) => state.clearDraft);
  const setDefaults = useFormStore((state) => state.setDefaults);
  const resetDefaults = useFormStore((state) => state.resetDefaults);

  return {
    saveDraft: (formId: string, data: Partial<FormTypeRegistry[T]>) =>
      saveDraft<FormTypeRegistry[T]>(formType, formId, data),
    clearDraft: (formId: string) => clearDraft(formType, formId),
    setDefaults: (defaults: Partial<FormTypeRegistry[T]>) =>
      setDefaults<FormTypeRegistry[T]>(formType, defaults),
    resetDefaults: () => resetDefaults(formType),
  };
}
