import './AltitudeGraph.css';

function AltitudeGraph({ trackData }) {
  if (!trackData || !trackData.path || trackData.path.length === 0) {
    return null;
  }

  const path = trackData.path;

  // Extract altitude data (index 3 is baro_altitude)
  const altitudeData = path
    .map((p, idx) => ({
      index: idx,
      time: p[0],
      altitude: p[3], // baro_altitude in meters
    }))
    .filter(d => d.altitude !== null);

  if (altitudeData.length === 0) {
    return (
      <div className="altitude-graph">
        <h3>Altitude Profile</h3>
        <p className="no-data">No altitude data available.</p>
      </div>
    );
  }

  const metersToFeet = (meters) => Math.round(meters * 3.28084);

  // Find min and max altitude
  const altitudes = altitudeData.map(d => d.altitude);
  const minAlt = Math.min(...altitudes);
  const maxAlt = Math.max(...altitudes);
  const altRange = maxAlt - minAlt || 1000;

  // Add padding to the graph
  const padding = altRange * 0.1;
  const graphMinAlt = minAlt - padding;
  const graphMaxAlt = maxAlt + padding;
  const graphAltRange = graphMaxAlt - graphMinAlt;

  const width = 800;
  const height = 300;
  const marginLeft = 60;
  const marginRight = 20;
  const marginTop = 20;
  const marginBottom = 40;
  const graphWidth = width - marginLeft - marginRight;
  const graphHeight = height - marginTop - marginBottom;

  // Scale functions
  const scaleX = (index) => marginLeft + (index / (altitudeData.length - 1)) * graphWidth;
  const scaleY = (altitude) => marginTop + graphHeight - ((altitude - graphMinAlt) / graphAltRange) * graphHeight;

  // Create path string
  const pathString = altitudeData
    .map((d, i) => {
      const x = scaleX(d.index);
      const y = scaleY(d.altitude);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  // Create area path (fill under the line)
  const areaPath = pathString +
    ` L ${scaleX(altitudeData[altitudeData.length - 1].index)} ${marginTop + graphHeight}` +
    ` L ${scaleX(altitudeData[0].index)} ${marginTop + graphHeight} Z`;

  // Y-axis ticks (altitude)
  const numYTicks = 5;
  const yTicks = Array.from({ length: numYTicks }, (_, i) => {
    const altitude = graphMinAlt + (i / (numYTicks - 1)) * graphAltRange;
    return {
      altitude,
      y: scaleY(altitude),
      label: metersToFeet(altitude).toLocaleString(),
    };
  });

  // X-axis ticks (time)
  const numXTicks = 5;
  const xTicks = Array.from({ length: numXTicks }, (_, i) => {
    const dataIndex = Math.floor(i / (numXTicks - 1) * (altitudeData.length - 1));
    const d = altitudeData[dataIndex];
    const time = new Date(d.time * 1000);
    return {
      x: scaleX(d.index),
      label: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  });

  return (
    <div className="altitude-graph">
      <h3>Altitude Profile</h3>
      <svg
        className="graph-svg"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Grid lines */}
        {yTicks.map((tick, i) => (
          <line
            key={`grid-y-${i}`}
            x1={marginLeft}
            y1={tick.y}
            x2={width - marginRight}
            y2={tick.y}
            stroke="#e5e7eb"
            strokeWidth="1"
          />
        ))}

        {/* Area under the line */}
        <path
          d={areaPath}
          fill="url(#altitudeGradient)"
          opacity="0.3"
        />

        {/* Altitude line */}
        <path
          d={pathString}
          stroke="#3b82f6"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Y-axis */}
        <line
          x1={marginLeft}
          y1={marginTop}
          x2={marginLeft}
          y2={height - marginBottom}
          stroke="#374151"
          strokeWidth="2"
        />

        {/* X-axis */}
        <line
          x1={marginLeft}
          y1={height - marginBottom}
          x2={width - marginRight}
          y2={height - marginBottom}
          stroke="#374151"
          strokeWidth="2"
        />

        {/* Y-axis labels */}
        {yTicks.map((tick, i) => (
          <text
            key={`label-y-${i}`}
            x={marginLeft - 10}
            y={tick.y}
            textAnchor="end"
            dominantBaseline="middle"
            fontSize="12"
            fill="#6b7280"
          >
            {tick.label}
          </text>
        ))}

        {/* X-axis labels */}
        {xTicks.map((tick, i) => (
          <text
            key={`label-x-${i}`}
            x={tick.x}
            y={height - marginBottom + 20}
            textAnchor="middle"
            fontSize="12"
            fill="#6b7280"
          >
            {tick.label}
          </text>
        ))}

        {/* Y-axis label */}
        <text
          x={-height / 2}
          y={15}
          transform="rotate(-90)"
          textAnchor="middle"
          fontSize="14"
          fill="#374151"
          fontWeight="600"
        >
          Altitude (feet)
        </text>

        {/* X-axis label */}
        <text
          x={width / 2}
          y={height - 5}
          textAnchor="middle"
          fontSize="14"
          fill="#374151"
          fontWeight="600"
        >
          Time
        </text>

        {/* Gradient definition */}
        <defs>
          <linearGradient id="altitudeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.1" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

export default AltitudeGraph;
