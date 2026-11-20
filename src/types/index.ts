export type TokenStatus = 'Waiting' | 'Called' | 'In chair' | 'Done' | 'Cancelled' | 'No-show';

export type BarberStatus = 'Available' | 'Busy' | 'On break';

export interface Service {
  id: string;
  name_en: string;
  name_gu: string;
  duration_minutes: number;
  price: number;
  is_active: boolean;
}

export interface Barber {
  id: string;
  name: string;
  status: BarberStatus;
  on_duty: boolean;
  current_token_id?: string | null;
  started_at?: string | null;
}

export interface QueueToken {
  id: string; // e.g. "S-1"
  customer_name: string;
  phone: string;
  service_ids: string[];
  preferred_barber_id: string; // "ANY" or barber id
  assigned_barber_id?: string | null;
  status: TokenStatus;
  created_at: string;
  called_at?: string | null;
  in_chair_at?: string | null;
  completed_at?: string | null;
  is_walk_in: boolean;
  total_duration_minutes: number;
  total_price: number;
}

export interface SalonSettings {
  is_open_override: boolean | null; // null follows auto cutoff (8:30 PM), true = open, false = closed
  closing_time_str: string; // "21:00"
  online_cutoff_str: string; // "20:30"
}
