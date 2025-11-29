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

  const { icao24, registration, aircraft } = req.query;

  if (!icao24 && !registration && !aircraft) {
    return res.status(400).json({ error: 'ICAO24, registration, or aircraft type is required' });
  }

  try {
    let photoData = null;
    let searchMethod = null;

    // Try registration first if available
    if (registration) {
      const photoResponse = await fetch(
        `https://api.planespotters.net/pub/photos/reg/${registration}`,
        {
          headers: {
            'Accept': 'application/json',
          },
        }
      );

      if (photoResponse.ok) {
        photoData = await photoResponse.json();
        searchMethod = 'registration';
      }
    }

    // If no registration or no photo found, try aircraft type
    if (!photoData && aircraft && aircraft !== 'Unknown') {
      const typeResponse = await fetch(
        `https://api.planespotters.net/pub/photos/type/${aircraft}`,
        {
          headers: {
            'Accept': 'application/json',
          },
        }
      );

      if (typeResponse.ok) {
        photoData = await typeResponse.json();
        searchMethod = 'aircraft_type';
      }
    }

    if (!photoData) {
      return res.status(200).json({
        registration: registration || null,
        aircraft: aircraft || null,
        photoUrl: null,
        thumbnail: null,
        photographer: null,
        message: 'No photo found for this aircraft'
      });
    }

    const photo = photoData.photos && photoData.photos.length > 0
      ? photoData.photos[0]
      : null;

    if (!photo) {
      return res.status(200).json({
        registration: registration || null,
        aircraft: aircraft || null,
        photoUrl: null,
        thumbnail: null,
        photographer: null,
        message: 'No photo found for this aircraft'
      });
    }

    const result = {
      registration: registration || null,
      aircraft: aircraft || null,
      photoUrl: photo?.image?.src || null,
      thumbnail: photo?.thumbnail?.src || null,
      photographer: photo?.photographer || null,
      link: photo?.link || null,
      searchMethod: searchMethod,
      isGeneric: searchMethod === 'aircraft_type'
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
