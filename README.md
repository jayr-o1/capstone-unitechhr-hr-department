# UnitechHR - HR Management System

UnitechHR is a comprehensive HR Management System built with React, Vite, Firebase, and a custom recommendation engine. This application provides features such as employee management, career path recommendations, skill tracking, and more.

## Features

-   🔐 User authentication and role-based access control
-   👥 Employee profile management
-   📊 Skill tracking and visualization
-   🚀 Career path recommendations
-   📈 Performance tracking
-   🔍 Advanced search and filtering

## Technologies

-   **Frontend**: React, Vite, TailwindCSS
-   **Backend**: Firebase (Authentication, Firestore, Storage)
-   **Recommendation Engine**: Python-based API for career recommendations
-   **Deployment**: Vercel for frontend, various options for the API backend

## Getting Started

### Prerequisites

-   Node.js (v16+)
-   npm or yarn
-   Firebase account
-   Python 3.8+ (for recommendation API)

### Installation

1. Clone the repository

    ```bash
    git clone https://github.com/yourusername/capstone-unitechhr-hr-department.git
    cd capstone-unitechhr-hr-department
    ```

2. Install dependencies

    ```bash
    npm install
    ```

3. Create a `.env` file with your Firebase configuration

    ```
    VITE_FIREBASE_API_KEY=your-api-key
    VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
    VITE_FIREBASE_PROJECT_ID=your-project-id
    VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
    VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
    VITE_FIREBASE_APP_ID=your-app-id
    VITE_API_BASE_URL=http://localhost:8000
    ```

4. Start the development server
    ```bash
    npm run dev
    ```

## Deployment

### Deploying to Vercel

The application is configured for easy deployment to Vercel. See [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) for detailed instructions.

Quick deployment steps:

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Configure environment variables
4. Deploy!

### API Backend Deployment

The recommendation API needs to be deployed separately. See [API_DEPLOYMENT.md](./API_DEPLOYMENT.md) for instructions on deploying your API backend.

## Environment Variables

For a complete list of environment variables and how to set them up in Vercel, see [VERCEL_ENV_SETUP.md](./VERCEL_ENV_SETUP.md).

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
