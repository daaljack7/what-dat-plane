// Direct test of OpenSky API with minimal configuration
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    // Try the simplest possible request
    const testUrl = 'https://opensky-network.org/api/states/all?lamin=40&lomin=-75&lamax=41&lomax=-73';

    console.log('Attempting to fetch:', testUrl);

    const response = await fetch(testUrl);

    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);

    if (response.ok) {
      const data = await response.json();
      return res.status(200).json({
        success: true,
        status: response.status,
        statesCount: data.states?.length || 0,
        message: 'OpenSky API is accessible from Vercel!'
      });
    } else {
      const text = await response.text();
      return res.status(200).json({
        success: false,
        status: response.status,
        responseText: text,
        message: 'OpenSky API returned an error'
      });
    }
  } catch (error) {
    console.error('Fetch error:', error);
    return res.status(200).json({
      success: false,
      error: error.message,
      errorName: error.name,
      errorCause: error.cause?.message || 'No cause',
      errorCode: error.cause?.code || 'No code',
      stack: error.stack?.split('\n').slice(0, 5),
      message: 'Failed to connect to OpenSky API'
    });
  }
}
