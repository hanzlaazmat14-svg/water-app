export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = 'customer' | 'driver' | 'admin';

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'assigned'
  | 'out_for_delivery'
  | 'delivered'
  | 'failed'
  | 'cancelled';

export type PaymentMethod = 'cash_on_delivery';

export type PaymentStatus = 'unpaid' | 'paid' | 'refunded';

export type SubscriptionFrequency = 'daily' | 'every_2_days' | 'every_3_days' | 'weekly';

export type SubscriptionStatus = 'active' | 'paused' | 'cancelled';

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  phone: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  delivery_instructions: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  bottle_size: string;
  price: number;
  image_url: string | null;
  description: string | null;
  is_available: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface DeliverySlot {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  max_capacity: number;
  is_active: boolean;
  display_order: number;
  created_at: string;
}

export interface Order {
  id: string;
  order_number: number;
  customer_id: string;
  assigned_driver_id: string | null;
  status: OrderStatus;
  delivery_date: string;
  delivery_slot_id: string | null;
  delivery_address: string;
  delivery_latitude: number | null;
  delivery_longitude: number | null;
  delivery_instructions: string | null;
  subtotal: number;
  delivery_fee: number;
  total_amount: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  bottles_delivered: number;
  empty_bottles_returned: number;
  failure_reason: string | null;
  driver_notes: string | null;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;

  // Joined relations
  customer?: Profile;
  driver?: Profile;
  delivery_slot?: DeliverySlot;
  order_items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  bottle_size: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
}

export interface Subscription {
  id: string;
  customer_id: string;
  product_id: string;
  quantity: number;
  frequency: SubscriptionFrequency;
  delivery_slot_id: string | null;
  status: SubscriptionStatus;
  next_delivery_date: string;
  notes: string | null;
  created_at: string;
  updated_at: string;

  // Joined relations
  product?: Product;
  delivery_slot?: DeliverySlot;
}

export interface SubscriptionSkip {
  id: string;
  subscription_id: string;
  customer_id: string;
  start_date: string;
  end_date: string;
  reason: string | null;
  created_at: string;
}

export interface DeliveryStatusHistory {
  id: string;
  order_id: string;
  status: string;
  notes: string | null;
  changed_by: string | null;
  created_at: string;
}

export interface BusinessSettings {
  id: string;
  company_name?: string;
  short_name?: string;
  slogan?: string;
  logo_url?: string;
  phone?: string;
  whatsapp_number?: string;
  support_email?: string;
  business_address?: string;
  city?: string;
  currency?: string;
  delivery_fee: number;
  free_delivery_threshold: number;
  min_order_amount: number;
  announcement_text: string | null;
  updated_at: string;
}
