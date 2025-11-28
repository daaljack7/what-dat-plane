// Serverless function to fetch flight track
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  const { icao24 } = req.query;
  if (\!icao24) return res.status(400).json({ error: 'ICAO24 required' });
  try {
    const r = await fetch('https://opensky-network.org/api/tracks/all?icao24='+icao24+'&time=0');
    const data = await r.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed', details: error.message });
  }
}
