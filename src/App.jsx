import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Recruitment from "./pages/Recruitment";
import JobDetails from "./pages/RecruitmentModule/JobDetails"; // Import the JobDetails component
import ApplicantDetails from "./pages/RecruitmentModule/ApplicantDetails"; // Import the ApplicantDetails component
import Onboarding from "./pages/Onboarding";
import Employees from "./pages/Employees";
import Clusters from "./pages/Clusters";
import Profile from "./pages/Profile"; // Import the Profile component
import Subscription from "./pages/Subscription"; // Import the Subscription component
import { JobProvider } from "./contexts/JobContext"; // Import JobProvider

function App() {
    useEffect(() => {
        // More reliable way to detect page refresh
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
                {/* Wrap all routes with the Layout component */}
                <Route path="/" element={<Layout />}>
                    <Route index element={<Dashboard />} />
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
            </Routes>
        </Router>
    );
}

export default App;