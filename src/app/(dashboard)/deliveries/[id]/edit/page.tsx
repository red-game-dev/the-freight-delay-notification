/**
 * Edit Delivery Page
 * Form for editing an existing delivery
 */

'use client';

import * as React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Input';
import { DateTimePicker } from '@/components/ui/DateTimePicker';
import { Dropdown } from '@/components/ui/Dropdown';
import { Toggle } from '@/components/ui/Toggle';
import { FormField, FormRow, FormSection } from '@/components/ui/FormField';
import { Card } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';
import { useDelivery, useUpdateDelivery } from '@/core/infrastructure/http/services/deliveries';
import type { UpdateDeliveryInput } from '@/core/infrastructure/http/services/deliveries';

const statusOptions = [
  { label: 'Pending', value: 'pending' },
  { label: 'In Transit', value: 'in_transit' },
  { label: 'Delayed', value: 'delayed' },
  { label: 'Delivered', value: 'delivered' },
  { label: 'Cancelled', value: 'cancelled' },
];

export default function EditDeliveryPage() {
  const router = useRouter();
  const params = useParams();
  const deliveryId = params?.id as string;

  const { data: delivery, isLoading, error } = useDelivery(deliveryId);
  const updateDelivery = useUpdateDelivery();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<UpdateDeliveryInput>();

  const [status, setStatus] = React.useState<string>('');

  // Pre-populate form when delivery loads
  React.useEffect(() => {
    if (delivery) {
      setValue('tracking_number', delivery.tracking_number);
      setValue('origin', delivery.origin);
      setValue('destination', delivery.destination);

      // Format scheduled_delivery for datetime-local input (YYYY-MM-DDTHH:mm)
      if (delivery.scheduled_delivery) {
        const date = new Date(delivery.scheduled_delivery);
        const formatted = date.toISOString().slice(0, 16); // "2024-01-15T14:30"
        setValue('scheduled_delivery', formatted);
      }

      setValue('customer_name', delivery.customer_name);
      setValue('customer_email', delivery.customer_email);
      setValue('customer_phone', delivery.customer_phone || '');
      setValue('notes', delivery.notes || '');
      setValue('auto_check_traffic', delivery.auto_check_traffic || false);
      setValue('enable_recurring_checks', delivery.enable_recurring_checks || false);
      setValue('check_interval_minutes', delivery.check_interval_minutes || 30);
      // Don't set max_checks if it's -1 (unlimited), leave field empty
      if (delivery.max_checks && delivery.max_checks !== -1) {
        setValue('max_checks', delivery.max_checks);
      }
      setStatus(delivery.status);
    }
  }, [delivery, setValue]);

  const onSubmit = async (data: UpdateDeliveryInput) => {
    try {
      await updateDelivery.mutateAsync({
        id: deliveryId,
        data: { ...data, status: status as any },
      });
      router.push(`/deliveries/${deliveryId}`);
    } catch (error) {
      console.error('Failed to update delivery:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-muted rounded w-1/4"></div>
        </div>
        <div className="h-96 bg-muted rounded animate-pulse"></div>
      </div>
    );
  }

  if (error || !delivery) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={() => router.back()} leftIcon={<ArrowLeft className="h-4 w-4" />}>
          Back
        </Button>
        <Alert variant="error">
          Failed to load delivery. {error instanceof Error ? error.message : 'Please try again.'}
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          leftIcon={<ArrowLeft className="h-4 w-4" />}
        >
          Back
        </Button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Edit Delivery: {delivery.tracking_number}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Update delivery information
          </p>
        </div>
      </div>

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
                  {...register('tracking_number', {
                    required: 'Tracking number is required',
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
                  onChange={setStatus}
                  required
                  fullWidth
                />
              </FormField>
            </FormRow>

            <FormRow columns={2}>
              <FormField>
                <DateTimePicker
                  {...register('scheduled_delivery', {
                    required: 'Scheduled delivery is required',
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
                  {...register('origin', {
                    required: 'Origin is required',
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
                  {...register('destination', {
                    required: 'Destination is required',
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
                {...register('notes')}
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
                  {...register('customer_name', {
                    required: 'Customer name is required',
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
                  {...register('customer_email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address',
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
                  {...register('customer_phone', {
                    pattern: {
                      value: /^[\d\s+()-]+$/,
                      message: 'Invalid phone number',
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
              <div className="space-y-1">
                <Toggle
                  checked={!!watch('auto_check_traffic')}
                  onChange={(checked) => setValue('auto_check_traffic', checked)}
                  label="Automatically check traffic on creation"
                />
                <p className="text-xs text-muted-foreground ml-[calc(2.75rem)]">
                  When enabled, the system will immediately check for traffic delays after creating this delivery
                </p>
              </div>
            </FormField>

            <FormField>
              <div className="space-y-1">
                <Toggle
                  checked={!!watch('enable_recurring_checks')}
                  onChange={(checked) => setValue('enable_recurring_checks', checked)}
                  label="Enable recurring traffic checks"
                />
                <p className="text-xs text-muted-foreground ml-[calc(2.75rem)]">
                  Continuously monitor traffic at configured intervals until delivery completion
                </p>
              </div>
            </FormField>

            {watch('enable_recurring_checks') && (
              <>
                <FormRow columns={2}>
                  <FormField>
                    <label className="block text-sm font-medium mb-1.5">
                      Check Interval
                      <span className="text-red-600 dark:text-red-400 ml-1">*</span>
                    </label>
                    <select
                      {...register('check_interval_minutes', {
                        required: watch('enable_recurring_checks'),
                        valueAsNumber: true,
                      })}
                      className="w-full px-3 py-2 border rounded-lg bg-background"
                    >
                      <optgroup label="Minutes">
                        <option value="15">Every 15 minutes</option>
                        <option value="30">Every 30 minutes</option>
                      </optgroup>
                      <optgroup label="Hours">
                        <option value="60">Every 1 hour</option>
                        <option value="120">Every 2 hours</option>
                        <option value="180">Every 3 hours</option>
                        <option value="360">Every 6 hours</option>
                        <option value="720">Every 12 hours</option>
                      </optgroup>
                      <optgroup label="Days/Weeks">
                        <option value="1440">Daily (every 24 hours)</option>
                        <option value="10080">Weekly (every 7 days)</option>
                        <option value="43200">Monthly (every 30 days)</option>
                      </optgroup>
                    </select>
                    <p className="text-xs text-muted-foreground mt-1">
                      How often to check traffic conditions
                    </p>
                  </FormField>

                  <FormField>
                    <Input
                      {...register('max_checks', {
                        valueAsNumber: true,
                        min: { value: 1, message: 'Must be at least 1' },
                        max: { value: 1000, message: 'Cannot exceed 1000' },
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

                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                    Automatic Stop Conditions
                  </h4>
                  <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                    <li>✓ After reaching maximum number of checks</li>
                    <li>✓ When scheduled delivery time + 2 hours passes</li>
                    <li>✓ When delivery status changes to delivered/cancelled</li>
                  </ul>
                </div>
              </>
            )}
          </FormSection>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t">
            <Button type="button" variant="outline" onClick={() => router.back()}>
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
