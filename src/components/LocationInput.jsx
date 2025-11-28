import { useState } from 'react';
import './LocationInput.css';

function LocationInput({ onLocationSubmit }) {
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleUseCurrentLocation = () => {
    setError(null);
    setLoading(true);

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLoading(false);
        onLocationSubmit(
          position.coords.latitude,
          position.coords.longitude,
          'Your current location'
        );
      },
      (err) => {
        setLoading(false);
        setError(`Error getting location: ${err.message}`);
      }
    );
  };

  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    if (!address.trim()) {
      setError('Please enter an address');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const response = await fetch(
        `/api/geocode?address=${encodeURIComponent(address)}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to geocode address');
      }

      const data = await response.json();
      setLoading(false);
      onLocationSubmit(data.lat, data.lon, data.display_name);
    } catch (err) {
      setLoading(false);
      setError(err.message);
    }
  };

  return (
    <div className="location-input">
      <div className="input-section">
        <h2>Enter a Location</h2>

        <form onSubmit={handleAddressSubmit} className="address-form">
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Enter an address (e.g., Times Square, New York)"
            className="address-input"
            disabled={loading}
          />
          <button type="submit" className="btn btn-primary" disabled={loading}>
            Search
          </button>
        </form>

        <div className="divider">
          <span>OR</span>
        </div>

        <button
          onClick={handleUseCurrentLocation}
          className="btn btn-secondary"
          disabled={loading}
        >
          📍 Use My Current Location
        </button>

        {error && (
          <div className="input-error">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

export default LocationInput;
