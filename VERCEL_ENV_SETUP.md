# Vercel Environment Variables Setup

When deploying your UnitechHR application to Vercel, you need to configure environment variables to ensure your application works correctly. This document provides instructions for setting up these variables.

## Required Environment Variables

Add the following environment variables in your Vercel project settings:

| Variable                            | Description                  | Example Value                             |
| ----------------------------------- | ---------------------------- | ----------------------------------------- |
| `VITE_FIREBASE_API_KEY`             | Firebase API key             | AIzaSyDqCoNcrw6x3Re-WenJif4xTvipHCc51X4   |
| `VITE_FIREBASE_AUTH_DOMAIN`         | Firebase auth domain         | unitechhr-a66f9.firebaseapp.com           |
| `VITE_FIREBASE_PROJECT_ID`          | Firebase project ID          | unitechhr-a66f9                           |
| `VITE_FIREBASE_STORAGE_BUCKET`      | Firebase storage bucket      | unitechhr-a66f9.firebasestorage.app       |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID | 985756084388                              |
| `VITE_FIREBASE_APP_ID`              | Firebase app ID              | 1:985756084388:web:ff7cb550291f52eae69e31 |
| `VITE_API_BASE_URL`                 | Your deployed API URL        | https://unitechhr-api.example.com         |

## How to Add Environment Variables

1. Go to your Vercel dashboard
2. Select your UnitechHR project
3. Click on "Settings" tab
4. Select "Environment Variables" from the left menu
5. Add each variable with its value
6. Make sure each variable is set to be available in "Production" environment

![Vercel Environment Variables Screenshot](https://vercel.com/docs/images/concepts/build-step/environment-variables.png)

## Environment Variable Types

Vercel allows you to specify which environments (Production, Preview, Development) each variable applies to. For most variables, you'll want them available in all environments, but for the API URL, you might want different values:

-   **Production**: Points to your production API
-   **Preview**: Points to a staging API or preview deployment
-   **Development**: Points to your local development server

## Using Environment Variables in API URLs

The application is set up to use environment variables for API URLs, with fallbacks for local development:

```javascript
// In src/services/careerRecommenderService.js
const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
```

## Verifying Environment Variables

After deployment, you can verify that your environment variables are correctly set up by:

1. Checking the application functionality
2. Using browser developer tools to investigate network requests
3. Looking at the "Functions" logs in Vercel dashboard for any errors

## Updating Environment Variables

If you need to change an environment variable:

1. Go to the Vercel dashboard
2. Navigate to your project's environment variables
3. Edit or add the variable
4. Redeploy your application for the changes to take effect

Environment variables set in the Vercel dashboard will override those in your `.env` and `.env.production` files.
