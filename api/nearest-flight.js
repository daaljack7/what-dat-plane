// Serverless function to fetch nearest flight from OpenSky Network API
import cache from './utils/cache.js';
import { flightRateLimiter, checkRateLimit } from './utils/rateLimit.js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Check rate limit
  if (!checkRateLimit(flightRateLimiter, req, res)) {
    return;
  }

  const { lat, lon } = req.query;

  if (!lat || !lon) {
    return res.status(400).json({ error: 'Latitude and longitude are required' });
  }

  const latitude = parseFloat(lat);
  const longitude = parseFloat(lon);

  // Create cache key based on rounded coordinates (to ~1km precision)
  const cacheKey = `flight:${latitude.toFixed(2)}:${longitude.toFixed(2)}`;

  // Check cache first
  const cachedData = cache.get(cacheKey);
  if (cachedData) {
    res.setHeader('X-Cache', 'HIT');
    return res.status(200).json(cachedData);
  }

  res.setHeader('X-Cache', 'MISS');

  try {
    // Fetch all flights from OpenSky Network
    // We'll get all flights and filter client-side, but limit the area
    const response = await fetch(
      `https://opensky-network.org/api/states/all`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`OpenSky API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.states || data.states.length === 0) {
      return res.status(404).json({ error: 'No flights found' });
    }

    // Find nearest flight
    let nearestFlight = null;
    let minDistance = Infinity;

    data.states.forEach((state) => {
      const [
        icao24,           // 0: Unique ICAO 24-bit address
        callsign,         // 1: Callsign
        origin_country,   // 2: Country
        time_position,    // 3: Unix timestamp
        last_contact,     // 4: Unix timestamp
        lon_position,     // 5: Longitude
        lat_position,     // 6: Latitude
        baro_altitude,    // 7: Barometric altitude in meters
        on_ground,        // 8: Boolean
        velocity,         // 9: Velocity in m/s
        true_track,       // 10: True track in degrees
        vertical_rate,    // 11: Vertical rate in m/s
        sensors,          // 12: Sensors
        geo_altitude,     // 13: Geometric altitude in meters
        squawk,           // 14: Squawk code
        spi,              // 15: Special purpose indicator
        position_source   // 16: Position source
      ] = state;

      // Skip if no position data or on ground
      if (!lat_position || !lon_position || on_ground) {
        return;
      }

      // Calculate distance using Haversine formula
      const distance = getDistance(latitude, longitude, lat_position, lon_position);

      if (distance < minDistance) {
        minDistance = distance;
        nearestFlight = {
          icao24,
          callsign: callsign?.trim() || 'Unknown',
          origin_country,
          longitude: lon_position,
          latitude: lat_position,
          baro_altitude,
          geo_altitude,
          velocity,
          true_track,
          vertical_rate,
          on_ground,
          last_contact,
          distance: Math.round(distance * 100) / 100, // Round to 2 decimals
        };
      }
    });

    if (!nearestFlight) {
      return res.status(404).json({ error: 'No flights found in the air' });
    }

    // Cache the result for 30 seconds (flights move, so don't cache too long)
    cache.set(cacheKey, nearestFlight, 30);

    res.status(200).json(nearestFlight);
  } catch (error) {
    console.error('Error fetching flight data:', error);
    res.status(500).json({ error: 'Failed to fetch flight data', details: error.message });
  }
}

// Haversine formula to calculate distance between two coordinates
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees) {
  return degrees * (Math.PI / 180);
}
