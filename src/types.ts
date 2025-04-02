export interface Location {
  id: string;
  name: string;
  address: string;
  notes?: string;
  coordinates: [number, number] | null;
  time: number; // Required time in hours
  date?: string; // ISO date string
  startTime?: string; // ISO datetime string
  endTime?: string; // ISO datetime string
  assignedTo?: string;
  visitType?: string; // New field for 'Bezoektype'
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