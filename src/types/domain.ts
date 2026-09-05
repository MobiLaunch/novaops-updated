// Domain types matching the actual Supabase column shapes (snake_case) so
// query results can be used directly without a conversion layer — see
// supabase/migrations/MASTER_SETUP.sql for the source of truth.

export type PreferredContact = "phone" | "email" | "sms";

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
  secondary_phone: string;
  preferred_contact: PreferredContact | string;
  referral_source: string;
  birthday: string | null;
  vip: boolean;
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
  due_date: string | null;
  labels: string[];
  assigned_to: number | null;
  public_token: string;
  created_at: string;
  updated_at: string;
}

export interface Technician {
  id: number;
  profile_id: string;
  name: string;
  color: string;
  active: boolean;
  created_at: string;
}

export interface CannedResponse {
  title: string;
  body: string;
}

export interface DayHours {
  open: string;
  close: string;
  closed: boolean;
}

export type TaxFilingFrequency = "monthly" | "quarterly" | "annually";

export interface ShopSettings {
  profile_id: string;
  business_name: string;
  business_address: string;
  business_phone: string;
  business_hours: Record<string, DayHours>;
  tax_rate: number;
  tax_filing_frequency: TaxFilingFrequency | string;
  income_tax_reserve_pct: number;
  receipt_footer: string;
  notify_on_status_change: boolean;
  canned_responses: CannedResponse[];
  created_at: string;
  updated_at: string;
}

export interface PosSaleItem {
  name: string;
  price: number;
  quantity: number;
  sku?: string;
  ticketId?: number;
}

export interface PosSale {
  id: number;
  profile_id: string;
  customer_id: number | null;
  items: PosSaleItem[];
  subtotal: number;
  tax: number;
  total: number;
  payment_method: string;
  note: string;
  status: "completed" | "refunded" | "voided" | string;
  created_at: string;
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

export interface TradeIn {
  id: number;
  profile_id: string;
  customer_id: number | null;
  brand: string;
  model: string;
  model_number: string;
  imei: string;
  storage: string;
  color: string;
  condition_grade: "Excellent" | "Good" | "Fair" | "Poor" | string;
  age_years: number;
  screen_condition: "Perfect" | "Minor Scratches" | "Cracked" | "Shattered" | string;
  battery_health: number;
  functional_issues: string[];
  cosmetic_issues: string[];
  accessories: string[];
  icloud_locked: boolean;
  frp_locked: boolean;
  market_price: number | null;
  repair_cost_est: number | null;
  offer_price: number | null;
  estimated_resale: number | null;
  estimated_profit: number | null;
  status: "Pending" | "Accepted" | "Declined" | "Completed" | string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export type ScheduleStatus = "scheduled" | "confirmed" | "completed" | "cancelled" | "no-show";

export interface Appointment {
  id: number;
  profile_id: string;
  customer_id: number | null;
  title: string;
  description: string;
  date: string | null;
  time: string;
  status: ScheduleStatus | string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface HouseCall {
  id: number;
  profile_id: string;
  customer_id: number | null;
  description: string;
  address: string;
  date: string | null;
  time: string;
  status: "scheduled" | "completed" | "cancelled" | string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: number;
  profile_id: string;
  customer_id: number | null;
  customer_name: string;
  customer_email: string;
  channel: "email" | "sms" | "chat" | string;
  direction: "inbound" | "outbound";
  subject: string;
  body: string;
  ticket_id: number | null;
  read: boolean;
  delivered: boolean;
  gmail_message_id?: string | null;
  created_at: string;
}

export interface Shipment {
  id: number;
  profile_id: string;
  ticket_id: number | null;
  message_id: number | null;
  appointment_id: number | null;
  supplier_email: string;
  supplier_name: string;
  tracking_number: string;
  carrier: string;
  order_reference: string;
  subject: string;
  estimated_delivery_date: string | null;
  estimated_delivery_time: string;
  status: "in_transit" | "delivered" | "assigned" | "archived" | string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface CustomerMessage {
  id: number;
  profile_id: string;
  customer_user_id: string | null;
  ticket_id: number | null;
  customer_name: string;
  customer_email: string;
  direction: "inbound" | "outbound";
  body: string;
  read: boolean;
  created_at: string;
}

// Shape of a row from the shared `bookings` table — owned and written by
// mobicare-business's /api/create-booking serverless function. See
// mobicare-business/src/types/domain.ts's BookingRecord for the canonical
// definition this mirrors, and its Bookings.tsx admin page for the reference
// UI this Bookings page is modeled after.
export type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled" | "no-show";

// Shape of a row from the shared `orders` table (+ its `order_items` child
// rows) — owned and written by mobicare-business's storefront checkout
// (Stripe-only; see its stripe_payment_intent column). Read the same way as
// `bookings` above: a NovaOps account must also be a row in
// `public.staff_users` for RLS to return anything. Column names mirror that
// repo's src/lib/supabase.ts (dbToOrder/sbInsertOrder) exactly.
export type WebsiteOrderStatus =
  | "paid"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded"
  | "payment_failed";

export interface WebsiteOrderItem {
  id?: number;
  order_id?: string;
  product_id: string;
  name: string;
  price: number;
  qty: number;
}

export interface WebsiteOrder {
  id: string;
  user_id: string | null;
  status: WebsiteOrderStatus | string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: string;
  shipping_city: string;
  shipping_state: string;
  shipping_zip: string;
  subtotal: number;
  shipping_cost: number;
  tax: number;
  total: number;
  stripe_payment_intent?: string | null;
  order_items: WebsiteOrderItem[];
  created_at: string;
}

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
