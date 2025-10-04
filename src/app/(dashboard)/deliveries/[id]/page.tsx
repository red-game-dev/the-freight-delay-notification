/**
 * Delivery Detail Page
 * View full delivery information with manual workflow trigger
 */

"use client";

import {
  ArrowLeft,
  Clock,
  Edit,
  FileText,
  Mail,
  MapPin,
  Phone,
  PlayCircle,
  Trash2,
  User,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { DeliveryMap } from "@/components/features/deliveries/DeliveryMap";
import { DeliveryNotificationsList } from "@/components/features/deliveries/DeliveryNotificationsList";
import { DeliveryWorkflowsList } from "@/components/features/deliveries/DeliveryWorkflowsList";
import { WorkflowStatusPolling } from "@/components/features/workflows/WorkflowStatusPolling";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { InfoBox } from "@/components/ui/InfoBox";
import { Modal, ModalFooter } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { SkeletonDetail } from "@/components/ui/Skeleton";
import { CompactTimeline } from "@/components/ui/Timeline";
import { Toggle } from "@/components/ui/Toggle";
import {
  useDeleteDelivery,
  useDelivery,
} from "@/core/infrastructure/http/services/deliveries";
import {
  useCancelWorkflow,
  useStartWorkflow,
  useWorkflowPolling,
} from "@/core/infrastructure/http/services/workflows";
import { createWorkflowId, WorkflowType } from "@/core/utils/workflowUtils";

const statusConfig = {
  pending: { label: "Pending", variant: "default" as const },
  in_transit: { label: "In Transit", variant: "info" as const },
  delayed: { label: "Delayed", variant: "warning" as const },
  delivered: { label: "Delivered", variant: "success" as const },
  cancelled: { label: "Cancelled", variant: "error" as const },
  failed: { label: "Failed", variant: "error" as const },
};

export default function DeliveryDetailPage() {
  const router = useRouter();
  const params = useParams();
  const deliveryId = params?.id as string;

  const { data: delivery, isLoading, error } = useDelivery(deliveryId);
  const startWorkflow = useStartWorkflow();
  const cancelWorkflow = useCancelWorkflow();
  const deleteDelivery = useDeleteDelivery();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCancelWorkflowModal, setShowCancelWorkflowModal] = useState(false);
  const [forceCancel, setForceCancel] = useState(false);

  const workflowId = delivery
    ? createWorkflowId(
        delivery.enable_recurring_checks
          ? WorkflowType.RECURRING_CHECK
          : WorkflowType.DELAY_NOTIFICATION,
        delivery.id,
        false,
      )
    : null;

  // Use workflow polling hook
  const {
    workflowStatus,
    isWorkflowRunning,
    shouldEnablePolling,
    notifyWorkflowStarted,
    resetWorkflowStarted,
  } = useWorkflowPolling({ workflowId });

  // Compute button states
  const isRecurringAndRunning =
    delivery?.enable_recurring_checks && isWorkflowRunning;

  const handleStartWorkflow = async () => {
    if (!delivery) return;
    try {
      notifyWorkflowStarted();
      await startWorkflow.mutateAsync(delivery.id);
    } catch (error) {
      console.error("Failed to start workflow:", error);
      resetWorkflowStarted();
    }
  };

  const handleCancelWorkflow = async () => {
    if (!delivery || !workflowId) return;

    try {
      await cancelWorkflow.mutateAsync({
        workflowId,
        force: forceCancel,
      });

      setShowCancelWorkflowModal(false);
      setForceCancel(false);
    } catch (error) {
      console.error("Failed to cancel recurring workflow:", error);
    }
  };

  const handleDelete = async () => {
    if (!delivery) return;

    try {
      await deleteDelivery.mutateAsync(delivery.id);
      setShowDeleteModal(false);
      router.push("/deliveries");
    } catch (error) {
      console.error("Failed to delete delivery:", error);
    }
  };

  if (isLoading) {
    return <SkeletonDetail />;
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

  const statusInfo = statusConfig[delivery.status];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
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
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                {delivery.tracking_number}
              </h1>
              <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Created {new Date(delivery.created_at).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/deliveries/${delivery.id}/edit`}>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Edit className="h-4 w-4" />}
            >
              Edit
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDeleteModal(true)}
            leftIcon={<Trash2 className="h-4 w-4" />}
          >
            Delete
          </Button>
          {/* Show "Stop Recurring Checks" only when recurring workflow is running */}
          {isRecurringAndRunning && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCancelWorkflowModal(true)}
              leftIcon={<XCircle className="h-4 w-4" />}
            >
              Stop Recurring Checks
            </Button>
          )}
          {/* Disable "Check Traffic & Notify" when any workflow is running */}
          <Button
            size="sm"
            onClick={handleStartWorkflow}
            loading={startWorkflow.isPending}
            disabled={isWorkflowRunning}
            leftIcon={<PlayCircle className="h-4 w-4" />}
          >
            Check Traffic & Notify
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Delivery Information */}
        <Card>
          <div className="p-6">
            <SectionHeader title="Delivery Information" className="mb-4" />

            <div className="space-y-4">
              <div>
                <div className="flex items-start gap-2 mb-1">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Origin</p>
                    <p className="font-medium">{delivery.origin}</p>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-start gap-2 mb-1">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Destination</p>
                    <p className="font-medium">{delivery.destination}</p>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-start gap-2 mb-1">
                  <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Scheduled Delivery
                    </p>
                    <p className="font-medium">
                      {new Date(delivery.scheduled_delivery).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {delivery.notes && (
                <div>
                  <div className="flex items-start gap-2 mb-1">
                    <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Notes</p>
                      <p className="font-medium">{delivery.notes}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Customer Information */}
        <Card>
          <div className="p-6">
            <SectionHeader title="Customer Information" className="mb-4" />

            <div className="space-y-4">
              <div>
                <div className="flex items-start gap-2 mb-1">
                  <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">{delivery.customer_name}</p>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-start gap-2 mb-1">
                  <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{delivery.customer_email}</p>
                  </div>
                </div>
              </div>

              {delivery.customer_phone && (
                <div>
                  <div className="flex items-start gap-2 mb-1">
                    <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium">{delivery.customer_phone}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Interactive Map */}
      <Card>
        <div className="p-6">
          <SectionHeader
            title="Route Map"
            description="Delivery route visualization"
            className="mb-4"
          />
          <DeliveryMap
            origin={delivery.origin}
            destination={delivery.destination}
          />
        </div>
      </Card>

      {/* Workflow Status - Real-time polling */}
      {/* Only poll when workflow is running (not in terminal state) */}
      {workflowId && (
        <WorkflowStatusPolling
          workflowId={workflowId}
          enabled={shouldEnablePolling}
          showActivities={true}
          trackingNumber={delivery.tracking_number}
          settings={{
            type: delivery.enable_recurring_checks ? "recurring" : "one-time",
            check_interval_minutes: delivery.check_interval_minutes,
            max_checks: delivery.max_checks,
            checks_performed: delivery.checks_performed,
            delay_threshold_minutes: delivery.delay_threshold_minutes,
            min_delay_change_threshold: delivery.min_delay_change_threshold,
            min_hours_between_notifications:
              delivery.min_hours_between_notifications,
            scheduled_delivery: delivery.scheduled_delivery,
            last_check_time: delivery.updated_at, // For accurate next run calculation
          }}
        />
      )}

      {/* Workflows and Notifications History */}
      <div className="grid gap-6 md:grid-cols-2">
        <DeliveryWorkflowsList deliveryId={delivery.id} />
        <DeliveryNotificationsList deliveryId={delivery.id} />
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Delivery"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            Are you sure you want to delete this delivery? This action cannot be
            undone.
          </p>
          <InfoBox variant="warning">
            <p>
              <strong>Warning:</strong> Deleting this delivery will permanently
              remove all associated data including workflow history and
              notifications.
            </p>
          </InfoBox>
        </div>
        <ModalFooter>
          <Button
            variant="outline"
            onClick={() => setShowDeleteModal(false)}
            disabled={deleteDelivery.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="error"
            onClick={handleDelete}
            loading={deleteDelivery.isPending}
            leftIcon={<Trash2 className="h-4 w-4" />}
          >
            Delete Delivery
          </Button>
        </ModalFooter>
      </Modal>

      {/* Cancel Workflow Confirmation Modal */}
      <Modal
        isOpen={showCancelWorkflowModal}
        onClose={() => {
          setShowCancelWorkflowModal(false);
          setForceCancel(false);
        }}
        title="Stop Recurring Checks"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            Are you sure you want to stop recurring traffic checks for this
            delivery?
          </p>

          <InfoBox variant="info">
            <p>
              <strong>Note:</strong> The workflow will stop monitoring traffic
              conditions. You can manually check traffic using the "Check
              Traffic & Notify" button.
            </p>
          </InfoBox>

          <div className="border-t pt-4">
            <Toggle
              checked={forceCancel}
              onChange={setForceCancel}
              label="Force Cancel (Terminate)"
            />
            <p className="text-xs text-muted-foreground mt-2 ml-[calc(2.75rem)]">
              Enable this if the workflow is stuck or has errors. This will
              immediately terminate the workflow without waiting for graceful
              shutdown.
            </p>
          </div>
        </div>
        <ModalFooter>
          <Button
            variant="outline"
            onClick={() => {
              setShowCancelWorkflowModal(false);
              setForceCancel(false);
            }}
            disabled={cancelWorkflow.isPending}
          >
            Cancel
          </Button>
          <Button
            variant={forceCancel ? "error" : "default"}
            onClick={handleCancelWorkflow}
            loading={cancelWorkflow.isPending}
            leftIcon={<XCircle className="h-4 w-4" />}
          >
            {forceCancel ? "Force Terminate" : "Stop Recurring Checks"}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
