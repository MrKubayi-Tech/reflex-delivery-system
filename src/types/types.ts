export type Role = 'retailer' | 'dispatcher' | 'rider';

export type DeliveryStatus = 'pending' | 'assigned' | 'picked_up' | 'delivered';

export type Priority = 'standard' | 'high';

export type VehicleType = 'motorbike' | 'light_truck' | 'heavy_van';

export type RiderAvailability = 'idle' | 'en_route' | 'in_transit';

export interface AuthUser {
  id: number;
  name: string;
  role: Role;
  retailer_id: number | null;
}

/**
 * Input shape for POST /api/auth/register. Not a BRD/ERD entity — see
 * Services/RegistrationService.php's docblock for why self-service
 * sign-up exists at all despite not being an FR.
 */
export interface NewUserInput {
  role: Role;
  full_name: string;
  phone_number: string;
  password: string;
  password_confirmation: string;
  // Required only when role === 'retailer':
  business_name?: string;
  business_address?: string;
  // Optional, only meaningful when role === 'rider':
  vehicle_type?: VehicleType;
}

export interface DeliveryRequest {
  delivery_request_id: number;
  retailer_id: number;
  assigned_rider_id: number | null;
  created_by: number;
  dispatcher_id: number | null;
  tracking_code: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  item_description: string;
  current_status: DeliveryStatus;
  created_at: string;
  updated_at: string;

  // Joined convenience fields, not columns on delivery_requests itself.
  rider_name: string | null;
  rider_vehicle: VehicleType | null;
  dispatcher_name: string | null;
  retailer_name: string;

  // Beyond-BRD extension fields (see ARCHITECTURE.md) — optional.
  weight_kg: number | null;
  priority: Priority | null;
}

export interface NewDeliveryRequestInput {
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  item_description: string;
  weight_kg?: number;
  priority?: Priority;
}

export interface Rider {
  user_id: number;
  full_name: string;
  phone_number: string;
  vehicle_type: VehicleType | null;
  capacity_pct: number | null;
  availability: RiderAvailability | null;
}

export interface StatusEvent {
  status_id: number;
  delivery_request_id: number;
  changed_by: number;
  changed_by_name: string;
  previous_status: DeliveryStatus | null;
  new_status: DeliveryStatus;
  recorded_at: string;
  scan_reference: string | null;
}

/** Allowed forward transitions — mirrors DeliveryService::TRANSITIONS in the backend. */
export const STATUS_TRANSITIONS: Record<DeliveryStatus, DeliveryStatus[]> = {
  pending: ['assigned'],
  assigned: ['picked_up'],
  picked_up: ['delivered'],
  delivered: [],
};

export const STATUS_LABELS: Record<DeliveryStatus, string> = {
  pending: 'Pending',
  assigned: 'Assigned',
  picked_up: 'Picked Up',
  delivered: 'Delivered',
};