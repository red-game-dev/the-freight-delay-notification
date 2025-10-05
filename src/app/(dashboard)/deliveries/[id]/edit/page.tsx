/**
 * Edit Delivery Page
 * Form for editing an existing delivery
 */

"use client";

import { ArrowLeft, Save } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DateTimePicker } from "@/components/ui/DateTimePicker";
import { Dropdown } from "@/components/ui/DropDown";
import { FormField, FormRow, FormSection } from "@/components/ui/FormField";
import { InfoBox } from "@/components/ui/InfoBox";
import { Input, Textarea } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { Select } from "@/components/ui/Select";
import { SkeletonPage } from "@/components/ui/Skeleton";
import { Toggle } from "@/components/ui/Toggle";
import { logger } from "@/core/base/utils/Logger";
import type {
  Delivery,
  UpdateDeliveryInput,
} from "@/core/infrastructure/http/services/deliveries";
import {
  useDelivery,
  useUpdateDelivery,
} from "@/core/infrastructure/http/services/deliveries";
import { useThresholds } from "@/core/infrastructure/http/services/thresholds";
import type { DeliveryStatus } from "@/core/types";
import { useFormStore } from "@/stores";

const statusOptions = [
  { label: "Pending", value: "pending" },
  { label: "In Transit", value: "in_transit" },
  { label: "Delayed", value: "delayed" },
  { label: "Delivered", value: "delivered" },
  { label: "Cancelled", value: "cancelled" },
];

const checkIntervalOptions = [
  {
    label: "Minutes",
    options: [
      { label: "Every 15 minutes", value: 15 },
      { label: "Every 30 minutes", value: 30 },
    ],
  },
  {
    label: "Hours",
    options: [
      { label: "Every 1 hour", value: 60 },
      { label: "Every 2 hours", value: 120 },
      { label: "Every 3 hours", value: 180 },
      { label: "Every 6 hours", value: 360 },
      { label: "Every 12 hours", value: 720 },
    ],
  },
  {
    label: "Days/Weeks",
    options: [
      { label: "Daily (every 24 hours)", value: 1440 },
      { label: "Weekly (every 7 days)", value: 10080 },
      { label: "Monthly (every 30 days)", value: 43200 },
    ],
  },
];

