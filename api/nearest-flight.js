// Serverless function to fetch nearest flight from OpenSky Network API
// Simplified version without caching/rate limiting for debugging

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

  const { lat, lon } = req.query;

  if (!lat || !lon) {
    return res.status(400).json({ error: 'Latitude and longitude are required' });
  }

  const latitude = parseFloat(lat);
  const longitude = parseFloat(lon);

  // Define bounding box: ~2 degrees (~220km) around the point
  const lamin = latitude - 2;
  const lamax = latitude + 2;
  const lomin = longitude - 2;
  const lomax = longitude + 2;

  try {
    // Use bounding box to reduce data and improve reliability
    const url = `https://opensky-network.org/api/states/all?lamin=${lamin}&lomin=${lomin}&lamax=${lamax}&lomax=${lomax}`;
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'WhatDatPlane/1.0'
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenSky API error:', response.status, errorText);
      throw new Error(`OpenSky API error: ${response.status} - ${errorText}`);
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
        icao24,           // 0
        callsign,         // 1
        origin_country,   // 2
        time_position,    // 3
        last_contact,     // 4
        lon_position,     // 5
        lat_position,     // 6
        baro_altitude,    // 7
        on_ground,        // 8
        velocity,         // 9
        true_track,       // 10
        vertical_rate,    // 11
        sensors,          // 12
        geo_altitude,     // 13
        squawk,           // 14
        spi,              // 15
        position_source   // 16
      ] = state;

      if (!lat_position || !lon_position || on_ground) {
        return;
      }

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
          distance: Math.round(distance * 100) / 100,
        };
      }
    });

    if (!nearestFlight) {
      return res.status(404).json({ error: 'No flights found in the air' });
    }

    res.status(200).json(nearestFlight);
  } catch (error) {
    console.error('Error fetching flight data:', error);
    res.status(500).json({ error: 'Failed to fetch flight data', details: error.message });
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
