/**
 * Settings Page
 * Manage thresholds (DB-based) and user preferences (localStorage)
 */

"use client";

import {
  Bell,
  CheckCircle,
  Edit,
  Plus,
  Star,
  Trash2,
  User,
} from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Checkbox } from "@/components/ui/Checkbox";
import { FormField, FormRow, FormSection } from "@/components/ui/FormField";
import { InfoBox } from "@/components/ui/InfoBox";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { SkeletonCard } from "@/components/ui/Skeleton";
import {
  type UpdateCustomerInput,
  useCreateCustomer,
  useCustomer,
  useUpdateCustomer,
} from "@/core/infrastructure/http/services/customers";
import type {
  CreateThresholdInput,
  Threshold,
} from "@/core/infrastructure/http/services/thresholds";
import {
  useCreateThreshold,
  useDeleteThreshold,
  useThresholds,
  useUpdateThreshold,
} from "@/core/infrastructure/http/services/thresholds";
import { useFormDefaults, useFormStore } from "@/stores";
import { useUserSettingsStore } from "@/stores/userSettingsStore";

export default function SettingsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingThreshold, setEditingThreshold] = useState<Threshold | null>(
    null,
  );
  const [deletingThreshold, setDeletingThreshold] = useState<Threshold | null>(
    null,
  );

  // DB thresholds
  const { data: thresholds, isLoading } = useThresholds();
  const createThreshold = useCreateThreshold();
  const updateThreshold = useUpdateThreshold();
  const deleteThreshold = useDeleteThreshold();

  // User settings (localStorage)
  const customerId = useUserSettingsStore(
    (state) => state.settings?.customerId,
  );
  const setCustomerId = useUserSettingsStore((state) => state.setCustomerId);

  // Fetch customer from DB using React Query
  const { data: customer } = useCustomer(customerId || null);
  const updateCustomerMutation = useUpdateCustomer();
  const createCustomerMutation = useCreateCustomer();

  // Form store helpers
  const customerToSettingsFormValues = useFormStore(
    (state) => state.customerToSettingsFormValues,
  );
  const customerDefaults = useFormDefaults("customer-settings");

  // Customer form using react-hook-form
  const customerForm = useForm<UpdateCustomerInput>({
    defaultValues: customerDefaults || { name: "", email: "", phone: "" },
  });

  // Update form when customer data loads from DB
  useEffect(() => {
    if (customer) {
      customerForm.reset(customerToSettingsFormValues(customer));
    }
  }, [customer, customerToSettingsFormValues, customerForm]);

  const handleCreate = () => {
    setEditingThreshold(null);
    setIsModalOpen(true);
  };

  const handleEdit = (threshold: Threshold) => {
    setEditingThreshold(threshold);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (threshold: Threshold) => {
    setDeletingThreshold(threshold);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingThreshold) return;

    try {
      await deleteThreshold.mutateAsync(deletingThreshold.id);
      setIsDeleteModalOpen(false);
      setDeletingThreshold(null);
    } catch (error) {
      console.error("Failed to delete threshold:", error);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
    setDeletingThreshold(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingThreshold(null);
  };

  const handleSetAsDefault = async (threshold: Threshold) => {
    // Set this threshold as default
    // The backend should handle unsetting the previous default
    try {
      // First, find the current default and unset it
      const currentDefault = thresholds?.find((t) => t.is_default);

      if (currentDefault && currentDefault.id !== threshold.id) {
        // Unset the old default first
        await updateThreshold.mutateAsync({
          id: currentDefault.id,
          data: { is_default: false },
        });
      }

      // Then set the new default
      await updateThreshold.mutateAsync({
        id: threshold.id,
        data: { is_default: true },
      });
    } catch (error) {
      console.error("Failed to set default threshold:", error);
    }
  };

  const onSaveCustomer = async (data: UpdateCustomerInput) => {
    try {
      if (customer?.id) {
        // Update existing customer
        await updateCustomerMutation.mutateAsync({
          id: customer.id,
          data,
        });
        // Ensure ID is stored in localStorage
        setCustomerId(customer.id);
      } else {
        // Create new customer (or get existing if email already exists)
        const savedCustomer = await createCustomerMutation.mutateAsync(
          data as any,
        );
        // Store customer ID in localStorage
        setCustomerId(savedCustomer.id);
      }
    } catch (error) {
      console.error("Failed to save customer:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Settings"
        description="Manage thresholds and user preferences"
      >
        <Button onClick={handleCreate} leftIcon={<Plus className="h-4 w-4" />}>
          New Threshold
        </Button>
      </PageHeader>

      {/* Customer Defaults */}
      <Card>
        <form
          onSubmit={customerForm.handleSubmit(onSaveCustomer)}
          className="p-6"
        >
          <FormSection
            title="Customer Defaults"
            description="Pre-fill customer information when creating new deliveries (stored in browser)"
          >
            <FormRow columns={1}>
              <FormField>
                <Input
                  {...customerForm.register("name")}
                  label="Default Customer Name"
                  placeholder="John Doe"
                  fullWidth
                />
              </FormField>
            </FormRow>

            <FormRow columns={2}>
              <FormField>
                <Input
                  {...customerForm.register("email")}
                  type="email"
                  label="Default Email"
                  placeholder="john@example.com"
                  fullWidth
                />
              </FormField>

              <FormField>
                <Input
                  {...customerForm.register("phone")}
                  type="tel"
                  label="Default Phone"
                  placeholder="+1 (555) 123-4567"
                  fullWidth
                />
              </FormField>
            </FormRow>

            <div className="flex justify-end pt-4">
              <Button type="submit">Save Customer Defaults</Button>
            </div>
          </FormSection>
        </form>
      </Card>

      {/* Thresholds */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Delay Thresholds
            </h2>
            <p className="text-sm text-muted-foreground">
              Manage notification thresholds. One threshold must be marked as
              default.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : thresholds && thresholds.length > 0 ? (
          thresholds.map((threshold) => {
            return (
              <Card key={threshold.id}>
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">
                          {threshold.name}
                        </h3>
                        {threshold.is_system && (
                          <Badge variant="info" className="text-xs">
                            System
                          </Badge>
                        )}
                        {threshold.is_default && (
                          <Badge variant="success" className="text-xs">
                            Default
                          </Badge>
                        )}
                      </div>

                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div>
                          <span className="font-medium text-foreground">
                            {threshold.delay_minutes} minutes
                          </span>{" "}
                          - Notify if delivery is delayed by this amount
                        </div>

                        <div className="flex items-center gap-2">
                          <span>Channels:</span>
                          {threshold.notification_channels.map((channel) => (
                            <Badge
                              key={channel}
                              variant="default"
                              className="text-xs"
                            >
                              {channel.toUpperCase()}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      {!threshold.is_default && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSetAsDefault(threshold)}
                          leftIcon={<Star className="h-4 w-4" />}
                          title="Set as default threshold"
                        >
                          Set Default
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(threshold)}
                        disabled={threshold.is_system}
                        leftIcon={<Edit className="h-4 w-4" />}
                        title={
                          threshold.is_system
                            ? "Cannot edit system threshold"
                            : "Edit threshold"
                        }
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteClick(threshold)}
                        disabled={threshold.is_default || threshold.is_system}
                        leftIcon={<Trash2 className="h-4 w-4" />}
                        title={
                          threshold.is_system
                            ? "Cannot delete system threshold"
                            : threshold.is_default
                              ? "Cannot delete default threshold"
                              : "Delete threshold"
                        }
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })
        ) : (
          <Card>
            <div className="p-12 text-center">
              <p className="text-muted-foreground mb-4">
                No thresholds configured yet
              </p>
              <Button
                onClick={handleCreate}
                leftIcon={<Plus className="h-4 w-4" />}
              >
                Create First Threshold
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={handleDeleteCancel}
        title="Delete Threshold"
      >
        <div className="space-y-4">
          <Alert variant="warning">
            Are you sure you want to delete this threshold?
          </Alert>

          {deletingThreshold && (
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">{deletingThreshold.name}</h4>
              <p className="text-sm text-muted-foreground">
                {deletingThreshold.delay_minutes} minutes -{" "}
                {deletingThreshold.notification_channels.join(", ")}
              </p>
            </div>
          )}

          <p className="text-sm text-muted-foreground">
            This action cannot be undone. Deliveries using this threshold will
            need to be updated.
          </p>

          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={handleDeleteCancel}>
              Cancel
            </Button>
            <Button
              variant="error"
              onClick={handleDeleteConfirm}
              loading={deleteThreshold.isPending}
              leftIcon={<Trash2 className="h-4 w-4" />}
            >
              Delete Threshold
            </Button>
          </div>
        </div>
      </Modal>

      {/* Create/Edit Modal */}
      <ThresholdModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        threshold={editingThreshold}
        onCreate={createThreshold.mutateAsync}
        onUpdate={updateThreshold.mutateAsync}
      />
    </div>
  );
}

interface ThresholdModalProps {
  isOpen: boolean;
  onClose: () => void;
  threshold: Threshold | null;
  onCreate: (data: CreateThresholdInput) => Promise<Threshold>;
  onUpdate: (data: {
    id: string;
    data: Partial<CreateThresholdInput>;
  }) => Promise<Threshold>;
}

function ThresholdModal({
  isOpen,
  onClose,
  threshold,
  onCreate,
  onUpdate,
}: ThresholdModalProps) {
  const [formData, setFormData] = useState<CreateThresholdInput>({
    name: "",
    delay_minutes: 30,
    notification_channels: ["email", "sms"],
    is_default: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Use form store for transformations and defaults with type inference
  const thresholdToFormValues = useFormStore(
    (state) => state.thresholdToFormValues,
  );
  const defaults = useFormDefaults("threshold-create");

  // Pre-populate form when editing or reset to defaults when creating
  useEffect(() => {
    if (threshold) {
      setFormData(thresholdToFormValues(threshold));
    } else {
      const fallbackDefaults: CreateThresholdInput = {
        name: "",
        delay_minutes: 30,
        notification_channels: ["email", "sms"],
        is_default: false,
      };
      setFormData(
        defaults ? { ...fallbackDefaults, ...defaults } : fallbackDefaults,
      );
    }
  }, [threshold, thresholdToFormValues, defaults]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (threshold) {
        await onUpdate({ id: threshold.id, data: formData });
      } else {
        await onCreate(formData);
      }

      onClose();
    } catch (error) {
      console.error("Failed to save threshold:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleChannel = (channel: "email" | "sms") => {
    setFormData((prev) => {
      const channels = prev.notification_channels;
      if (channels.includes(channel)) {
        // Don't allow removing all channels
        if (channels.length === 1) return prev;
        return {
          ...prev,
          notification_channels: channels.filter((c) => c !== channel),
        };
      } else {
        return { ...prev, notification_channels: [...channels, channel] };
      }
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={threshold ? "Edit Threshold" : "New Threshold"}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <FormField>
          <Input
            label="Threshold Name"
            placeholder="Standard Delay Threshold"
            value={formData.name}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, name: e.target.value }))
            }
            required
            fullWidth
          />
        </FormField>

        <FormField>
          <Input
            type="number"
            label="Delay Threshold (minutes)"
            placeholder="30"
            value={formData.delay_minutes.toString()}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                delay_minutes: parseInt(e.target.value) || 0,
              }))
            }
            helperText="Notify customers if delay exceeds this amount"
            required
            fullWidth
            min="1"
          />
        </FormField>

        <FormField>
          <label className="block text-sm font-medium mb-2">
            Notification Channels
          </label>
          <div className="flex gap-3">
            <Checkbox
              label="Email"
              checked={formData.notification_channels.includes("email")}
              onChange={() => toggleChannel("email")}
            />
            <Checkbox
              label="SMS"
              checked={formData.notification_channels.includes("sms")}
              onChange={() => toggleChannel("sms")}
            />
          </div>
        </FormField>

        <FormField>
          <Checkbox
            label="Set as system default threshold"
            checked={formData.is_default}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, is_default: e.target.checked }))
            }
          />
        </FormField>

        <div className="flex items-center justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            loading={isSubmitting}
            leftIcon={<CheckCircle className="h-4 w-4" />}
          >
            {threshold ? "Save Changes" : "Create Threshold"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
