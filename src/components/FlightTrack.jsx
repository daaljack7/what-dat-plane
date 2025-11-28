import './FlightTrack.css';

function FlightTrack({ trackData, currentPosition }) {
  if (!trackData || !trackData.path || trackData.path.length === 0) {
    return (
      <div className="flight-track">
        <h3>Flight Track</h3>
        <p className="no-data">No track data available for this flight.</p>
      </div>
    );
  }

  const path = trackData.path;
  const startPoint = path[0];
  const endPoint = path[path.length - 1];

  // Calculate bounding box for the path
  const lats = path.map(p => p[1]).filter(lat => lat !== null);
  const lons = path.map(p => p[2]).filter(lon => lon !== null);

  if (lats.length === 0 || lons.length === 0) {
    return (
      <div className="flight-track">
        <h3>Flight Track</h3>
        <p className="no-data">No valid position data available.</p>
      </div>
    );
  }

  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);

  // Add padding
  const padding = 0.1;
  const latRange = maxLat - minLat || 0.1;
  const lonRange = maxLon - minLon || 0.1;

  const viewBox = {
    minX: minLon - lonRange * padding,
    minY: minLat - latRange * padding,
    width: lonRange * (1 + 2 * padding),
    height: latRange * (1 + 2 * padding),
  };

  // Convert lat/lon to SVG coordinates
  const toSvgX = (lon) => lon;
  const toSvgY = (lat) => -lat; // Invert Y axis

  // Create path string
  const pathPoints = path
    .filter(p => p[1] !== null && p[2] !== null)
    .map(p => [toSvgX(p[2]), toSvgY(p[1])]);

  const pathString = pathPoints
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`)
    .join(' ');

  return (
    <div className="flight-track">
      <h3>Flight Track History</h3>
      <div className="track-info">
        <p>Showing last {path.length} position updates</p>
      </div>
      <svg
        className="track-svg"
        viewBox={`${viewBox.minX} ${-viewBox.minY - viewBox.height} ${viewBox.width} ${viewBox.height}`}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Draw path */}
        <path
          d={pathString}
          stroke="#3b82f6"
          strokeWidth={viewBox.width / 200}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Draw start point */}
        {startPoint[1] && startPoint[2] && (
          <circle
            cx={toSvgX(startPoint[2])}
            cy={toSvgY(startPoint[1])}
            r={viewBox.width / 100}
            fill="#10b981"
            stroke="#fff"
            strokeWidth={viewBox.width / 400}
          />
        )}

        {/* Draw end point (current position) */}
        {endPoint[1] && endPoint[2] && (
          <circle
            cx={toSvgX(endPoint[2])}
            cy={toSvgY(endPoint[1])}
            r={viewBox.width / 80}
            fill="#ef4444"
            stroke="#fff"
            strokeWidth={viewBox.width / 300}
          />
        )}
      </svg>

      <div className="track-legend">
        <div className="legend-item">
          <span className="legend-color start"></span>
          <span>Start Position</span>
        </div>
        <div className="legend-item">
          <span className="legend-color current"></span>
          <span>Current Position</span>
        </div>
      </div>
    </div>
  );
}

export default FlightTrack;
