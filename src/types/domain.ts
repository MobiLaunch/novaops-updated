// Domain types matching the actual Supabase column shapes (snake_case) so
// query results can be used directly without a conversion layer — see
// supabase/migrations/MASTER_SETUP.sql for the source of truth.

export interface Customer {
  id: number;
  profile_id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  drivers_license: string;
  tags: string[];
  notes: string;
  created_at: string;
  updated_at: string;
}

export type TicketStatus =
  | "Open"
  | "In Progress"
  | "Waiting for Parts"
  | "Completed"
  | "Delivered";

export type TicketPriority = "low" | "normal" | "high" | "urgent";

export interface TicketNote {
  text: string;
  at: string;
  author?: string;
}

export interface TicketPart {
  inventory_id?: number;
  name: string;
  qty: number;
  price: number;
}

export interface TicketPayment {
  amount: number;
  method: string;
  at: string;
}

export interface Ticket {
  id: number;
  profile_id: string;
  customer_id: number | null;
  device: string;
  device_model: string;
  device_description: string;
  issue: string;
  status: TicketStatus | string;
  priority: TicketPriority | string;
  price: number;
  serial_number: string;
  warranty_days: number;
  warranty_start: string | null;
  photos: string[];
  signature: string | null;
  notes: TicketNote[];
  parts: TicketPart[];
  payments: TicketPayment[];
  time_log: unknown[];
  tracking: Record<string, unknown> | null;
  diagnostics: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface InventoryItem {
  id: number;
  profile_id: string;
  name: string;
  sku: string;
  category: string;
  model: string;
  stock: number;
  low: number;
  cost: number;
  price: number;
  created_at: string;
  updated_at: string;
}

// Shape of a row from the shared `bookings` table — owned and written by
// mobicare-business's /api/create-booking serverless function. See
// mobicare-business/src/types/domain.ts's BookingRecord for the canonical
// definition this mirrors, and its Bookings.tsx admin page for the reference
// UI this Bookings page is modeled after.
export type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled" | "no-show";

export interface BookingRecord {
  id: string | number;
  status: BookingStatus | string;
  created_at?: string;
  updated_at?: string;
  customer_name: string;
  customer_phone?: string;
  customer_email?: string;
  service: string;
  device_type: string;
  device_model: string;
  appt_date: string;
  appt_time: string;
  issue?: string;
  notes?: string;
  visit_type?: string;
  visit_location_type?: string;
  home_address?: string;
  user_id?: string | null;
  novaops_ticket_id?: number | null;
}
