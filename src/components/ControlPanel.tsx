import React from 'react';
import { RouteData } from '../types';

interface ControlPanelProps {
  routeData: RouteData | null;
  optimizedRouteData: RouteData | null;
  selectedDate: string;
  onDateChange: (date: string) => void;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>, isOptimized?: boolean) => void;
  onCompareRoutes: () => void;
  showComparison: boolean;
  comparisonStats: {
    originalDistance: number;
    optimizedDistance: number;
    savedDistance: number;
    savedPercentage: number;
  } | null;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  routeData,
  optimizedRouteData,
  selectedDate,
  onDateChange,
  onFileUpload,
  onCompareRoutes,
  showComparison,
  comparisonStats
}) => {
  // Calculate current stats based on selected date
  const getCurrentStats = () => {
    if (!routeData) return { distance: 0, totalTime: 0, locations: 0 };
    
    if (selectedDate === 'all') {
      // Sum up all stats
      return routeData.allStats.reduce(
        (acc, stat) => ({
          distance: acc.distance + stat.distance,
          totalTime: acc.totalTime + stat.totalTime,
          locations: acc.locations + stat.locations
        }),
        { distance: 0, totalTime: 0, locations: 0 }
      );
    } else {
      // Find stats for selected date
      const dateStat = routeData.allStats.find(stat => stat.date === selectedDate);
      return dateStat || { distance: 0, totalTime: 0, locations: 0 };
    }
  };

  const currentStats = getCurrentStats();

  return (
    <div className="control-panel">
      <h3 style={{ textAlign: 'center', marginTop: 0 }}>Route Controls</h3>
      
      {/* File Upload Section */}
      <div className="file-upload">
        <h4>Upload Route Data</h4>
        <div>
          <p>Original Route:</p>
          <input
            type="file"
            id="original-file"
            accept=".csv"
            onChange={(e) => onFileUpload(e)}
          />
          <label htmlFor="original-file">Choose File</label>
          {routeData && <span style={{ marginLeft: '10px' }}>✓</span>}
        </div>
        
        <div style={{ marginTop: '10px' }}>
          <p>Optimized Route (Optional):</p>
          <input
            type="file"
            id="optimized-file"
            accept=".csv"
            onChange={(e) => onFileUpload(e, true)}
          />
          <label htmlFor="optimized-file">Choose File</label>
          {optimizedRouteData && <span style={{ marginLeft: '10px' }}>✓</span>}
        </div>
      </div>
      
      {/* Date Selection */}
      {routeData && (
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="date-select"><b>Select Date:</b></label>
          <select
            id="date-select"
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
          >
            <option value="all">All Dates</option>
            {routeData.uniqueDates.map(date => (
              <option key={date} value={date}>
                {new Date(date).toLocaleDateString()}
              </option>
            ))}
          </select>
        </div>
      )}
      
      {/* Current Stats */}
      {routeData && (
        <div id="stats-panel" style={{ marginTop: '20px' }}>
          <h4 style={{ marginTop: 0 }}>Statistics</h4>
          <div id="current-stats">
            <p><b>Total Distance:</b> <span id="total-distance">{currentStats.distance.toFixed(2)}</span> km</p>
            <p><b>Total Time:</b> <span id="total-time">{currentStats.totalTime.toFixed(2)}</span> hours</p>
            <p><b>Locations:</b> <span id="total-locations">{currentStats.locations}</span></p>
          </div>
          
          {/* Compare Routes Button */}
          {routeData && optimizedRouteData && !showComparison && (
            <div className="compare-container">
              <button className="compare-button" onClick={onCompareRoutes}>
                Compare Routes
              </button>
            </div>
          )}
          
          {/* Comparison Stats */}
          {showComparison && comparisonStats && (
            <div className="comparison-stats">
              <h4>Route Comparison</h4>
              <p><b>Original Distance:</b> {comparisonStats.originalDistance.toFixed(2)} km</p>
              <p><b>Optimized Distance:</b> {comparisonStats.optimizedDistance.toFixed(2)} km</p>
              <p><b>Distance Saved:</b> {comparisonStats.savedDistance.toFixed(2)} km</p>
              <p><b>Improvement:</b> {comparisonStats.savedPercentage.toFixed(2)}%</p>
            </div>
          )}
          
          {/* All Stats Table */}
          {routeData.allStats.length > 0 && (
            <div id="all-stats" style={{ marginTop: '15px' }}>
              <h4>Daily Statistics</h4>
              <table className="stats-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Distance</th>
                    <th>Time</th>
                    <th>Stops</th>
                  </tr>
                </thead>
                <tbody>
                  {routeData.allStats.map(stat => (
                    <tr key={stat.date}>
                      <td>{new Date(stat.date).toLocaleDateString()}</td>
                      <td>{stat.distance.toFixed(2)} km</td>
                      <td>{stat.totalTime.toFixed(2)} h</td>
                      <td>{stat.locations}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ControlPanel; 