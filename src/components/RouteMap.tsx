import React, { useEffect } from 'react';
import { Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { RouteData } from '../types';

// Fix for default marker icons in Leaflet with React
// Instead of importing images directly, use the URLs
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

// Set default icon for all markers
L.Marker.prototype.options.icon = DefaultIcon;

interface RouteMapProps {
  routeData: RouteData;
  isOptimized: boolean;
}

const RouteMap: React.FC<RouteMapProps> = ({ routeData, isOptimized }) => {
  const map = useMap();
  const { locations } = routeData;
  
  // Create route coordinates for the polyline, filtering out null values
  const routeCoordinates = locations
    .map(loc => loc.coordinates)
    .filter((coord): coord is [number, number] => coord !== null);
  
  // Set map bounds to fit all markers
  useEffect(() => {
    if (routeCoordinates.length > 0) {
      const bounds = L.latLngBounds(routeCoordinates.map(coord => L.latLng(coord[0], coord[1])));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, routeCoordinates]);

  return (
    <>
      {/* Add markers for each location */}
      {locations
        .filter(location => location.coordinates !== null)
        .map((location) => (
          <Marker 
            key={location.id} 
            position={location.coordinates as [number, number]}
            icon={L.divIcon({
              className: 'custom-marker',
              html: `<div style="background-color: ${isOptimized ? '#4CAF50' : '#2196F3'}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>`,
              iconSize: [16, 16],
              iconAnchor: [8, 8]
            })}
          >
            <Popup>
              <div>
                <h3>{location.name.split(' - ')[1] || location.name}</h3>
                <p><strong>Address:</strong> {location.address}</p>
                {location.notes && (
                  <p><strong>Notes:</strong> {location.notes}</p>
                )}
                <p><strong>Time Required:</strong> {location.time} hours</p>
                {location.date && (
                  <p><strong>Date:</strong> {new Date(location.date).toLocaleDateString()}</p>
                )}
                {location.startTime && (
                  <p><strong>Start Time:</strong> {new Date(location.startTime).toLocaleTimeString()}</p>
                )}
                {location.assignedTo && (
                  <p><strong>Assigned To:</strong> {location.assignedTo}</p>
                )}
                {location.visitType && (
                  <p><strong>Visit Type:</strong> {location.visitType}</p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      
      {/* Add polyline for the route */}
      {routeCoordinates.length > 1 && (
        <Polyline 
          positions={routeCoordinates}
          color={isOptimized ? '#4CAF50' : '#2196F3'}
          weight={3}
          opacity={0.7}
          dashArray={isOptimized ? '5, 5' : ''}
        />
      )}
    </>
  );
};

export default RouteMap; 