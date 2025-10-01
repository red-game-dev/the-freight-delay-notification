/**
 * Delivery Types
 * Type definitions for delivery-related operations
 */

export interface Delivery {
  id: string;
  tracking_number: string;
  origin: string;
  destination: string;
  scheduled_delivery: string;
  status: 'pending' | 'in_transit' | 'delayed' | 'delivered' | 'cancelled';
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateDeliveryInput {
  tracking_number: string;
  origin: string;
  destination: string;
  scheduled_delivery: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  notes?: string;
}

export interface UpdateDeliveryInput extends Partial<CreateDeliveryInput> {
  status?: Delivery['status'];
}

export interface DeliveryStats {
  total: number;
  in_transit?: number;
  delayed?: number;
  delivered?: number;
}
