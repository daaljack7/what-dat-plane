// Serverless function to geocode addresses
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  const { address } = req.query;
  if (\!address) return res.status(400).json({ error: 'Address required' });
  try {
    const r = await fetch('https://nominatim.openstreetmap.org/search?format=json&q='+encodeURIComponent(address)+'&limit=1', { headers: { 'User-Agent': 'WhatDatPlane/1.0' } });
    const data = await r.json();
    if (\!data || data.length === 0) return res.status(404).json({ error: 'Not found' });
    res.status(200).json({ lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon), display_name: data[0].display_name });
  } catch (error) {
    res.status(500).json({ error: 'Failed', details: error.message });
  }
}
