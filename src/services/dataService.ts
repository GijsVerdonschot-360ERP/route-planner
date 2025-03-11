import Papa from 'papaparse';
import { Location, RouteData, DailyStats } from '../types';
import addressCacheData from '../data/addressCache.json';

// Define the type for the address cache data
interface AddressCacheData {
  [key: string]: number[];
}

// Convert the imported JSON data to the correct format
const convertAddressCache = (data: AddressCacheData): Record<string, [number, number]> => {
  const result: Record<string, [number, number]> = {};
  
  for (const [address, coords] of Object.entries(data)) {
    if (coords.length >= 2) {
      result[address] = [coords[0], coords[1]];
    }
  }
  
  return result;
};

// Initialize address cache from both JSON and localStorage
const initializeAddressCache = (): Record<string, [number, number]> => {
  // First load the default cache from JSON
  let cache = convertAddressCache(addressCacheData as AddressCacheData);
  
  // Try to load additional entries from localStorage
  try {
    const storedCache = localStorage.getItem('addressCache');
    if (storedCache) {
      const parsedCache = JSON.parse(storedCache);
      // Merge with preference for stored values
      cache = { ...cache, ...parsedCache };
    }
  } catch (error) {
    console.warn('Failed to load address cache from localStorage:', error);
  }
  
  return cache;
};

// Initialize with combined data
let addressCache: Record<string, [number, number]> = initializeAddressCache();

// Function to extract address from the delivery address field
const extractAddress = (addressField: string): string => {
  // Format: "Company name, City, Street Address"
  const parts = addressField.split(', ');
  console.log(`Extracting address from: "${addressField}" - parts: ${JSON.stringify(parts)}`);
  
  if (parts.length >= 3) {
    return `${parts[2]}, ${parts[1]}, Netherlands`;
  } else if (parts.length === 2) {
    return `${parts[1]}, Netherlands`;
  }
  return addressField;
};

