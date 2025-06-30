# Deployment Guide for Render

## Prerequisites
- Render account
- All environment variables configured

## Environment Variables for Render
Set these in your Render dashboard:

```env
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
OPENAI_API_KEY=sk-your_openai_api_key_here
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password_here
PORT=10000
NODE_ENV=production
```

## Deployment Steps

### Option 1: Using render.yaml (Recommended)
1. Push your code to GitHub
2. Connect your repository to Render
3. Render will automatically detect the `render.yaml` file
4. Set your environment variables in the Render dashboard

### Option 2: Manual Configuration
1. Create a new Web Service in Render
2. Connect your GitHub repository
3. Set the following:
   - **Build Command**: `cd apps/api && npm install && npm run build`
   - **Start Command**: `cd apps/api && npm start`
   - **Environment**: Node
   - **Root Directory**: Leave empty (uses repo root)

## Important Notes

### Port Configuration
- Render uses port 10000 by default
- Update your `PORT` environment variable to `10000`
- Update your Stripe webhook URL to point to your Render domain

### Puppeteer Configuration
The app uses Puppeteer for PDF generation. The configuration automatically:
- Uses system Chrome in production (`/usr/bin/google-chrome-stable`)
- Installs Chrome during build process
- Uses appropriate flags for serverless environment

### Webhook URL
After deployment, update your Stripe webhook endpoint to:
```
https://your-app-name.onrender.com/webhook
```

### Frontend Configuration
Update your frontend API calls to point to your Render backend:
```typescript
const response = await fetch('https://your-app-name.onrender.com/checkout', {
  // ... rest of your fetch config
});
```

## Troubleshooting

### Build Issues
- Ensure all dependencies are installed
- Check that the shared package builds successfully
- Verify TypeScript compilation

### Puppeteer Issues
If you see Chrome/Chromium errors:
- The build script automatically installs Chrome
- System Chrome is used in production
- Check Render logs for detailed error messages

### Runtime Issues
- Check environment variables are set correctly
- Verify the port is set to 10000
- Check Render logs for detailed error messages

### Shared Package Issues
The monorepo structure is handled by:
- TypeScript path mapping in `apps/api/tsconfig.json`
- Build script that builds shared package first
- Runtime path resolution with `tsconfig-paths` 