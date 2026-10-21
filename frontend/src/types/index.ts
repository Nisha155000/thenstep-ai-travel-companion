export interface LocationPoint {
  name: string;
  lat: float;
  lon: float;
  display_name?: string;
  city?: string;
  state?: string;
  category?: string;
}

export type float = number;

export interface RouteStep {
  step_number: number;
  mode: string;
  instruction: string;
  instruction_kn?: string;
  instruction_hi?: string;
  distance_meters: number;
  duration_minutes: number;
  from_name: string;
  to_name: string;
  line_number?: string;
  frequency_notes?: string;
  is_general_recommendation?: boolean;
}

export interface RouteOption {
  id: string;
  mode: string;
  title: string;
  subtitle: string;
  estimated_duration_min: number;
  distance_km: number;
  walking_distance_m: number;
  transfers: number;
  estimated_fare_inr?: number;
  fare_label: string;
  is_fare_estimated: boolean;
  fare_breakdown?: string;
  ranking_score: number;
  ranking_badge?: string;
  data_source: string;
  limitations: string[];
  coordinates: [number, number][]; // [[lat, lon], ...]
  steps: RouteStep[];
}

export interface InterviewBufferSummary {
  required_arrival_time: string;
  suggested_departure_time: string;
  estimated_journey_duration_min: number;
  safety_buffer_min: number;
  buffer_rationale: string;
  traffic_peak_warning?: string;
  data_limitation_warning: string;
}

export interface JourneyPlanRequest {
  origin_name: string;
  origin_lat: number;
  origin_lon: number;
  destination_name: string;
  destination_lat: number;
  destination_lon: number;
  purpose: string;
  arrival_time: string;
  budget_level: string;
  budget_limit_inr?: number;
  priority: string;
  custom_buffer_minutes?: number;
  needs_breakfast: boolean;
  needs_freshen_up: boolean;
  needs_waiting_place: boolean;
}

export interface JourneyPlanResponse {
  plan_id: string;
  purpose: string;
  arrival_calculator: InterviewBufferSummary;
  ranked_routes: RouteOption[];
  selected_route: RouteOption;
  nearby_recommendations_summary: {
    destination_name: string;
    has_breakfast_needed: boolean;
    has_freshen_up_needed: boolean;
    has_waiting_needed: boolean;
    note: string;
  };
  honest_disclaimer: string;
}

export interface NearbyPlace {
  id: string;
  name: string;
  category: string;
  category_label: string;
  lat: number;
  lon: number;
  distance_meters: number;
  access_type: 'verified_public' | 'commercial_customer_only' | 'unconfirmed';
  access_label: string;
  address?: string;
  opening_hours?: string;
  cuisine?: string;
  confirmation_note: string;
}

export interface SavedJourney {
  id: number;
  title: string;
  origin_name: string;
  origin_lat: number;
  origin_lon: number;
  destination_name: string;
  destination_lat: number;
  destination_lon: number;
  purpose: string;
  arrival_time: string;
  suggested_departure_time?: string;
  buffer_minutes: number;
  selected_mode: string;
  estimated_duration_min: number;
  estimated_fare?: string;
  itinerary_data: any;
  created_at: string;
}

export interface UserPreference {
  id?: number;
  default_buffer_minutes: number;
  preferred_mode: string;
  priority: string;
  language: string;
}
