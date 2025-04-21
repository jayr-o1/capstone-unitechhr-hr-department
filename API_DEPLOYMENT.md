# Deploying the UnitechHR API Backend

This document provides instructions for deploying the UnitechHR API backend to support the Vercel-hosted frontend.

## Backend Options

There are several options for deploying your API backend:

### 1. Vercel Serverless Functions

If your API is built with Node.js, you can deploy it as serverless functions on Vercel:

1. Create a `api` directory in your project
2. Place your API code in this directory (each file becomes an endpoint)
3. Deploy to Vercel

For more details, see [Vercel Serverless Functions documentation](https://vercel.com/docs/concepts/functions/serverless-functions).

### 2. Traditional Hosting

For Python-based APIs (like your recommendation system), you can use:

-   [Heroku](https://www.heroku.com/)
-   [DigitalOcean App Platform](https://www.digitalocean.com/products/app-platform)
-   [Railway](https://railway.app/)
-   [Render](https://render.com/)
-   [PythonAnywhere](https://www.pythonanywhere.com/)

## CORS Configuration

**Important:** You must configure CORS on your API to accept requests from your Vercel-hosted frontend.

### For Python (FastAPI)

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://your-vercel-app.vercel.app",  # Your Vercel app domain
        "https://your-custom-domain.com",      # If you have a custom domain
        "http://localhost:5173",              # For local development
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Your routes below
```

### For Node.js (Express)

```javascript
const express = require("express");
const cors = require("cors");
const app = express();

// CORS middleware
app.use(
    cors({
        origin: [
            "https://your-vercel-app.vercel.app", // Your Vercel app domain
            "https://your-custom-domain.com", // If you have a custom domain
            "http://localhost:5173", // For local development
        ],
        credentials: true,
    })
);

// Your routes below
```

## Environment Variables

Depending on your hosting provider, you'll need to set environment variables for:

-   Database connection strings
-   API keys for external services
-   Other secret configuration

## Checking API Connectivity

After deployment, verify your API is accessible:

1. Use a tool like Postman or curl to test your endpoints
2. Check your API from your browser with a simple GET endpoint
3. Update your frontend's `.env` file with the new API URL

```
VITE_API_BASE_URL=https://your-deployed-api.com
```

4. Update your Vercel environment variables with the new API URL

## Continuous Integration/Deployment

Many platforms support automatic deployment from GitHub:

1. Connect your repository to your hosting provider
2. Configure builds and deployments
3. Set up environment variables for production

## Monitoring and Logs

After deployment, you should:

1. Check your application logs for any errors
2. Set up monitoring for API uptime
3. Configure alerts for any issues

## Scaling

If your application grows:

1. Consider database scaling options
2. Look into caching strategies
3. Implement load balancing for high-traffic APIs
