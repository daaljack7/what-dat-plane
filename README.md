# ✈️ What Dat Plane?

A web application that finds the nearest aircraft to any location using real-time flight data. Built with React + Vite and deployed on Vercel with serverless functions.

## Features

- 🌍 **Location Search**: Search by address or use your current location
- ✈️ **Real-time Flight Data**: Get live aircraft positions from OpenSky Network
- 📊 **Flight Tracking**: View flight paths and altitude profiles
- 📸 **Aircraft Photos**: See photos of aircraft from Planespotters.net
- ⚡ **Fast & Cached**: Intelligent caching to reduce API calls
- 🔒 **Rate Limited**: Built-in rate limiting for API protection

## Tech Stack

### Frontend
- **React 19** - UI framework
- **Vite** - Build tool and dev server
- **CSS3** - Styling with custom components

### Backend
- **Vercel Serverless Functions** - API endpoints
- **Node.js** - Runtime environment

### APIs Used
- **OpenSky Network API** - Real-time flight data
- **Nominatim (OpenStreetMap)** - Geocoding addresses
- **Planespotters.net API** - Aircraft photos

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Git
- A Vercel account (free tier works great)

### Local Development

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd what-dat-plane
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Install Vercel CLI** (if not already installed)
   ```bash
   npm install -g vercel
   ```

4. **Run development server**
   ```bash
   vercel dev
   ```

   This will start both the Vite frontend and serverless functions locally.

5. **Open in browser**
   ```
   http://localhost:3000
   ```

### Alternative Dev Setup (Frontend Only)

If you want to run just the frontend with Vite:

```bash
npm run dev
```

Note: API functions won't work without `vercel dev`.

## Deployment to Vercel

### First Time Setup

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```

   Follow the prompts:
   - Set up and deploy? **Y**
   - Which scope? **Select your account**
   - Link to existing project? **N**
   - Project name? **what-dat-plane** (or your choice)
   - In which directory is your code located? **./**
   - Override settings? **N**

4. **Deploy to production**
   ```bash
   vercel --prod
   ```

### Continuous Deployment with GitHub

1. **Push to GitHub**
   ```bash
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository
   - Vercel will auto-detect the configuration
   - Click "Deploy"

3. **Automatic Deployments**
   - Every push to `main` triggers a production deployment
   - Pull requests get preview deployments

## Project Structure

```
what-dat-plane/
├── api/                      # Vercel serverless functions
│   ├── utils/
│   │   ├── cache.js         # In-memory caching system
│   │   └── rateLimit.js     # Rate limiting middleware
│   ├── nearest-flight.js    # Find nearest aircraft
│   ├── flight-track.js      # Get flight path history
│   ├── geocode.js           # Convert addresses to coordinates
│   └── aircraft-photo.js    # Fetch aircraft photos
├── src/
│   ├── components/          # React components
│   ├── App.jsx             # Main app component
│   ├── main.jsx            # React entry point
│   └── index.css           # Global styles
├── public/                  # Static assets
├── vercel.json             # Vercel configuration
├── vite.config.js          # Vite configuration
└── package.json            # Dependencies
```

## API Endpoints

All API endpoints are serverless functions:

### GET `/api/nearest-flight?lat={lat}&lon={lon}`
Find the nearest aircraft to given coordinates.

### GET `/api/flight-track?icao24={icao24}`
Get flight path history for an aircraft.

### GET `/api/geocode?address={address}`
Convert an address to coordinates.

### GET `/api/aircraft-photo?icao24={icao24}`
Get aircraft photo from Planespotters.net.

## Caching Strategy

- **Flight data**: 30 seconds (flights move quickly)
- **Flight tracks**: 2 minutes
- **Geocoding**: 24 hours (addresses don't change)
- **Aircraft photos**: 7 days (photos rarely change)

## Rate Limiting

- **Flight searches**: 20 requests/minute per IP
- **Geocoding**: 30 requests/minute per IP
- **Track data**: 10 requests/minute per IP

## License

MIT License - feel free to use this project for learning or building your own applications.

## Acknowledgments

- **OpenSky Network** - For providing free real-time flight data
- **OpenStreetMap/Nominatim** - For geocoding services
- **Planespotters.net** - For aircraft photo database
- **Vercel** - For serverless hosting platform
