export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { icao24 } = req.query;
  
  if (!icao24) {
    return res.status(400).json({ error: 'ICAO24 required' });
  }

  try {
    const url = 'https://opensky-network.org/api/tracks/all?icao24=' + icao24 + '&time=0';
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' }
    });
    
    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Track error:', error);
    return res.status(500).json({ error: 'Failed to fetch track', details: error.message });
  }
}
