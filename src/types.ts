export interface Location {
  id: string;
  name: string;
  address: string;
  coordinates: [number, number]; // [latitude, longitude]
  time: number; // Required time in hours
  date?: string; // ISO date string
  startTime?: string; // ISO datetime string
  endTime?: string; // ISO datetime string
  assignedTo?: string;
}

export interface DailyStats {
  date: string;
  distance: number;
  totalTime: number;
  locations: number;
}

export interface RouteData {
  locations: Location[];
  allStats: DailyStats[];
  uniqueDates: string[];
} 