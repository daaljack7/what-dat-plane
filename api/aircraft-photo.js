// Serverless function to fetch aircraft photos
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

  const { icao24, registration } = req.query;

  if (!icao24 && !registration) {
    return res.status(400).json({ error: 'Either ICAO24 or registration is required' });
  }

  try {
    // Only proceed if we have a registration number
    // OpenSky Network API is blocked from Vercel, so we can't look up registration from ICAO24
    if (!registration) {
      return res.status(200).json({
        registration: null,
        photoUrl: null,
        thumbnail: null,
        photographer: null,
        message: 'Registration number not available - photo lookup requires aircraft registration'
      });
    }

    const photoResponse = await fetch(
      `https://api.planespotters.net/pub/photos/reg/${registration}`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!photoResponse.ok) {
      return res.status(200).json({
        registration: registration,
        photoUrl: null,
        thumbnail: null,
        photographer: null,
        message: 'No photo found for this aircraft on Planespotters.net'
      });
    }

    const photoData = await photoResponse.json();
    const photo = photoData.photos && photoData.photos.length > 0
      ? photoData.photos[0]
      : null;

    const result = {
      registration: registration,
      photoUrl: photo?.image?.src || null,
      thumbnail: photo?.thumbnail?.src || null,
      photographer: photo?.photographer || null,
      link: photo?.link || null,
    };

    res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching aircraft photo:', error);
    res.status(200).json({
      registration: registration || 'unknown',
      photoUrl: null,
      thumbnail: null,
      photographer: null,
      error: 'Photo service temporarily unavailable'
    });
  }
}
