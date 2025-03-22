import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import AccountLayout from "./components/AccountLayout"; // Import the new AccountLayout
import Dashboard from "./pages/Dashboard";
import Recruitment from "./pages/Recruitment";
import JobDetails from "./pages/RecruitmentModule/JobDetails"; // Import the JobDetails component
import ApplicantDetails from "./pages/RecruitmentModule/ApplicantDetails"; // Import the ApplicantDetails component
import Onboarding from "./pages/Onboarding";
import Employees from "./pages/Employees";
import Clusters from "./pages/Clusters";
import Profile from "./pages/Profile"; // Import the Profile component
import Subscription from "./pages/Subscription"; // Import the Subscription component
import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import { JobProvider } from "./contexts/JobContext"; // Import JobProvider
import AuthProvider, { useAuth } from "./contexts/AuthProvider";

// Protected Route component
const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();
    
    // If still loading auth state, show nothing (or a loader)
    if (loading) return null;
    
    // If user is not authenticated, redirect to login
    if (!user) return <Navigate to="/" />;
    
    // If authenticated, render the children components
    return children;
};

function AppContent() {
    const { user } = useAuth();

    useEffect(() => {
        // Page refresh detection
        try {
            // First, always mark the refresh flag for immediate availability
            sessionStorage.setItem('isPageRefresh', 'true');
            
            // Then check if it's a genuine page refresh using Performance API
            if (window.performance) {
                const navEntry = performance.getEntriesByType && 
                               performance.getEntriesByType('navigation')[0];
                
                if (navEntry) {
                    // If it's not a reload, clear the flag
                    if (navEntry.type !== 'reload') {
                        sessionStorage.removeItem('isPageRefresh');
                    } else {
                        // If it is a reload, keep the flag for 3 seconds
                        setTimeout(() => {
                            sessionStorage.removeItem('isPageRefresh');
                        }, 3000);
                    }
                }
            }
        } catch (error) {
            console.error("Error in refresh detection:", error);
            // If any error, default to keeping the flag
            setTimeout(() => {
                sessionStorage.removeItem('isPageRefresh');
            }, 3000);
        }
    }, []);

    return (
        <Router>
            <Routes>
                {/* Authentication Routes */}
                {!user ? (
                    <>
                        <Route path="/" element={<AccountLayout />}>
                            <Route index element={<LoginPage />} />
                            <Route path="/signup" element={<SignUpPage />} />
                            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                            <Route path="/reset-password" element={<ResetPasswordPage />} />
                            {/* Redirect to login for any other route if not authenticated */}
                            <Route path="*" element={<Navigate to="/" />} />
                        </Route>
                    </>
                ) : (
                    <>
                        {/* Protected Application Routes */}
                        <Route path="/" element={
                            <ProtectedRoute>
                                <Layout />
                            </ProtectedRoute>
                        }>
                            <Route index element={<Navigate to="/dashboard" />} />
                            <Route path="dashboard" element={<Dashboard />} />

                            {/* Wrap Recruitment and its nested routes with JobProvider */}
                            <Route
                                path="recruitment/*"
                                element={
                                    <JobProvider> {/* Wrap only Recruitment and its children */}
                                        <Routes>
                                            <Route index element={<Recruitment />} />
                                            <Route path=":jobId" element={<JobDetails />} />{" "}
                                            {/* Nested route for JobDetails */}
                                            <Route path=":jobId/:applicantId" element={<ApplicantDetails />} />{" "}
                                            {/* Nested route for ApplicantDetails */}
                                        </Routes>
                                    </JobProvider>
                                }
                            />

                            <Route path="onboarding" element={<Onboarding />} />
                            <Route path="employees" element={<Employees />} />
                            <Route path="clusters" element={<Clusters />} />
                            <Route path="profile" element={<Profile />} />
                            <Route path="subscription" element={<Subscription />} />
                            {/* Add more routes here */}
                        </Route>
                    </>
                )}
            </Routes>
        </Router>
    );
}

function App() {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
}

export default App;