// Function to geocode an address with fallback
const geocodeAddress = async (address: string): Promise<[number, number] | null> => {
  // Check cache first
  if (addressCache[address]) {
    return addressCache[address];
  }
  
  // Try to find a partial match in the cache
  const addressLower = address.toLowerCase();
  for (const [cachedAddress, coords] of Object.entries(addressCache)) {
    if (addressLower.includes(cachedAddress.toLowerCase().split(',')[0]) || 
        cachedAddress.toLowerCase().includes(addressLower.split(',')[0])) {
      console.log(`Using partial match from cache: "${address}" -> "${cachedAddress}"`);
      // Add this address to the cache with the same coordinates
      addressCache[address] = coords;
      return coords;
    }
  }

  try {
    // Use Nominatim API for geocoding
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
      {
        headers: {
          'User-Agent': 'RoutePlannerApp/1.0'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Geocoding failed: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Modified sections where cache is updated to include localStorage save
    const saveToCache = (addr: string, coords: [number, number]) => {
      addressCache[addr] = coords;
      try {
        localStorage.setItem('addressCache', JSON.stringify(addressCache));
      } catch (error) {
        console.warn('Failed to save address cache to localStorage:', error);
      }
    };

    if (data && data.length > 0) {
      const coords: [number, number] = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
      saveToCache(address, coords);
      return coords;
    }
    
    // Fallback: Try geocoding just the city
    const cityPart = address.split(',')[1]?.trim();
    if (cityPart) {
      const cityQuery = `${cityPart}, Netherlands`;
      console.log(`Trying fallback geocoding with city: "${cityQuery}"`);
      
      const cityResponse = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cityQuery)}&limit=1`,
        {
          headers: {
            'User-Agent': 'RoutePlannerApp/1.0'
          }
        }
      );
      
      if (cityResponse.ok) {
        const cityData = await cityResponse.json();
        if (cityData && cityData.length > 0) {
          const cityCoords: [number, number] = [parseFloat(cityData[0].lat), parseFloat(cityData[0].lon)];
          
          // Add slight random offset to prevent overlapping markers
          const randomOffset = () => (Math.random() - 0.5) * 0.01;
          const adjustedCoords: [number, number] = [
            cityCoords[0] + randomOffset(),
            cityCoords[1] + randomOffset()
          ];
          
          saveToCache(address, adjustedCoords);
          console.log(`Using city fallback for "${address}": ${adjustedCoords}`);
          console.log(`City fallback geocoded - consider adding to addressCache.json: "${address}": [${adjustedCoords[0]}, ${adjustedCoords[1]}]`);
          
          return adjustedCoords;
        }
      }
    }
    
    // Last resort fallback - use a default location in the Netherlands
    console.warn(`No geocoding results found for address: "${address}", using default location`);
    const defaultCoords: [number, number] = [52.1326 + Math.random() * 0.1, 5.2913 + Math.random() * 0.1];
    saveToCache(address, defaultCoords);
    return defaultCoords;
  } catch (error) {
    console.error(`Error geocoding address "${address}":`, error);
    // Even if there's an error, return a default location
    const errorFallbackCoords: [number, number] = [52.1326 + Math.random() * 0.1, 5.2913 + Math.random() * 0.1];
    addressCache[address] = errorFallbackCoords;
    return errorFallbackCoords;
  }
};

// Function to calculate distance between two coordinates using Haversine formula
const calculateDistance = (coord1: [number, number], coord2: [number, number]): number => {
  const toRad = (value: number) => (value * Math.PI) / 180;
  
  const R = 6371; // Earth's radius in km
  const dLat = toRad(coord2[0] - coord1[0]);
  const dLon = toRad(coord2[1] - coord1[1]);
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRad(coord1[0])) * Math.cos(toRad(coord2[0])) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Function to calculate route distance
const calculateRouteDistance = (coordinates: [number, number][]): number => {
  let totalDistance = 0;
  for (let i = 0; i < coordinates.length - 1; i++) {
    totalDistance += calculateDistance(coordinates[i], coordinates[i+1]);
  }
  return totalDistance;
};

// Function to get unique dates from locations
const getUniqueDates = (locations: Location[]): string[] => {
  const dates = locations
    .map(loc => loc.date ? loc.date.split('T')[0] : null)
    .filter((date): date is string => date !== null);
  
  return Array.from(new Set(dates)).sort();
};

// Function to filter locations by date
const filterByDate = (locations: Location[], selectedDate: string | null): Location[] => {
  if (!selectedDate) return locations;
  
  return locations.filter(loc => 
    loc.date && loc.date.split('T')[0] === selectedDate
  );
};

// Function to calculate daily statistics
const calculateDailyStats = (locations: Location[]): DailyStats[] => {
  const uniqueDates = getUniqueDates(locations);
  const stats: DailyStats[] = [];
  
  for (const date of uniqueDates) {
    const dayLocations = filterByDate(locations, date);
    const validCoords = dayLocations
      .map(loc => loc.coordinates)
      .filter((coord): coord is [number, number] => coord !== null);
    
    if (validCoords.length > 1) {
      const distance = calculateRouteDistance(validCoords);
      const totalTime = dayLocations.reduce((sum, loc) => sum + loc.time, 0);
      
      stats.push({
        date,
        distance: parseFloat(distance.toFixed(2)),
        totalTime: parseFloat(totalTime.toFixed(2)),
        locations: dayLocations.length
      });
    }
  }
  
  return stats;
};

// Main function to process CSV data
export const processCSVData = (file: File): Promise<RouteData> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      delimiter: ';',
      dynamicTyping: true,
      skipEmptyLines: true,
      encoding: 'UTF-8',
      complete: async (results) => {
        try {
          const rows = results.data as any[];
          console.log(`Parsed ${rows.length} rows from CSV`);
          
          // Process each row to create location objects
          const locations: Location[] = [];
          const failedAddresses: string[] = [];
          
          for (const row of rows) {
            // Skip rows without required fields
            if (!row['Abonnement'] || !row['Abonnement/Afleveradres']) {
              console.warn(`Skipping row due to missing required fields:`, row);
              continue;
            }
            
            // Extract address
            const fullAddress = row['Abonnement/Afleveradres'];
            const address = extractAddress(fullAddress);
            
            // Geocode address
            const coordinates = await geocodeAddress(address);
            
            if (coordinates) {
              // Parse date/time fields
              let date = null;
              let startTime = null;
              let endTime = null;
              
              if (row['Begin datum-tijd']) {
                startTime = new Date(row['Begin datum-tijd']).toISOString();
                date = startTime;
              } else if (row['Startdatum']) {
                date = new Date(row['Startdatum']).toISOString();
              }
              
              if (row['Eind datum-tijd']) {
                endTime = new Date(row['Eind datum-tijd']).toISOString();
              }
              
              // Create location object
              const location: Location = {
                id: row['Externe ID'] || `loc_${locations.length}`,
                name: row['Abonnement'],
                address: fullAddress,
                coordinates,
                time: parseFloat((row['Benodigde tijd (uren)'] || 0).toString().replace(',', '.')),
                date: date || undefined,
                startTime: startTime || undefined,
                endTime: endTime || undefined,
                assignedTo: row['Toegewezen aan']
              };
              
              console.log(`Added location: ${location.name} at ${location.address}`);
              locations.push(location);
            } else {
              failedAddresses.push(fullAddress);
              console.error(`Failed to geocode address: ${fullAddress}`);
            }
          }
          
          if (failedAddresses.length > 0) {
            console.error(`Failed to geocode ${failedAddresses.length} addresses:`, failedAddresses);
          }
          
          // Sort locations by date/time
          locations.sort((a, b) => {
            if (!a.date) return -1;
            if (!b.date) return 1;
            return new Date(a.date).getTime() - new Date(b.date).getTime();
          });
          
          // Calculate statistics
          const allStats = calculateDailyStats(locations);
          const uniqueDates = getUniqueDates(locations);
          
          console.log(`Processed ${locations.length} locations with ${uniqueDates.length} unique dates`);
          
          resolve({
            locations,
            allStats,
            uniqueDates
          });
        } catch (error) {
          console.error('Error processing CSV data:', error);
          reject(error);
        }
      },
      error: (error) => {
        console.error('Error parsing CSV:', error);
        reject(error);
      }
    });
  });
};

// Function to export the current address cache
export const exportAddressCache = (): string => {
  return JSON.stringify(addressCache, null, 2);
}; 