export default function EditDeliveryPage() {
  const router = useRouter();
  const params = useParams();
  const deliveryId = params?.id as string;

  const { data: delivery, isLoading, error } = useDelivery(deliveryId);
  const updateDelivery = useUpdateDelivery();

  // Fetch thresholds to show default value
  const { data: thresholds } = useThresholds();
  const defaultThreshold = thresholds?.find((t) => t.is_default);

  // Use Zustand form store for transformations
  const deliveryToFormValues = useFormStore(
    (state) => state.deliveryToFormValues,
  );
  const formValuesToUpdatePayload = useFormStore(
    (state) => state.formValuesToUpdatePayload,
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
  } = useForm<UpdateDeliveryInput>();

  const [status, setStatus] = useState<Delivery["status"]>("pending");

  // Pre-populate form when delivery loads
  useEffect(() => {
    if (delivery) {
      // Use reset() to set all values at once - much cleaner!
      reset(deliveryToFormValues(delivery));
      setStatus(delivery.status);
    }
  }, [delivery, reset, deliveryToFormValues]);

  const onSubmit = async (data: UpdateDeliveryInput) => {
    try {
      // Transform form data to API payload
      const payload = formValuesToUpdatePayload(data, status);

      await updateDelivery.mutateAsync({
        id: deliveryId,
        data: payload,
      });
      router.push(`/deliveries/${deliveryId}`);
    } catch (error) {
      logger.error("Failed to update delivery:", error);
    }
  };

  if (isLoading) {
    return <SkeletonPage />;
  }

  if (error || !delivery) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          leftIcon={<ArrowLeft className="h-4 w-4" />}
        >
          Back
        </Button>
        <Alert variant="error">
          Failed to load delivery.{" "}
          {error instanceof Error ? error.message : "Please try again."}
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={`Edit Delivery: ${delivery.tracking_number}`}
        description="Update delivery information"
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          leftIcon={<ArrowLeft className="h-4 w-4" />}
        >
          Back
        </Button>
      </PageHeader>

      {/* Form */}
      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="p-6">
          {/* Delivery Information */}
          <FormSection
            title="Delivery Information"
            description="Basic information about the delivery"
          >
            <FormRow columns={2}>
              <FormField>
                <Input
                  {...register("tracking_number", {
                    required: "Tracking number is required",
                  })}
                  label="Tracking Number"
                  placeholder="FD-2024-001"
                  error={errors.tracking_number?.message}
                  required
                  fullWidth
                />
              </FormField>

              <FormField>
                <Dropdown
                  label="Status"
                  options={statusOptions}
                  value={status}
                  onChange={(value) => setStatus(value as DeliveryStatus)}
                  required
                  fullWidth
                />
              </FormField>
            </FormRow>

            <FormRow columns={2}>
              <FormField>
                <DateTimePicker
                  {...register("scheduled_delivery", {
                    required: "Scheduled delivery is required",
                  })}
                  label="Scheduled Delivery"
                  error={errors.scheduled_delivery?.message}
                  required
                  fullWidth
                />
              </FormField>
            </FormRow>

            <FormRow columns={2}>
              <FormField>
                <Input
                  {...register("origin", {
                    required: "Origin is required",
                  })}
                  label="Origin Address"
                  placeholder="Downtown Los Angeles, CA"
                  error={errors.origin?.message}
                  helperText="Enter the pickup location"
                  required
                  fullWidth
                />
              </FormField>

              <FormField>
                <Input
                  {...register("destination", {
                    required: "Destination is required",
                  })}
                  label="Destination Address"
                  placeholder="LAX Airport, CA"
                  error={errors.destination?.message}
                  helperText="Enter the delivery location"
                  required
                  fullWidth
                />
              </FormField>
            </FormRow>

            <FormField>
              <Textarea
                {...register("notes")}
                label="Delivery Notes"
                placeholder="Any special instructions..."
                rows={3}
                error={errors.notes?.message}
                helperText="Optional: Add any special delivery instructions"
                fullWidth
              />
            </FormField>
          </FormSection>

          {/* Customer Information */}
          <FormSection
            title="Customer Information"
            description="Contact details for notifications"
          >
            <FormRow columns={1}>
              <FormField>
                <Input
                  {...register("customer_name", {
                    required: "Customer name is required",
                  })}
                  label="Customer Name"
                  placeholder="John Doe"
                  error={errors.customer_name?.message}
                  required
                  fullWidth
                />
              </FormField>
            </FormRow>

            <FormRow columns={2}>
              <FormField>
                <Input
                  {...register("customer_email", {
                    required: "Email is required",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Invalid email address",
                    },
                  })}
                  type="email"
                  label="Email Address"
                  placeholder="john@example.com"
                  error={errors.customer_email?.message}
                  helperText="Will receive email notifications"
                  required
                  fullWidth
                />
              </FormField>

              <FormField>
                <Input
                  {...register("customer_phone", {
                    pattern: {
                      value: /^[\d\s+()-]+$/,
                      message: "Invalid phone number",
                    },
                  })}
                  type="tel"
                  label="Phone Number"
                  placeholder="+1 (555) 123-4567"
                  error={errors.customer_phone?.message}
                  helperText="Optional: For SMS notifications"
                  fullWidth
                />
              </FormField>
            </FormRow>
          </FormSection>

          {/* Workflow Settings */}
          <FormSection
            title="Workflow Settings"
            description="Configure automatic traffic monitoring"
          >
            <FormField>
              <Input
                {...register("delay_threshold_minutes", {
                  valueAsNumber: true,
                  min: { value: 1, message: "Must be at least 1 minute" },
                  max: {
                    value: 1440,
                    message: "Cannot exceed 1440 minutes (24 hours)",
                  },
                })}
                type="number"
                label="Delay Threshold (minutes)"
                placeholder={
                  defaultThreshold
                    ? `Default: ${defaultThreshold.delay_minutes} minutes`
                    : "Leave empty to use default"
                }
                helperText={
                  defaultThreshold
                    ? `Leave empty to use default threshold (${defaultThreshold.delay_minutes} minutes - ${defaultThreshold.name})`
                    : "Leave empty to use default threshold from Settings."
                }
                error={errors.delay_threshold_minutes?.message}
                fullWidth
              />
            </FormField>

            <FormField>
              <div className="space-y-1">
                <Toggle
                  checked={!!watch("auto_check_traffic")}
                  onChange={(checked) =>
                    setValue("auto_check_traffic", checked)
                  }
                  label="Automatically check traffic on creation"
                />
                <p className="text-xs text-muted-foreground ml-[calc(2.75rem)]">
                  When enabled, the system will immediately check for traffic
                  delays after creating this delivery
                </p>
              </div>
            </FormField>

            <FormField>
              <div className="space-y-1">
                <Toggle
                  checked={!!watch("enable_recurring_checks")}
                  onChange={(checked) =>
                    setValue("enable_recurring_checks", checked)
                  }
                  label="Enable recurring traffic checks"
                />
                <p className="text-xs text-muted-foreground ml-[calc(2.75rem)]">
                  Continuously monitor traffic at configured intervals until
                  delivery completion
                </p>
              </div>
            </FormField>

            {watch("enable_recurring_checks") && (
              <>
                <FormRow columns={2}>
                  <FormField>
                    <Select
                      {...register("check_interval_minutes", {
                        required: watch("enable_recurring_checks"),
                        valueAsNumber: true,
                      })}
                      label="Check Interval"
                      optionGroups={checkIntervalOptions}
                      helperText="How often to check traffic conditions"
                      required={watch("enable_recurring_checks")}
                      fullWidth
                    />
                  </FormField>

                  <FormField>
                    <Input
                      {...register("max_checks", {
                        valueAsNumber: true,
                        min: { value: 1, message: "Must be at least 1" },
                        max: { value: 1000, message: "Cannot exceed 1000" },
                      })}
                      type="number"
                      label="Maximum Checks"
                      placeholder="Leave empty for unlimited"
                      helperText="Optional: Maximum checks (1-1000). Leave empty to run endlessly until stop conditions are met."
                      error={errors.max_checks?.message}
                      fullWidth
                    />
                  </FormField>
                </FormRow>

                <FormRow columns={2}>
                  <FormField>
                    <Input
                      {...register("min_delay_change_threshold", {
                        valueAsNumber: true,
                        min: {
                          value: 5,
                          message: "Must be at least 5 minutes",
                        },
                        max: {
                          value: 120,
                          message: "Cannot exceed 120 minutes",
                        },
                      })}
                      type="number"
                      label="Minimum Delay Change (minutes)"
                      placeholder="15"
                      helperText="Default: 15 minutes. Only send notification if delay changes by this amount."
                      error={errors.min_delay_change_threshold?.message}
                      fullWidth
                    />
                  </FormField>

                  <FormField>
                    <Input
                      {...register("min_hours_between_notifications", {
                        valueAsNumber: true,
                        min: {
                          value: 0.5,
                          message: "Must be at least 0.5 hours",
                        },
                        max: { value: 24, message: "Cannot exceed 24 hours" },
                      })}
                      type="number"
                      step="0.1"
                      label="Minimum Hours Between Notifications"
                      placeholder="1.0"
                      helperText="Default: 1.0 hours. Prevent spam by setting minimum time between notifications."
                      error={errors.min_hours_between_notifications?.message}
                      fullWidth
                    />
                  </FormField>
                </FormRow>

                <InfoBox variant="info" title="Automatic Stop Conditions">
                  <ul className="space-y-1">
                    <li>✓ After reaching maximum number of checks</li>
                    <li>✓ When scheduled delivery time + 2 hours passes</li>
                    <li>
                      ✓ When delivery status changes to delivered/cancelled
                    </li>
                  </ul>
                </InfoBox>
              </>
            )}
          </FormSection>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={isSubmitting}
              leftIcon={<Save className="h-4 w-4" />}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
