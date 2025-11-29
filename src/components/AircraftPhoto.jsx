import { useState, useEffect } from 'react';
import './AircraftPhoto.css';

function AircraftPhoto({ icao24, callsign, registration, aircraft }) {
  const [photoData, setPhotoData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchPhoto = async () => {
      setLoading(true);
      setError(false);

      try {
        // Pass registration and aircraft type to improve photo lookup
        const params = new URLSearchParams({ icao24 });
        if (registration) {
          params.append('registration', registration);
        }
        if (aircraft) {
          params.append('aircraft', aircraft);
        }
        const response = await fetch(`/api/aircraft-photo?${params}`);

        if (response.ok) {
          const data = await response.json();
          setPhotoData(data);

          if (!data.photoUrl) {
            setError(true);
          }
        } else {
          setError(true);
        }
      } catch (err) {
        console.error('Error fetching aircraft photo:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchPhoto();
  }, [icao24, registration, aircraft]);

  if (loading) {
    return (
      <div className="aircraft-photo">
        <h3>Aircraft Photo</h3>
        <div className="photo-loading">
          <div className="spinner"></div>
          <p>Loading photo...</p>
        </div>
      </div>
    );
  }

  if (error || !photoData?.photoUrl) {
    return (
      <div className="aircraft-photo">
        <h3>Aircraft Photo</h3>
        <div className="photo-placeholder">
          <div className="placeholder-icon">✈️</div>
          <p className="placeholder-text">
            {photoData?.error || 'No photo available for this aircraft'}
          </p>
          <p className="placeholder-subtext">
            ICAO24: {icao24.toUpperCase()} • Callsign: {callsign}
            {photoData?.registration && ` • Registration: ${photoData.registration}`}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="aircraft-photo">
      <h3>Aircraft Photo</h3>
      <div className="photo-container">
        <img src={photoData.photoUrl} alt={`Aircraft ${callsign}`} />
        {photoData.isGeneric && (
          <p className="photo-note" style={{ fontSize: '0.9em', color: '#666', marginTop: '0.5em' }}>
            Note: This is a generic {photoData.aircraft} photo, not this specific aircraft
          </p>
        )}
        {photoData.photographer && (
          <p className="photo-credit">
            Photo by {photoData.photographer}
            {photoData.link && (
              <> • <a href={photoData.link} target="_blank" rel="noopener noreferrer">View on Planespotters</a></>
            )}
          </p>
        )}
      </div>
    </div>
  );
}

export default AircraftPhoto;
