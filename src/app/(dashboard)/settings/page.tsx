/**
 * Settings Page
 * Manage thresholds and system configuration
 */

'use client';

import * as React from 'react';
import { Plus, Edit, Trash2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Dropdown } from '@/components/ui/Dropdown';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { FormField, FormRow } from '@/components/ui/FormField';
import { Alert } from '@/components/ui/Alert';
import { SkeletonCard } from '@/components/ui/Skeleton';
import {
  useThresholds,
  useCreateThreshold,
  useUpdateThreshold,
  useDeleteThreshold,
} from '@/core/infrastructure/http/services/thresholds';
import type { Threshold, CreateThresholdInput } from '@/core/infrastructure/http/services/thresholds';

export default function SettingsPage() {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingThreshold, setEditingThreshold] = React.useState<Threshold | null>(null);

  const { data: thresholds, isLoading } = useThresholds();
  const createThreshold = useCreateThreshold();
  const updateThreshold = useUpdateThreshold();
  const deleteThreshold = useDeleteThreshold();

  const handleCreate = () => {
    setEditingThreshold(null);
    setIsModalOpen(true);
  };

  const handleEdit = (threshold: Threshold) => {
    setEditingThreshold(threshold);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this threshold?')) return;
    try {
      await deleteThreshold.mutateAsync(id);
    } catch (error) {
      console.error('Failed to delete threshold:', error);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingThreshold(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage delay thresholds and notification preferences
          </p>
        </div>
        <Button onClick={handleCreate} leftIcon={<Plus className="h-4 w-4" />}>
          New Threshold
        </Button>
      </div>

      {/* Info Alert */}
      <Alert variant="info">
        Thresholds determine when customers are notified about delivery delays. Set a delay
        threshold in minutes and choose notification channels.
      </Alert>

      {/* Thresholds List */}
      <div className="grid gap-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : thresholds && thresholds.length > 0 ? (
          thresholds.map((threshold) => (
            <Card key={threshold.id}>
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{threshold.name}</h3>
                      {threshold.is_default && (
                        <Badge variant="info" className="text-xs">
                          Default
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div>
                        <span className="font-medium text-foreground">
                          {threshold.delay_minutes} minutes
                        </span>{' '}
                        - Notify if delivery is delayed by this amount
                      </div>

                      <div className="flex items-center gap-2">
                        <span>Channels:</span>
                        {threshold.notification_channels.map((channel) => (
                          <Badge key={channel} variant="default" className="text-xs">
                            {channel.toUpperCase()}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(threshold)}
                      leftIcon={<Edit className="h-4 w-4" />}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(threshold.id)}
                      disabled={threshold.is_default}
                      leftIcon={<Trash2 className="h-4 w-4" />}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <Card>
            <div className="p-12 text-center">
              <p className="text-muted-foreground mb-4">No thresholds configured yet</p>
              <Button onClick={handleCreate} leftIcon={<Plus className="h-4 w-4" />}>
                Create First Threshold
              </Button>
            </div>
          </Card>
        )}
      </div>

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
  onUpdate: (data: { id: string; data: Partial<CreateThresholdInput> }) => Promise<Threshold>;
}

function ThresholdModal({ isOpen, onClose, threshold, onCreate, onUpdate }: ThresholdModalProps) {
  const [name, setName] = React.useState('');
  const [delayMinutes, setDelayMinutes] = React.useState('30');
  const [channels, setChannels] = React.useState<Array<'email' | 'sms'>>(['email']);
  const [isDefault, setIsDefault] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Pre-populate form when editing
  React.useEffect(() => {
    if (threshold) {
      setName(threshold.name);
      setDelayMinutes(threshold.delay_minutes.toString());
      setChannels(threshold.notification_channels);
      setIsDefault(threshold.is_default);
    } else {
      setName('');
      setDelayMinutes('30');
      setChannels(['email']);
      setIsDefault(false);
    }
  }, [threshold]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const data: CreateThresholdInput = {
        name,
        delay_minutes: parseInt(delayMinutes),
        notification_channels: channels,
        is_default: isDefault,
      };

      if (threshold) {
        await onUpdate({ id: threshold.id, data });
      } else {
        await onCreate(data);
      }

      onClose();
    } catch (error) {
      console.error('Failed to save threshold:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleChannel = (channel: 'email' | 'sms') => {
    if (channels.includes(channel)) {
      setChannels(channels.filter((c) => c !== channel));
    } else {
      setChannels([...channels, channel]);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={threshold ? 'Edit Threshold' : 'New Threshold'}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <FormField>
          <Input
            label="Threshold Name"
            placeholder="Standard Delay Threshold"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            fullWidth
          />
        </FormField>

        <FormField>
          <Input
            type="number"
            label="Delay Threshold (minutes)"
            placeholder="30"
            value={delayMinutes}
            onChange={(e) => setDelayMinutes(e.target.value)}
            helperText="Notify customers if delay exceeds this amount"
            required
            fullWidth
            min="1"
          />
        </FormField>

        <FormField>
          <label className="block text-sm font-medium mb-2">Notification Channels</label>
          <div className="flex gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={channels.includes('email')}
                onChange={() => toggleChannel('email')}
                className="rounded"
              />
              <span>Email</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={channels.includes('sms')}
                onChange={() => toggleChannel('sms')}
                className="rounded"
              />
              <span>SMS</span>
            </label>
          </div>
        </FormField>

        <FormField>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm">Set as default threshold</span>
          </label>
        </FormField>

        <div className="flex items-center justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting} leftIcon={<CheckCircle className="h-4 w-4" />}>
            {threshold ? 'Save Changes' : 'Create Threshold'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
