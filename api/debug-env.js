export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Don't show actual credentials, just check if they exist
  const hasUsername = !!process.env.OPENSKY_USERNAME;
  const hasPassword = !!process.env.OPENSKY_PASSWORD;

  res.status(200).json({
    hasUsername,
    hasPassword,
    usernameLength: process.env.OPENSKY_USERNAME?.length || 0,
    nodeVersion: process.version,
    envKeys: Object.keys(process.env).filter(k => k.includes('OPENSKY'))
  });
}
