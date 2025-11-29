import { useState, useEffect } from 'react';
import FlightTrack from './FlightTrack';
import AltitudeGraph from './AltitudeGraph';
import AircraftPhoto from './AircraftPhoto';
import './FlightDetails.css';

function FlightDetails({ flight, locationName }) {
  const [trackData, setTrackData] = useState(null);
  const [loadingTrack, setLoadingTrack] = useState(false);

  useEffect(() => {
    // Fetch flight track data when flight changes
    const fetchTrackData = async () => {
      setLoadingTrack(true);
      try {
        const response = await fetch(
          `/api/flight-track?icao24=${flight.icao24}`
        );

        if (response.ok) {
          const data = await response.json();
          setTrackData(data);
        }
      } catch (err) {
        console.error('Error fetching track data:', err);
      } finally {
        setLoadingTrack(false);
      }
    };

    fetchTrackData();
  }, [flight.icao24]);

  // Convert meters to feet
  const metersToFeet = (meters) => {
    return meters ? Math.round(meters * 3.28084) : 0;
  };

  // Convert m/s to knots
  const msToKnots = (ms) => {
    return ms ? Math.round(ms * 1.94384) : 0;
  };

  // Convert m/s to feet per minute
  const msToFpm = (ms) => {
    return ms ? Math.round(ms * 196.85) : 0;
  };

  // Format distance
  const formatDistance = (km) => {
    if (km < 1) {
      return `${Math.round(km * 1000)} meters`;
    }
    return `${km.toFixed(2)} km (${(km * 0.621371).toFixed(2)} miles)`;
  };

  const altitude = flight.geo_altitude || flight.baro_altitude;
  const verticalRate = flight.vertical_rate || 0;
  const isClimbing = verticalRate > 1;
  const isDescending = verticalRate < -1;

  return (
    <div className="flight-details">
      <div className="details-header">
        <h2>Nearest Plane to {locationName}</h2>
        <div className="distance-badge">
          {formatDistance(flight.distance)} away
        </div>
      </div>

      <div className="details-grid">
        <div className="detail-card main-info">
          <h3>Flight Information</h3>
          <div className="info-row">
            <span className="label">Callsign:</span>
            <span className="value callsign">{flight.callsign}</span>
          </div>
          {flight.airline && flight.airline !== 'Unknown' && (
            <div className="info-row">
              <span className="label">Airline:</span>
              <span className="value">{flight.airline}</span>
            </div>
          )}
          {flight.departure && flight.departure !== 'Unknown' && flight.arrival && flight.arrival !== 'Unknown' && (
            <div className="info-row">
              <span className="label">Route:</span>
              <span className="value">{flight.departure} → {flight.arrival}</span>
            </div>
          )}
          <div className="info-row">
            <span className="label">ICAO24:</span>
            <span className="value">{flight.icao24.toUpperCase()}</span>
          </div>
          <div className="info-row">
            <span className="label">Country:</span>
            <span className="value">{flight.origin_country}</span>
          </div>
        </div>

        <div className="detail-card position-info">
          <h3>Position</h3>
          <div className="info-row">
            <span className="label">Latitude:</span>
            <span className="value">{flight.latitude.toFixed(6)}°</span>
          </div>
          <div className="info-row">
            <span className="label">Longitude:</span>
            <span className="value">{flight.longitude.toFixed(6)}°</span>
          </div>
          <div className="info-row">
            <span className="label">Heading:</span>
            <span className="value">{flight.true_track ? `${Math.round(flight.true_track)}°` : 'N/A'}</span>
          </div>
        </div>

        <div className="detail-card altitude-info">
          <h3>Altitude</h3>
          <div className="info-row">
            <span className="label">Altitude:</span>
            <span className="value">
              {altitude ? `${metersToFeet(altitude).toLocaleString()} ft` : 'N/A'}
            </span>
          </div>
          <div className="info-row">
            <span className="label">Vertical Rate:</span>
            <span className={`value ${isClimbing ? 'climbing' : isDescending ? 'descending' : ''}`}>
              {msToFpm(verticalRate)} ft/min
              {isClimbing && ' ↗'}
              {isDescending && ' ↘'}
            </span>
          </div>
        </div>

        <div className="detail-card speed-info">
          <h3>Speed</h3>
          <div className="info-row">
            <span className="label">Ground Speed:</span>
            <span className="value">
              {flight.velocity ? `${msToKnots(flight.velocity)} knots` : 'N/A'}
            </span>
          </div>
          <div className="info-row">
            <span className="label">Last Update:</span>
            <span className="value">
              {new Date(flight.last_contact * 1000).toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>

      <AircraftPhoto icao24={flight.icao24} callsign={flight.callsign} />

      {loadingTrack && (
        <div className="loading-track">
          <div className="spinner"></div>
          <p>Loading flight track data...</p>
        </div>
      )}

      {trackData && !loadingTrack && (
        <>
          <FlightTrack trackData={trackData} currentPosition={flight} />
          <AltitudeGraph trackData={trackData} />
        </>
      )}
    </div>
  );
}

export default FlightDetails;
