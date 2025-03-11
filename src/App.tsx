import React, { useState } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import RouteMap from './components/RouteMap';
import ControlPanel from './components/ControlPanel';
import { RouteData, DailyStats } from './types';
import { processCSVData } from './services/dataService';

const App: React.FC = () => {
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [optimizedRouteData, setOptimizedRouteData] = useState<RouteData | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('all');
  const [showComparison, setShowComparison] = useState<boolean>(false);
  const [comparisonStats, setComparisonStats] = useState<{
    originalDistance: number;
    optimizedDistance: number;
    savedDistance: number;
    savedPercentage: number;
  } | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, isOptimized: boolean = false) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const data = await processCSVData(file);
      
      if (isOptimized) {
        setOptimizedRouteData(data);
      } else {
        setRouteData(data);
        setSelectedDate('all');
      }

      // Reset comparison if we're uploading new files
      setShowComparison(false);
      setComparisonStats(null);
    } catch (error) {
      console.error('Error processing file:', error);
      alert('Error processing file. Please check the console for details.');
    }
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
  };

  const compareRoutes = () => {
    if (!routeData || !optimizedRouteData) return;

    // Calculate total distances
    const originalDistance = routeData.allStats.reduce((sum, stat) => sum + stat.distance, 0);
    const optimizedDistance = optimizedRouteData.allStats.reduce((sum, stat) => sum + stat.distance, 0);
    
    const savedDistance = originalDistance - optimizedDistance;
    const savedPercentage = (savedDistance / originalDistance) * 100;

    setComparisonStats({
      originalDistance,
      optimizedDistance,
      savedDistance,
      savedPercentage
    });

    setShowComparison(true);
  };

  const getFilteredData = (data: RouteData | null): RouteData | null => {
    if (!data) return null;

    if (selectedDate === 'all') {
      return data;
    }

    const filteredLocations = data.locations.filter(loc => 
      loc.date && loc.date.split('T')[0] === selectedDate
    );

    const filteredStats = data.allStats.find(stat => stat.date === selectedDate);
    
    return {
      ...data,
      locations: filteredLocations,
      allStats: filteredStats ? [filteredStats] : []
    };
  };

  const filteredRouteData = getFilteredData(routeData);
  const filteredOptimizedData = showComparison ? getFilteredData(optimizedRouteData) : null;

  const center = filteredRouteData?.locations[0]?.coordinates || [52.1326, 5.2913]; // Default to Netherlands center

  return (
    <div className="app">
      <MapContainer center={center} zoom={8} style={{ height: '100vh', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {filteredRouteData && (
          <RouteMap 
            routeData={filteredRouteData} 
            isOptimized={false}
          />
        )}
        {showComparison && filteredOptimizedData && (
          <RouteMap 
            routeData={filteredOptimizedData} 
            isOptimized={true}
          />
        )}
      </MapContainer>
      
      <ControlPanel
        routeData={routeData}
        optimizedRouteData={optimizedRouteData}
        selectedDate={selectedDate}
        onDateChange={handleDateChange}
        onFileUpload={handleFileUpload}
        onCompareRoutes={compareRoutes}
        showComparison={showComparison}
        comparisonStats={comparisonStats}
      />
    </div>
  );
};

export default App; 