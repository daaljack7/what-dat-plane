export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { address } = req.query;
  
  if (!address) {
    return res.status(400).json({ error: 'Address required' });
  }

  try {
    const url = 'https://nominatim.openstreetmap.org/search?format=json&q=' + encodeURIComponent(address) + '&limit=1';
    const response = await fetch(url, { 
      headers: { 
        'User-Agent': 'WhatDatPlane/1.0',
        'Accept': 'application/json'
      } 
    });
    
    const data = await response.json();
    
    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Address not found' });
    }
    
    return res.status(200).json({ 
      lat: parseFloat(data[0].lat), 
      lon: parseFloat(data[0].lon), 
      display_name: data[0].display_name 
    });
  } catch (error) {
    console.error('Geocode error:', error);
    return res.status(500).json({ error: 'Failed to geocode', details: error.message });
  }
}
