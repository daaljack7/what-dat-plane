// Main flight tracking endpoint using AirLabs API

// Airline code to name mapping
const airlineNames = {
  'AAL': 'American Airlines',
  'UAL': 'United Airlines',
  'DAL': 'Delta Air Lines',
  'SWA': 'Southwest Airlines',
  'JBU': 'JetBlue Airways',
  'ASA': 'Alaska Airlines',
  'SKW': 'SkyWest Airlines',
  'FFT': 'Frontier Airlines',
  'NKS': 'Spirit Airlines',
  'BAW': 'British Airways',
  'AFR': 'Air France',
  'DLH': 'Lufthansa',
  'KLM': 'KLM Royal Dutch Airlines',
  'UAE': 'Emirates',
  'QTR': 'Qatar Airways',
  'SIA': 'Singapore Airlines',
  'ANA': 'All Nippon Airways',
  'JAL': 'Japan Airlines',
  'CPA': 'Cathay Pacific',
  'QFA': 'Qantas',
  'ACA': 'Air Canada',
  'BAW': 'British Airways',
  'IBE': 'Iberia',
  'SAS': 'Scandinavian Airlines',
  'TAP': 'TAP Air Portugal',
  'THY': 'Turkish Airlines',
  'AAR': 'Asiana Airlines',
  'CCA': 'Air China',
  'CSN': 'China Southern Airlines',
  'CES': 'China Eastern Airlines'
};

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
  if (!process.env.AIRLABS_API_KEY) {
    return res.status(503).json({
      error: 'Flight tracking service not configured',
      details: 'Please add AIRLABS_API_KEY to environment variables. Get a free key at https://airlabs.co/signup'
    });
  }

  try {
    // AirLabs real-time flights endpoint
    // Get flights within bounding box
    const url = `https://airlabs.co/api/v9/flights?api_key=${process.env.AIRLABS_API_KEY}`;

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AirLabs API error:', response.status, errorText);
      throw new Error(`AirLabs API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.response || data.response.length === 0) {
      return res.status(404).json({ error: 'No flights found' });
    }

    // Find nearest flight
    let nearestFlight = null;
    let minDistance = Infinity;

    data.response.forEach((flight) => {
      if (flight.lat && flight.lng) {
        const distance = getDistance(
          latitude,
          longitude,
          flight.lat,
          flight.lng
        );

        if (distance < minDistance) {
          minDistance = distance;

          // Get airline code and convert to full name if available
          const airlineCode = flight.airline_icao || flight.airline_iata || 'Unknown';
          const airlineName = airlineNames[airlineCode.toUpperCase()] || airlineCode;

          nearestFlight = {
            icao24: flight.hex || flight.reg_number || 'unknown',
            callsign: flight.flight_icao || flight.flight_iata || 'Unknown',
            origin_country: flight.flag || 'Unknown',
            longitude: flight.lng,
            latitude: flight.lat,
            baro_altitude: flight.alt || 0,
            geo_altitude: flight.alt || 0,
            velocity: flight.speed || 0,
            true_track: flight.dir || 0,
            vertical_rate: flight.v_speed || 0,
            on_ground: flight.status === 'en-route' ? false : true,
            last_contact: Math.floor(Date.now() / 1000),
            distance: Math.round(distance * 100) / 100,
            registration: flight.reg_number || null,
            // Additional data from AirLabs
            departure: flight.dep_iata || flight.dep_icao || 'Unknown',
            arrival: flight.arr_iata || flight.arr_icao || 'Unknown',
            airline: airlineName,
            aircraft: flight.aircraft_icao || 'Unknown'
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
