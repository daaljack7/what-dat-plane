import { useState } from 'react';
import LocationInput from './components/LocationInput';
import FlightDetails from './components/FlightDetails';
import './App.css';

function App() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [flightData, setFlightData] = useState(null);
  const [locationName, setLocationName] = useState('');

  const handleLocationSubmit = async (lat, lon, displayName) => {
    setLoading(true);
    setError(null);
    setFlightData(null);
    setLocationName(displayName || `${lat.toFixed(4)}, ${lon.toFixed(4)}`);

    try {
      // Use relative path - Vite proxy handles dev, Vercel handles production
      const response = await fetch(
        `/api/nearest-flight?lat=${lat}&lon=${lon}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch flight data');
      }

      const data = await response.json();
      setFlightData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>✈️ What Dat Plane?</h1>
        <p className="subtitle">Find the nearest plane to any location</p>
      </header>

      <main className="app-main">
        <LocationInput onLocationSubmit={handleLocationSubmit} />

        {loading && (
          <div className="loading">
            <div className="spinner"></div>
            <p>Searching for nearest plane...</p>
          </div>
        )}

        {error && (
          <div className="error">
            <h3>⚠️ Error</h3>
            <p>{error}</p>
          </div>
        )}

        {flightData && !loading && (
          <FlightDetails
            flight={flightData}
            locationName={locationName}
          />
        )}
      </main>

      <footer className="app-footer">
        <p>
          Data provided by{' '}
          <a href="https://opensky-network.org/" target="_blank" rel="noopener noreferrer">
            OpenSky Network
          </a>
        </p>
      </footer>
    </div>
  );
}

export default App;
