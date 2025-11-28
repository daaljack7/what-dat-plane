// Serverless function to fetch flight track history from OpenSky Network API
import cache from './utils/cache.js';
import { trackRateLimiter, checkRateLimit } from './utils/rateLimit.js';

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
  if (!checkRateLimit(trackRateLimiter, req, res)) {
    return;
  }

  const { icao24 } = req.query;

  if (!icao24) {
    return res.status(400).json({ error: 'ICAO24 address is required' });
  }

  // Create cache key
  const cacheKey = `track:${icao24.toLowerCase()}`;

  // Check cache first
  const cachedData = cache.get(cacheKey);
  if (cachedData) {
    res.setHeader('X-Cache', 'HIT');
    return res.status(200).json(cachedData);
  }

  res.setHeader('X-Cache', 'MISS');

  try {
    const response = await fetch(
      `https://opensky-network.org/api/tracks/all?icao24=${icao24}&time=0`,
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

    // Cache flight track for 2 minutes
    cache.set(cacheKey, data, 120);

    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching flight track:', error);
    res.status(500).json({ error: 'Failed to fetch flight track', details: error.message });
  }
}
