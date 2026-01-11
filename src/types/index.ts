export interface Restaurant {
  id?: number;
  name: string;
  opening_time: string;
  closing_time: string;
  total_tables: number;
  created_at?: string;
}

export interface Table {
  id?: number;
  restaurant_id: number;
  table_number: string;
  capacity: number;
  created_at?: string;
}

export type ReservationStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export interface Reservation {
  id?: number;
  restaurant_id: number;
  table_id: number;
  customer_name: string;
  customer_phone: string;
  party_size: number;
  reservation_date: string;
  reservation_time: string;
  duration_hours: number;
  status?: ReservationStatus;
  created_at?: string;
}

export interface AvailableSlot {
  time: string;
  available_tables: number[];
}

export interface RestaurantWithTables extends Restaurant {
  tables?: Table[];
}

