// Serverless function to fetch aircraft photos
// Using Planespotters.net API (free tier available)
import cache from './utils/cache.js';
import { geocodeRateLimiter, checkRateLimit } from './utils/rateLimit.js';

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
  if (!checkRateLimit(geocodeRateLimiter, req, res)) {
    return;
  }

  const { icao24, registration } = req.query;

  if (!icao24 && !registration) {
    return res.status(400).json({ error: 'Either ICAO24 or registration is required' });
  }

  // Create cache key
  const cacheKey = `photo:${icao24 || registration}`;

  // Check cache first (aircraft photos don't change often)
  const cachedData = cache.get(cacheKey);
  if (cachedData) {
    res.setHeader('X-Cache', 'HIT');
    return res.status(200).json(cachedData);
  }

  res.setHeader('X-Cache', 'MISS');

  try {
    // Try to get aircraft registration from ICAO24 if not provided
    let reg = registration;

    if (!reg && icao24) {
      // Use OpenSky API to get aircraft details
      const aircraftResponse = await fetch(
        `https://opensky-network.org/api/metadata/aircraft/icao/${icao24.toLowerCase()}`,
        {
          headers: {
            'Accept': 'application/json',
          },
        }
      );

      if (aircraftResponse.ok) {
        const aircraftData = await aircraftResponse.json();
        reg = aircraftData.registration;
      }
    }

    if (!reg) {
      return res.status(404).json({
        error: 'Could not find registration for aircraft',
        photoUrl: null
      });
    }

    // Use Planespotters.net API to get photo
    // Note: This is a public API but has rate limits
    const photoResponse = await fetch(
      `https://api.planespotters.net/pub/photos/reg/${reg}`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!photoResponse.ok) {
      // If no photo found, return null but don't error
      const result = {
        registration: reg,
        photoUrl: null,
        thumbnail: null,
        photographer: null,
      };

      // Cache negative results for shorter time (1 hour)
      cache.set(cacheKey, result, 3600);

      return res.status(200).json(result);
    }

    const photoData = await photoResponse.json();

    // Get the first photo if available
    const photo = photoData.photos && photoData.photos.length > 0
      ? photoData.photos[0]
      : null;

    const result = {
      registration: reg,
      photoUrl: photo?.image?.src || null,
      thumbnail: photo?.thumbnail?.src || null,
      photographer: photo?.photographer || null,
      link: photo?.link || null,
    };

    // Cache photo data for 7 days (photos rarely change)
    cache.set(cacheKey, result, 604800);

    res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching aircraft photo:', error);

    // Return a graceful response instead of error
    // Photos are nice-to-have, not critical
    const result = {
      registration: registration || 'unknown',
      photoUrl: null,
      thumbnail: null,
      photographer: null,
      error: 'Photo service temporarily unavailable'
    };

    res.status(200).json(result);
  }
}
