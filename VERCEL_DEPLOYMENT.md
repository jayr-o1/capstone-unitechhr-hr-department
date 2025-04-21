# Deploying UnitechHR to Vercel

This document provides instructions for deploying the UnitechHR application to Vercel.

## Prerequisites

-   A [Vercel account](https://vercel.com/signup)
-   Your code pushed to a Git repository (GitHub, GitLab, or Bitbucket)
-   Your backend API deployed and accessible (if separate from this frontend)

## Deployment Steps

### 1. Connect Your Repository to Vercel

1. Go to [Vercel dashboard](https://vercel.com/dashboard)
2. Click "Add New" > "Project"
3. Import your Git repository
4. Select the repository containing your UnitechHR project

### 2. Configure Project Settings

During the import process, you'll need to configure your project:

1. **Framework Preset**: Select "Vite" from the dropdown menu
2. **Build and Output Settings**:
    - Build Command: `npm run build`
    - Output Directory: `dist`
    - Install Command: `npm install`

### 3. Environment Variables

Add the following environment variables from your `.env` file:

-   `VITE_FIREBASE_API_KEY`
-   `VITE_FIREBASE_AUTH_DOMAIN`
-   `VITE_FIREBASE_PROJECT_ID`
-   `VITE_FIREBASE_STORAGE_BUCKET`
-   `VITE_FIREBASE_MESSAGING_SENDER_ID`
-   `VITE_FIREBASE_APP_ID`
-   `VITE_API_BASE_URL` (Set this to your deployed API URL)

### 4. Deploy

Click "Deploy" to start the deployment process. Vercel will clone your repository, install dependencies, build the project, and deploy it.

### 5. Custom Domain (Optional)

To use a custom domain:

1. Go to your project's dashboard in Vercel
2. Click on "Settings" > "Domains"
3. Add your custom domain and follow the instructions to configure DNS

## API Backend

Remember that your career recommendation API needs to be deployed separately. Options include:

-   Vercel Serverless Functions or Edge Functions
-   Cloud services like AWS Lambda, Google Cloud Functions, or Azure Functions
-   Traditional hosting like Heroku, DigitalOcean, or Railway

Make sure to update the `VITE_API_BASE_URL` environment variable in Vercel to point to your deployed API.

## Troubleshooting

If you encounter issues with the deployment:

1. **Check build logs** in the Vercel dashboard for specific errors
2. **Verify environment variables** are set correctly
3. **Test API connectivity** from the deployed frontend
4. **Check CORS settings** on your backend API to ensure it accepts requests from your Vercel domain

## Continuous Deployment

Vercel automatically deploys when you push changes to your repository. You can configure deployment settings in the Vercel dashboard:

-   Go to your project's "Settings" > "Git"
-   Configure which branches trigger production and preview deployments
