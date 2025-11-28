# Deployment Guide for What Dat Plane

## Quick Start - Deploy to Vercel Now

### Option 1: Deploy via Vercel CLI (Recommended for first deployment)

1. **Install Vercel CLI** (if not installed)
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy to Vercel**
   ```bash
   vercel
   ```

   Answer the prompts:
   - Set up and deploy? → **Yes**
   - Which scope? → **Your account**
   - Link to existing project? → **No**
   - What's your project's name? → **what-dat-plane** (or choose your own)
   - In which directory is your code located? → **./** (press Enter)
   - Want to override settings? → **No**

4. **Deploy to Production**
   ```bash
   vercel --prod
   ```

   You'll get a URL like: `https://what-dat-plane.vercel.app`

### Option 2: Deploy via GitHub (Recommended for continuous deployment)

1. **Create a GitHub repository**
   - Go to [github.com](https://github.com) and create a new repository
   - Name it `what-dat-plane` (or your choice)
   - Don't initialize with README (you already have one)

2. **Push your code to GitHub**
   ```bash
   git remote add origin https://github.com/YOUR-USERNAME/what-dat-plane.git
   git branch -M main
   git push -u origin main
   ```

3. **Connect to Vercel**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Click "Import Git Repository"
   - Select your `what-dat-plane` repository
   - Vercel will auto-detect the settings
   - Click "Deploy"

4. **Automatic Deployments**
   - Every push to `main` will automatically deploy
   - Pull requests will get preview deployments
   - You can view all deployments in the Vercel dashboard

## Local Testing Before Deployment

### Test with Vercel Dev (Recommended)

This tests both frontend and backend locally:

```bash
vercel dev
```

Then open: `http://localhost:3000`

This simulates the exact Vercel production environment.

### Test with Vite Dev (Frontend Only)

```bash
npm run dev
```

Note: API calls won't work without `vercel dev` or deployed backend.

### Test the Build

Make sure the build works:

```bash
npm run build
```

## Post-Deployment Steps

### 1. Test Your Deployment

After deploying, test these features:

- [ ] Search by address (e.g., "Times Square, New York")
- [ ] Use current location button
- [ ] View flight details
- [ ] Check flight track visualization
- [ ] Verify altitude graph
- [ ] Test aircraft photo loading

### 2. Set Custom Domain (Optional)

In Vercel dashboard:
1. Go to your project settings
2. Click "Domains"
3. Add your custom domain
4. Follow DNS configuration instructions

### 3. Monitor Performance

Check the Vercel dashboard for:
- Function execution times
- Error rates
- Bandwidth usage
- Cache hit rates

## Environment Configuration

### No Environment Variables Required

The app works out of the box with no configuration needed. All APIs used are free and public.

### Optional: Enhanced OpenSky API Access

For higher rate limits, you can create an OpenSky Network account:

1. Register at [opensky-network.org](https://opensky-network.org)
2. In Vercel project settings, add environment variables:
   - `OPENSKY_USERNAME` = your username
   - `OPENSKY_PASSWORD` = your password
3. Update [api/nearest-flight.js](api/nearest-flight.js) to use authentication

## Troubleshooting

### Build Fails

- Make sure Node.js 18+ is installed
- Delete `node_modules` and run `npm install` again
- Check for any TypeScript/ESLint errors

### API Functions Not Working

- Verify you're using `vercel dev` for local testing
- Check Vercel function logs in the dashboard
- Ensure CORS headers are set correctly

### Rate Limiting Issues

The app has built-in rate limiting. If you hit limits:
- Wait 60 seconds for limits to reset
- Consider using OpenSky Network authentication
- Adjust rate limits in [api/utils/rateLimit.js](api/utils/rateLimit.js)

### Caching Issues

To clear cache:
- Caches are in-memory and reset with each deployment
- Wait for cache TTL to expire
- Redeploy to clear all caches

## Costs

### Vercel Free Tier Includes:
- Unlimited deployments
- 100GB bandwidth/month
- 100GB-hours serverless function execution
- Automatic HTTPS
- Global CDN

For this app, free tier should be sufficient for personal use and moderate traffic.

## Next Steps

1. **Share your app**: Send the Vercel URL to friends
2. **Monitor usage**: Check Vercel dashboard for analytics
3. **Customize**: Edit components, add features
4. **Contribute**: Make the app better and share improvements

## Support

If you encounter issues:

1. Check Vercel function logs in dashboard
2. Review browser console for frontend errors
3. Test API endpoints directly in browser
4. Create an issue on GitHub

## Security Notes

- Rate limiting protects against abuse
- CORS is enabled for public access
- No sensitive data is stored
- All API keys are for public services
- Functions run in isolated environments

---

Happy deploying! Your flight tracker will be live in minutes. ✈️
