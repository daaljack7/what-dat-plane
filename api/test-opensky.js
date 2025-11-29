export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Simple test - just try to fetch from OpenSky
    const response = await fetch('https://opensky-network.org/api/states/all', {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'WhatDatPlane/1.0'
      }
    });

    const status = response.status;
    const ok = response.ok;

    if (!ok) {
      const errorText = await response.text();
      return res.status(200).json({
        error: 'OpenSky API returned error',
        status: status,
        message: errorText,
        fetchAvailable: typeof fetch !== 'undefined'
      });
    }

    const data = await response.json();

    return res.status(200).json({
      success: true,
      statesCount: data.states ? data.states.length : 0,
      fetchAvailable: typeof fetch !== 'undefined',
      nodeVersion: process.version
    });
  } catch (error) {
    return res.status(200).json({
      error: error.message,
      errorType: error.constructor.name,
      stack: error.stack,
      fetchAvailable: typeof fetch !== 'undefined',
      nodeVersion: process.version
    });
  }
}
