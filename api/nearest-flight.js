// Main flight tracking endpoint using AviationStack API
// Updated to use environment variables
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { lat, lon } = req.query;

  if (!lat || !lon) {
    return res.status(400).json({ error: 'Latitude and longitude are required' });
  }

  const latitude = parseFloat(lat);
  const longitude = parseFloat(lon);

  // Check if API key is configured
  if (!process.env.AVIATIONSTACK_API_KEY) {
    return res.status(503).json({
      error: 'Flight tracking service not configured',
      details: 'Please add AVIATIONSTACK_API_KEY to environment variables. Get a free key at https://aviationstack.com/signup/free'
    });
  }

  try {
    // AviationStack real-time flights endpoint
    const url = `http://api.aviationstack.com/v1/flights?access_key=${process.env.AVIATIONSTACK_API_KEY}&limit=100`;

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AviationStack API error:', response.status, errorText);
      throw new Error(`AviationStack API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.data || data.data.length === 0) {
      return res.status(404).json({ error: 'No flights found' });
    }

    // Find nearest flight
    let nearestFlight = null;
    let minDistance = Infinity;

    data.data.forEach((flight) => {
      if (flight.live?.latitude && flight.live?.longitude) {
        const distance = getDistance(
          latitude,
          longitude,
          flight.live.latitude,
          flight.live.longitude
        );

        if (distance < minDistance) {
          minDistance = distance;
          nearestFlight = {
            icao24: flight.flight?.icao || flight.flight?.iata || 'unknown',
            callsign: flight.flight?.icao || flight.flight?.iata || 'Unknown',
            origin_country: flight.airline?.name || 'Unknown',
            longitude: flight.live.longitude,
            latitude: flight.live.latitude,
            baro_altitude: flight.live.altitude || 0,
            geo_altitude: flight.live.altitude || 0,
            velocity: flight.live.speed_horizontal || 0,
            true_track: flight.live.direction || 0,
            vertical_rate: flight.live.speed_vertical || 0,
            on_ground: flight.live.is_ground || false,
            last_contact: Math.floor(Date.now() / 1000),
            distance: Math.round(distance * 100) / 100,
            // Additional data from AviationStack
            departure: flight.departure?.airport || 'Unknown',
            arrival: flight.arrival?.airport || 'Unknown',
            airline: flight.airline?.name || 'Unknown'
          };
        }
      }
    });

    if (!nearestFlight) {
      return res.status(404).json({ error: 'No flights found in the air' });
    }

    res.status(200).json(nearestFlight);
  } catch (error) {
    console.error('Error fetching flight data:', error);
    res.status(500).json({
      error: 'Failed to fetch flight data',
      details: error.message,
      errorType: error.name
    });
  }
}

function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
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
