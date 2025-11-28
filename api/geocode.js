// Serverless function to geocode addresses using Nominatim (OpenStreetMap)
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

  const { address } = req.query;

  if (!address) {
    return res.status(400).json({ error: 'Address is required' });
  }

  // Create cache key
  const cacheKey = `geocode:${address.toLowerCase().trim()}`;

  // Check cache first (geocoded addresses rarely change)
  const cachedData = cache.get(cacheKey);
  if (cachedData) {
    res.setHeader('X-Cache', 'HIT');
    return res.status(200).json(cachedData);
  }

  res.setHeader('X-Cache', 'MISS');

  try {
    // Use Nominatim (OpenStreetMap) for geocoding - free and no API key needed
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
      {
        headers: {
          'User-Agent': 'WhatDatPlane/1.0',
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Address not found' });
    }

    const location = data[0];
    const result = {
      lat: parseFloat(location.lat),
      lon: parseFloat(location.lon),
      display_name: location.display_name,
    };

    // Cache geocoded addresses for 24 hours (they don't change often)
    cache.set(cacheKey, result, 86400);

    res.status(200).json(result);
  } catch (error) {
    console.error('Error geocoding address:', error);
    res.status(500).json({ error: 'Failed to geocode address', details: error.message });
  }
}
